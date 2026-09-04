/**
 * rules_check.js —— 按《中文排印与硬规则》审计 deck 的规则符合度
 * 与 qa_check.js 分工：qa_check 管几何（越界/截断），本脚本管排印（字体/字重/对比度/行高/引号）。
 *
 * 用法:
 *   node rules_check.js                      # 扫 references/decks/ 下全部 deck
 *   node rules_check.js --dir outputs        # 扫指定目录（相对仓库根或绝对路径）
 *   node rules_check.js my-deck.html         # 扫单个文件
 *   node rules_check.js --json > r.json      # 只输出 JSON
 *
 * 退出码 0 = 全部通过；非 0 = 有问题的 deck 数。
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = __dirname;

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const base = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
  if (!fs.existsSync(base)) return undefined;
  for (const d of fs.readdirSync(base).filter(x => x.startsWith('chromium-')).sort().reverse()) {
    const exe = path.join(base, d, 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(exe)) return exe;
  }
}

// ---------------- 页面内审计逻辑 ----------------
const AUDIT = () => {
  const frameSel = window.__FRAME__;
  const frames = [...document.querySelectorAll(frameSel)];
  const issues = [];
  const CN_STACK = /pingfang|hiragino|yahei|han[-\s]?sans|noto[-\s]?sans[-\s]?cjk|system-ui|-apple-system|segoe|source han|思源|苹方|雅黑|黑体|宋体/i;

  const srgb = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const parse = s => {
    const m = (s || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map(x => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const contrast = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const effBg = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { rgb: null, img: true };
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0.5) return { rgb: c.rgb, img: false };
      n = n.parentElement;
    }
    const b = parse(getComputedStyle(document.body).backgroundColor);
    return { rgb: b && b.a > 0.5 ? b.rgb : [255, 255, 255], img: false };
  };

  // 标题判定：h1~h3 或类名含 title / heading / eyebrow / section-num
  const isTitle = el => {
    const t = el.tagName.toLowerCase();
    const cls = (el.className && typeof el.className === 'string') ? el.className : '';
    return /^h[1-3]$/.test(t) || /title|heading|eyebrow|section-num/i.test(cls);
  };
  // 标签 / 副标题 / 页码 / 眉题这类「非正文」角色：加字间距是常规设计，不受正文规则约束
  const isLabelLike = el => {
    const cls = (el.className && typeof el.className === 'string') ? el.className : '';
    if (/tag|label|badge|eyebrow|kicker|caption|sub|author|num|meta|seal/i.test(cls)) return true;
    let n = el;
    for (let i = 0; i < 3 && n; i++, n = n.parentElement) {
      const c = (n.className && typeof n.className === 'string') ? n.className : '';
      if (/cover|footer|header/i.test(c)) return true;
    }
    return false;
  };
  const hasOwnText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  // 美漫描边字：白字 + 黑色硬描边（blur=0 且偏移≥2px）。WCAG 对比度算不出描边，豁免。
  // 柔和阴影（blur>0）不提供可辨识度，不豁免。
  const hasHardOutline = cs => {
    const ts = cs.textShadow;
    if (!ts || ts === 'none') return false;
    return ts.split(/,(?![^()]*\))/).some(part => {
      const nums = (part.match(/-?[\d.]+px/g) || []).map(parseFloat);
      if (nums.length < 2) return false;
      const blur = nums.length >= 3 ? nums[2] : 0;
      return blur === 0 && (Math.abs(nums[0]) >= 2 || Math.abs(nums[1]) >= 2);
    });
  };

  frames.forEach((frame, fi) => {
    const slideNo = window.__SLIDE_NO__ || (fi + 1);
    frame.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (!hasOwnText(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const cls = (el.className && typeof el.className === 'string') ? el.className : '';
      const id = el.tagName.toLowerCase() + (cls ? '.' + cls.trim().split(/\s+/).slice(0, 2).join('.') : '');
      const txt = (el.textContent || '').trim().slice(0, 30);
      const fs = parseFloat(cs.fontSize);
      const fw = parseInt(cs.fontWeight) || 400;
      const lhRaw = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight);
      const lh = lhRaw ? lhRaw / fs : null;
      const push = (kind, detail) => issues.push({ slide: slideNo, id, kind, detail, text: txt });
      const hex = a => '#' + a.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

      // 1. 字体：中文内容必须落在中文系统栈上；AI 默认英文字体禁用
      if (/[一-龥]/.test(txt) && !CN_STACK.test(cs.fontFamily)) push('字体/无中文栈', cs.fontFamily.slice(0, 60));
      if (/Inter|Poppins|Roboto|Montserrat|DM Sans|Geist|Space Grotesk/i.test(cs.fontFamily)) push('字体/AI默认英文字体', cs.fontFamily.slice(0, 60));
      // 2. 中文字重上限 700（800+ 笔画糊成黑块）
      if (fw > 700) push('字重>700', 'font-weight:' + fw);
      // 3. 中文没有真斜体
      if (cs.fontStyle === 'italic' && /[一-龥]/.test(txt)) push('中文斜体', 'font-style:italic');
      // 4. 字号下限（footer/注释类豁免）
      if (/[一-龥]/.test(txt) && fs < 18 && !/footer|hint|note|caption|source/i.test(cls)) push('字号过小', fs + 'px');

      const isBlock = !/^inline$/i.test(cs.display);
      // 只有真正折行的文本才受行高约束：单行展示大字行高紧一点是正常设计
      const multiLine = r.height > lhRaw * 1.5;
      // 5/6. 行高：正文 1.5~1.6，标题 1.15~1.25
      //      inline 元素的 line-height 不决定行盒高度（由父级 strut 决定），跳过
      if (isBlock && multiLine && !isTitle(el) && lh && lh < 1.45 && /[一-龥]/.test(txt)) push('行高偏小', 'line-height:' + lh.toFixed(2) + ' fs=' + fs);
      if (isBlock && multiLine && isTitle(el) && lh && lh > 1.4) push('标题行高过大', 'line-height:' + lh.toFixed(2));
      // 7. 正文字间距：标题、标题内的强调、标签类均不受此限
      let inTitle = false;
      for (let n = el, i = 0; n && i < 3; n = n.parentElement, i++) if (isTitle(n)) { inTitle = true; break; }
      if (!isTitle(el) && !inTitle && !isLabelLike(el) && cs.letterSpacing !== 'normal' && parseFloat(cs.letterSpacing) !== 0 && /[一-龥]/.test(txt)) {
        push('正文有字间距', 'letter-spacing:' + cs.letterSpacing);
      }

      const c = parse(cs.color);
      if (c && c.a > 0.5) {
        const [R, G, B] = c.rgb;
        const stroke = parseFloat(cs.webkitTextStrokeWidth) || 0;
        const bg = effBg(el);
        // 8. 纯黑 / 纯白（描边字豁免）
        if (R === 0 && G === 0 && B === 0) push('纯黑文字', 'color:#000');
        if (R === 255 && G === 255 && B === 255 && bg.rgb && lum(bg.rgb) > 0.5 && stroke === 0 && !hasHardOutline(cs)) {
          push('浅底纯白字', 'color:#fff 在浅底上');
        }
        // 9. 对比度：正文 4.5:1，大文本 3:1
        if (bg.rgb) {
          const ratio = contrast(c.rgb, bg.rgb);
          const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
          const need = large ? 3 : 4.5;
          if (ratio < need && stroke === 0 && !hasHardOutline(cs)) {
            push('对比度不足', ratio.toFixed(2) + ':1 (需 ' + need + ':1) fg=' + hex(c.rgb) + ' bg=' + hex(bg.rgb));
          }
        }
      }
      // 10. 直角引号（横排简体应用 “”）
      if (/[「」『』]/.test(txt)) push('直角引号', txt.match(/[「」『』]/g).join(''));
      // 11. break-all 只留给长 URL / 长 ID
      if (cs.wordBreak === 'break-all') push('word-break:break-all', '');
      // 12. 标题断行优化
      if (isTitle(el) && cs.textWrap !== 'balance' && cs.textWrapStyle !== 'balance' && r.height > fs * 1.6) {
        push('标题未加 text-wrap:balance', '多行标题 height=' + Math.round(r.height));
      }
      // 13. 文本被容器裁切
      if (el.scrollHeight > el.clientHeight + 2 && cs.overflowY !== 'visible') {
        push('文本被容器裁切', `scrollH ${el.scrollHeight} > clientH ${el.clientHeight}`);
      }
    });
  });
  return issues;
};

// ---------------- 主流程 ----------------
(async () => {
  const args = process.argv.slice(2);
  const onlyJson = args.includes('--json');
  const dirArg = args.indexOf('--dir');
  // 注意：--dir 后面那个值是目录名，不是文件名，必须从「文件列表」里排除掉，
  // 否则会把目录本身当成一个 html 去扫，结果永远是 0 条。
  const files = args.filter((a, i) =>
    !a.startsWith('--') && !/^\d+$/.test(a) && !(dirArg >= 0 && i === dirArg + 1));

  let targets = [];
  if (files.length) {
    targets = files.map(f => path.resolve(ROOT, f));
  } else {
    const dir = dirArg >= 0 ? path.resolve(ROOT, args[dirArg + 1]) : path.join(ROOT, 'references', 'decks');
    if (!fs.existsSync(dir)) {
      console.error('目录不存在: ' + dir);
      process.exit(1);
    }
    targets = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort().map(f => path.join(dir, f));
  }
  targets = targets.filter(f => fs.existsSync(f));
  if (!targets.length) {
    console.error('没有找到任何 .html');
    process.exit(1);
  }

  const browser = await chromium.launch(findChrome() ? { executablePath: findChrome() } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  // 掐断外部请求：CDN 字体在国内常不可达，且字体到达时机会让测量结果漂移
  await page.route('**://**', route => {
    const u = route.request().url();
    if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    return route.abort();
  });

  const all = {};
  let bad = 0;
  for (const file of targets) {
    const label = path.relative(ROOT, file).replace(/\\/g, '/');
    await page.goto('file:///' + file.replace(/\\/g, '/'), { waitUntil: 'load' });
    try { await page.waitForLoadState('networkidle', { timeout: 6000 }); } catch (e) {}
    try { await page.evaluate(() => document.fonts.ready); } catch (e) {}
    await page.addStyleTag({
      content: `
      html { scroll-snap-type: none !important; scroll-behavior: auto !important; }
      .slide-inner { transform: none !important; }
      * { animation-duration: .001s !important; transition-duration: .001s !important; }
    `,
    });

    const hasInner = await page.evaluate(() => document.querySelectorAll('.slide-inner').length > 0);
    const issues = [];
    if (hasInner) {
      await page.evaluate(() => document.querySelectorAll('.slide').forEach(s => s.classList.add('visible', 'active', 'in-view')));
      await page.waitForTimeout(300);
      // 逐帧审计：给目标帧打临时标记，审计完再摘掉，这样能拿到准确页号
      const n = await page.evaluate(() => document.querySelectorAll('.slide-inner').length);
      for (let i = 0; i < n; i++) {
        await page.evaluate(i => {
          document.querySelectorAll('[data-audit]').forEach(e => e.removeAttribute('data-audit'));
          document.querySelectorAll('.slide-inner')[i].setAttribute('data-audit', '1');
          window.__FRAME__ = '[data-audit]';
          window.__SLIDE_NO__ = i + 1;
        }, i);
        issues.push(...await page.evaluate(AUDIT));
      }
      await page.evaluate(() => document.querySelectorAll('[data-audit]').forEach(e => e.removeAttribute('data-audit')));
    } else {
      // 单页式：逐页把 .active 切过去，只测当前帧
      const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
      for (let i = 0; i < n; i++) {
        await page.evaluate(i => {
          [...document.querySelectorAll('.slide')].forEach((s, j) => s.classList.toggle('active', j === i));
          window.__FRAME__ = '.slide.active';
          window.__SLIDE_NO__ = i + 1;
        }, i);
        await page.waitForTimeout(180);
        issues.push(...await page.evaluate(AUDIT));
      }
    }

    all[label] = issues;
    if (issues.length) bad++;
    if (!onlyJson) {
      const kinds = {};
      issues.forEach(i => { kinds[i.kind] = (kinds[i.kind] || 0) + 1; });
      console.log(`### ${label}  -> ${issues.length} 条`);
      Object.entries(kinds).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`      ${k}: ${v}`));
    }
  }

  if (onlyJson) {
    console.log(JSON.stringify(all, null, 1));
  } else {
    console.log('\n=====JSON=====');
    console.log(JSON.stringify(all, null, 1));
    console.log(`\n=====SUMMARY=====\n${targets.length - bad}/${targets.length} 个 deck 无问题`);
  }
  await browser.close().catch(() => {});
  process.exit(bad ? 1 : 0);
})();
