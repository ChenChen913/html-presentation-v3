#!/usr/bin/env node
/**
 * qa_check.js —— html-presentation-v3 逐页质检器
 *
 * 用法：
 *   node qa_check.js <deck.html>            只输出越界 / 截断报告
 *   node qa_check.js <deck.html> --shots    同时把每一页截图到 .qa-shots/
 *   node qa_check.js --all                  批量跑本仓库里所有参考 deck
 *
 * 依赖：playwright-core（优先读全局，找不到就回落到 .workbuddy-ai/tools/node_modules）
 * 浏览器：env CHROME_PATH，或自动扫描 ~/AppData/Local/ms-playwright 下的 chromium-* 目录
 *
 * 检测项（与 references/05-质量检查清单.md 一一对应）：
 *   1. 越界   —— 元素 rect 超出 1280x720 帧边界（容差 3px）
 *   2. 纵向裁切 / 横向裁切 —— 容器 overflow != visible 且内容被切
 *   3. 行数截断 —— -webkit-line-clamp 生效
 *   4. 帧自身溢出 —— scrollHeight > clientHeight
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// ---------- 解析依赖 ----------
function loadPlaywright() {
  const tries = [
    'playwright-core',
    path.join(__dirname, '.workbuddy-ai', 'tools', 'node_modules', 'playwright-core'),
    path.join(__dirname, 'node_modules', 'playwright-core'),
  ];
  for (const t of tries) {
    try { return require(t); } catch (e) {}
  }
  console.error('[qa_check] 找不到 playwright-core。请先执行：npm install playwright-core');
  process.exit(2);
}
const { chromium } = loadPlaywright();

// ---------- 定位 chromium ----------
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (!fs.existsSync(base)) return undefined;
  const dirs = fs.readdirSync(base).filter(d => d.startsWith('chromium-')).sort().reverse();
  for (const d of dirs) {
    const exe = path.join(base, d, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

// ---------- 页面内注入的检测逻辑 ----------
const PROBE = () => {
  const out = [];
  const frameSel = window.__FRAME__;
  const frames = [...document.querySelectorAll(frameSel)];
  frames.forEach((frame, fi) => {
    const fr = frame.getBoundingClientRect();
    const issues = [];
    frame.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const tag = el.tagName.toLowerCase();
      const cls = (el.className && typeof el.className === 'string') ? el.className : '';
      // 装饰层（背景 / 形状 / 模糊球 / 网点 / canvas）不参与越界判定
      if (/bg-|deco|shape|blob|pattern|watermark|noise|grid-bg|canvas|matrix/i.test(cls)) return;
      const id = tag + (cls ? '.' + cls.trim().split(/\s+/).join('.') : '');
      const tol = 3;
      const escape = [];
      if (r.top < fr.top - tol) escape.push('上溢' + Math.round(fr.top - r.top));
      if (r.bottom > fr.bottom + tol) escape.push('下溢' + Math.round(r.bottom - fr.bottom));
      if (r.left < fr.left - tol) escape.push('左溢' + Math.round(fr.left - r.left));
      if (r.right > fr.right + tol) escape.push('右溢' + Math.round(r.right - fr.right));
      if (escape.length) {
        issues.push({ id, kind: '越界', detail: escape.join(','), text: (el.innerText || '').slice(0, 40) });
      }
      if (cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 2) {
        issues.push({ id, kind: '纵向裁切', detail: `scrollH ${el.scrollHeight} > clientH ${el.clientHeight}`, text: (el.innerText || '').slice(0, 40) });
      }
      if (cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 2) {
        issues.push({ id, kind: '横向裁切', detail: `scrollW ${el.scrollWidth} > clientW ${el.clientWidth}`, text: (el.innerText || '').slice(0, 40) });
      }
      if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') {
        issues.push({ id, kind: '行数截断', detail: 'line-clamp=' + cs.webkitLineClamp, text: (el.innerText || '').slice(0, 40) });
      }
    });
    if (frame.scrollHeight > frame.clientHeight + 2) {
      issues.push({ id: frameSel + '[自身]', kind: '帧纵向溢出', detail: `scrollH ${frame.scrollHeight} > clientH ${frame.clientHeight}`, text: '' });
    }
    if (issues.length) out.push({ slide: fi + 1, issues });
  });
  return out;
};

// ---------- 单 deck 检查 ----------
async function checkOne(page, file, opts) {
  const url = 'file:///' + path.resolve(file).replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'load' });
  try { await page.waitForLoadState('networkidle', { timeout: 6000 }); } catch (e) {}
  // 等字体真正就绪再量：CDN 字体到达前后字宽不同，早测会得到假结果
  try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
  await page.waitForTimeout(1000);

  // 自动判定形态：有 .slide-inner = 滚动式；只有 .slide = 单页式
  const hasInner = await page.evaluate(() => document.querySelectorAll('.slide-inner').length > 0);
  const mode = hasInner ? 'scroll' : 'nav';

  await page.addStyleTag({ content: `
    html { scroll-snap-type: none !important; scroll-behavior: auto !important; }
    .slide-inner { transform: none !important; }
    .nav-dots, .keyboard-hint, .progress-bar, .hint { display: none !important; }
    * { animation-delay: 0s !important; animation-duration: .001s !important; transition-duration: .001s !important;
        animation-iteration-count: 1 !important; animation-fill-mode: forwards !important; }
    /* 伪元素一律不带动效：它们几乎都是装饰（扫光 / 流光 / 噪点）。这类动画若靠位移实现，
       会让父容器的 scrollWidth 随相位漂移，同一份 deck 会测出不同结果。 */
    *::before, *::after { animation: none !important; }
  `});
  let res = [];
  if (mode === 'scroll') {
    await page.evaluate(() => document.querySelectorAll('.slide').forEach(s => s.classList.add('visible', 'active', 'in-view')));
    await page.evaluate(() => { window.__FRAME__ = '.slide-inner'; });
    await page.waitForTimeout(400);
    res = await page.evaluate(PROBE);
  } else {
    // 单页式：把 .active 逐页切过去，只测当前可见帧（不能强行 display:block，否则所有页叠在一起会误报）
    const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
    for (let i = 0; i < n; i++) {
      await page.evaluate(i => {
        const slides = [...document.querySelectorAll('.slide')];
        slides.forEach((s, j) => s.classList.toggle('active', j === i));
        window.__FRAME__ = '.slide.active';
      }, i);
      await page.waitForTimeout(250);
      const one = await page.evaluate(PROBE);
      one.forEach(o => { if (o.issues.length) res.push({ slide: i + 1, issues: o.issues }); });
    }
  }

  // 可选：逐页截图
  if (opts.shots) {
    const outDir = path.join(path.dirname(path.resolve(file)), '.qa-shots',
      path.basename(file, '.html'));
    fs.mkdirSync(outDir, { recursive: true });
    if (mode === 'scroll') {
      const handles = await page.$$('.slide-inner');
      for (let i = 0; i < handles.length; i++) {
        await handles[i].scrollIntoViewIfNeeded();
        await page.waitForTimeout(150);
        await handles[i].screenshot({ path: path.join(outDir, String(i + 1).padStart(2, '0') + '.png') });
      }
    } else {
      const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
      for (let i = 0; i < n; i++) {
        await page.evaluate(i => {
          const slides = [...document.querySelectorAll('.slide')];
          slides.forEach((s, j) => s.classList.toggle('active', j === i));
        }, i);
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(outDir, String(i + 1).padStart(2, '0') + '.png') });
      }
    }
    console.log('  截图 -> ' + outDir);
  }
  return { mode, res };
}

(async () => {
  const args = process.argv.slice(2);
  if (!args.length) {
    console.log('用法: node qa_check.js <deck.html> [--shots] | node qa_check.js --all [--shots]');
    process.exit(1);
  }
  const opts = { shots: args.includes('--shots') };
  const paths = args.filter(a => !a.startsWith('--'));

  let targets = paths;
  if (args.includes('--all')) {
    targets = [];
    // 风格网页统一放在 references/decks/；decks-before 是改动前基线，不参与质检
    const dirsToScan = [path.join(__dirname, 'references', 'decks')];
    for (const d of fs.readdirSync(__dirname)) {
      const full = path.join(__dirname, d);
      if (!fs.statSync(full).isDirectory() || d.startsWith('.') || d === 'references' || d === 'upload' || d === 'outputs' || d === 'node_modules') continue;
      dirsToScan.push(full);
    }
    for (const dir of dirsToScan) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (f.endsWith('.html')) targets.push(path.join(dir, f));
      }
    }
    targets.sort();
  }

  const chrome = findChrome();
  const browser = await chromium.launch(chrome ? { executablePath: chrome } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

  // --offline：掐断一切外部请求，强制走系统字体回退。
  // CDN 字体（Google Fonts / jsdelivr）在国内常不可达，这才是客户真正会看到的样子，
  // 也是唯一的确定性测量方式 —— 否则同一份 deck 会因网络抖动一会儿 0 页问题、一会儿 11 页。
  if (args.includes('--offline')) {
    await page.route('**://**', route => {
      const u = route.request().url();
      if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
      return route.abort();
    });
    console.log('[offline] 已阻断外部请求，按系统字体回退测量\n');
  }

  let bad = 0;
  const report = {};
  for (const t of targets) {
    const label = path.relative(__dirname, path.resolve(t)).replace(/\\/g, '/');
    const { mode, res } = await checkOne(page, t, opts);
    report[label] = res;
    if (res.length) bad++;
    console.log(`### ${label}  [${mode}]  -> ${res.length} 页有问题`);
  }

  console.log('\n=====JSON=====');
  console.log(JSON.stringify(report, null, 1));
  console.log(`\n=====SUMMARY=====\n${targets.length - bad}/${targets.length} 个 deck 无问题`);
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
