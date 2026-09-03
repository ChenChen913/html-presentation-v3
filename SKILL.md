---
name: html-presentation-v3
description: 从主题、大纲、文档或 Markdown 笔记生成可双击打开的单文件 HTML 演示文稿（1280x720，14-17 页，7 种美术风格任选），支持滚动翻页、键盘导航、移动端自适应、文本可编辑。触发词：做一份 PPT、生成演示文稿、做幻灯片、presentation、slides、deck。
version: 3.0
genre: visual-deck
output: single-file HTML
ref_width: 1280
ref_height: 720
---

# html-presentation-v3

把任何主题/大纲/Markdown 笔记，在 10-20 分钟内做出一份能直接双击打开、上下滚动翻页、单文件零依赖（只引 CDN 字体）的演示文稿。

> 核心承诺
> 1. 一份产出 = 一个 .html 文件，能邮件附件、能丢网盘、能打印为 PDF。
> 2. 每一页都严格落在 1280x720 视口里，不出现文字截断、越界、踩 footer 这类常见翻车。
> 3. 默认遵循「三层元素 + 渐进式披露」两条铁律（见 references/）。

---

## 何时调用本 skill

- 用户说「帮我做一份 PPT / 幻灯片 / 演示文稿 / presentation / deck」
- 用户给了 Markdown 大纲、文章或讲稿，希望整理成讲演形态
- 用户明确指定了 7 种风格之一（见 references/06-风格画廊.md）
- 输出形态 = 单文件 HTML 演示文稿

> 不在范围内：动态交互页面、数据可视化看板、PDF/PPTX 排版、纯海报设计。

---

## 工作流（6 步，不许跳）

| # | 步骤 | 关键产出 | 必读 |
|---|---|---|---|
| 1 | 读懂输入 | 提炼 3-5 个核心命题、确定叙事顺序 | - |
| 2 | 选风格 + 算页数 | 选定 1 种美术风格；按 7:2:1 分配「正文/章节封/总结」 | 06-风格画廊.md |
| 3 | 写大纲 | 14-17 页的页卡（每页 = 一句话主张 + 1-3 个支撑点） | 04-幻灯片模板.md |
| 4 | 选三层 + 落元素 | 每一页套用「结构 / 内容 / 装饰」三层 | 02-三层元素.md |
| 5 | 出 HTML | 复制参考 deck 骨架，替换文案、配色、装饰 | 04-幻灯片模板.md |
| 6 | QA 自检 | 用 Playwright/截图工具跑 4 类检查 | 05-质量检查清单.md |

哪一步不熟，先去看对应 references/*.md；不要靠「我大概知道」直接出 HTML。

---

## 四条铁律（任何风格都适用）

1. 三层分离 - 见 references/02-三层元素.md
   - 结构层（slide frame / header / footer）固定 1280x720。
   - 内容层（文字 / 列表 / 公式 / 图片）占视口 60-80%。
   - 装饰层（背景 / 形状 / 模糊）只能垫在 z=0，绝不压字。
2. 渐进式披露 - 见 references/03-渐进式披露.md
   - 整本：封面 1 → 阶段封 3 → 正文 10-12 → 总结 1 → 致谢 1。
   - 单页：主标题先出 → 副标/编号 stagger 80-120ms → 装饰最后 fade-in。
   - 一页只讲一个核心命题（rule of one）。
3. 必须 QA - 见 references/05-质量检查清单.md
   - 几何：越界 / 截断 / 公式渲染 — 每一页都要过（`qa_check.js`）。
   - 排印：字体栈 / 字重 / 对比度 / 行高 / 引号 — 每一页都要过（`rules_check.js`）。
4. 中文排印硬规则 - 见 references/07-中文排印与硬规则.md
   - 字重封顶 700、中文禁用斜体、横排用弯引号、正文不低于 28px、正文字间距为 0。

---

## 美术风格（7 选 1）

| 编号 | 风格 | 适用场景 | token 来源（读该文件的 `<style>` 段） |
|---|---|---|---|
| 01 | 创意活泼风（新粗野主义） | 社群分享、产品发布 | `references/decks/01-创意活泼风.html` |
| 02 | 科技液态玻璃风 | SaaS / 工具 / 技术分享 | `references/decks/02-科技液态玻璃风.html` |
| 03 | 学术汇报汇报风 | 答辩、研讨会 | `references/decks/03-学术汇报汇报风.html` |
| 04 | 清晰极客风（Terminal） | 工程师向、技术沙龙 | `references/decks/04-清晰极客风.html` |
| 05 | 可爱漫画风 | 教学、童趣、生活向 | `references/decks/05-可爱漫画风.html` |
| 06 | TED 风格 | 公开演讲、发布会 | `references/decks/06-TED风格.html` |
| 07 | 诺贝尔风格 | 学术演讲、论文报告 | `references/decks/07-诺贝尔风格.html` |

> 07 另有 3 份单页式变体 `references/decks/07A/07B/07C-诺贝尔风格-单页式0X.html`（`.active` 切换 + 进度条），不是滚动式，骨架不要混抄。
>
> `references/decks-before/` 是这一批规则修正**之前**的原始版本，用于前后对比与回滚（见 README）。

**怎么选？** 通用三问：① 谁是听众？② 情绪基调？③ 有没有 logo/品牌色？答不出来就回到风格画廊的对比表。

完整色彩 / 字体 / 装饰规则 → 直接读对应 deck 的 `:root { ... }`。

---

## 8 个 references 速查

| 文档 | 什么时候打开 |
|---|---|
| references/01-设计令牌.md | 要写新风格，或不确定配色 / 字号 |
| references/02-三层元素.md | 排版拿不准时 |
| references/03-渐进式披露.md | 不确定一页放多少 / 动画怎么排 |
| references/04-幻灯片模板.md | 不知道这一页用什么 layout |
| references/05-质量检查清单.md | 出 HTML 后必跑 |
| references/06-风格画廊.md | 用户没指定风格时 |
| references/07-中文排印与硬规则.md | **写任何中文文案前**——字号/字重/行高/字体栈/引号/对比度的硬数字 |

---

## 参考 deck 怎么用

`references/decks/` 里每一份 `.html` 都是一份完整可运行的演示文稿：

- 整体骨架（滚动翻页、键盘左右、nav-dots、缩放自适应）— 直接抄
- CSS 变量 / 字体栈 — 直接抄（已全部补上中文系统栈）
- 页面级文案 — 仅作 layout 模板用，必须按用户主题重写，不要保留原主题
- 装饰图元 — 形态可参考，位置和数量按当前页内容调，避免装饰抢戏
- 已修过的典型坑：
  - `overflow-x: auto` 的公式容器会切掉 MathML 下标 → 改 `overflow: visible` + 底部 `padding`
  - `box-sizing` 默认是 `content-box`（不是全局 border-box），`height:100%` + `padding` 会撑破帧 → 显式写 `box-sizing: border-box`
  - 学术 deck 的 footer 会被正文压到帧外 → 收紧 header/li/p margin 与 box padding
  - `<b>/<strong>` 的 UA 样式 `font-weight: bolder` 在父级 700 时解析成 900 → 显式 `b, strong { font-weight: 700 }`
  - 强调字写死白色，遇到白底页就是 1.00:1 完全隐身 → 按底色调度，不要写死
  - 换了字体栈/加了 `text-wrap: pretty` 之后个别页会长高几像素 → 改完必须重跑 `qa_check.js`
  - 扫光/流光装饰用「移动元素」（`left:-100%→200%` + `infinite`）实现 → 父容器 `scrollWidth`
    会随动画相位漂移，同一份 deck 离线全绿、在线报 11 页。改成元素 `inset:0` + 渐变自己走

### 7 个 deck 的差异速览

```
references/decks/
  01-创意活泼风.html           16:9 滚动, 粗野边框 + 强阴影
  02-科技液态玻璃风.html        16:9 滚动, 玻璃面板 + 渐变光晕
  03-学术汇报汇报风.html        16:9 滚动, 学术栏 + 动态 footer 注入
  04-清晰极客风.html            16:9 滚动, Terminal 框 + Matrix 雨背景 canvas
  05-可爱漫画风.html            16:9 滚动, 漫画框 + radial 网点
  06-TED风格.html               16:9 滚动, 强对比红/黑/白大色块
  07-诺贝尔风格.html            16:9 滚动, 学术期刊 + 浮动 footer
  07A-诺贝尔风格-单页式01.html   单页式, .active 切换, 进度条 + 键盘 + 鼠标分区
  07B-诺贝尔风格-单页式02.html   同上（变体 B）
  07C-诺贝尔风格-单页式03.html   同上（变体 C）
```

改动前的原始版本在 `references/decks-before/`：

```bash
diff references/decks-before/01-创意活泼风.html references/decks/01-创意活泼风.html   # 对比
cp references/decks-before/*.html references/decks/                                # 整体回滚
```

---

## 产出规范

- 文件名：{topic-slug}-deck.html（slug 用英文 + 短横线，例：claude-sonnet-overview-deck.html）
- 存放：默认放在 outputs/；用户没指定目录时建 outputs/{slug}/ 并把 HTML 放进去
- 最后一步：用 present_files 把 HTML 路径给用户（HTML 文件会自动预览）
- 不主动 close：用户看完会自己关

---

## 反模式（绝对不要）

- 用 PPT/Keynote 的页码当页数算 — 单页 1 个主张
- 把 **bold** # heading 这种 Markdown 标记直接粘进 HTML — 会被读者看到 ** 字符
- 装饰（背景色块、模糊球）position: absolute 后忘了 pointer-events: none — 挡住点击
- 正文按屏幕习惯给 16-22px — 这是投影稿，中文正文**不低于 28px**，默认 32px
- 字重上 800/900，或给中文加 `font-style: italic` — 前者糊成黑块，后者是伪斜体
- 字体栈里只有 `sans-serif` 或一路 Inter/Roboto — 中文会掉到各机器不同的兜底字形
- 强调色直接照搬品牌色 — 亮色压白底常常只有 2:1，必须按对比度压暗
- 忘了 font-display: swap 兜底 — 中文字体加载失败时一片方块
- 把 vw/vh 写死在内容元素 — 必须用 1280x720 像素基准，再由 ScaleController 缩放

---

## 出稿后必跑：两道检查

出稿后要跑**两个**脚本，它们管的是两类完全不同的问题——只跑 qa_check 会放过字体和对比度事故。

### 1. `qa_check.js` —— 几何（越界 / 截断）

把 deck 加载到 1280x720 无头 Chromium 里**逐页**检测，自动识别滚动式（`.slide-inner`）与单页式（`.slide`）两种形态。

```bash
npm install playwright-core                          # 只需装一次
node qa_check.js outputs/foo/foo-deck.html           # 单个 deck 报告
node qa_check.js outputs/foo/foo-deck.html --shots   # 同时逐页截图到 .qa-shots/
node qa_check.js --all                               # 批量跑本仓库所有 deck
node qa_check.js --all --offline                     # 掐断 CDN，按系统字体回退测
```

检测项：`越界`（元素超出 1280x720 帧，容差 3px）/ `纵向裁切` / `横向裁切` / `行数截断` / `帧自身溢出`。

### 2. `rules_check.js` —— 排印（中文硬规则）

按 `references/07-中文排印与硬规则.md` 逐页核验。默认**掐断一切外部请求**，按系统字体回退测量。

```bash
node rules_check.js                    # 扫 references/decks/ 下全部 deck
node rules_check.js --dir outputs      # 扫指定目录
node rules_check.js --json > r.json    # 只输出 JSON
```

检测项：无中文栈 / AI 默认字体 / 字重 >700 / 中文斜体 / 字号过小 / 行高偏小 /
标题行高过大 / 正文字间距 / 纯黑文字 / 浅底纯白字 / 对比度不足 / 直角引号 /
`word-break: break-all` / 标题未加 balance / 文本被容器裁切。

### 共同约定

- 退出码 0 = 全部通过；非 0 = 有问题的 deck 数。
- 浏览器路径可用 `CHROME_PATH` 指定，否则自动扫 `~/AppData/Local/ms-playwright/chromium-*`。
- **测量前等 `document.fonts.ready`**。CDN 字体到达前后字宽不同，早测会得到假结果——同一份 deck 可能一会儿 0 页问题、一会儿 11 页。
- **优先按离线（系统字体）结果验收**：Google Fonts / jsdelivr 在国内常不可达，那才是客户真正会看到的样子。
- qa_check 里装饰层（`bg- / deco / shape / blob / pattern / watermark / noise / grid-bg / canvas / matrix`）被刻意跳过，别把它当成漏检。
- rules_check 对硬描边字、inline 行高、单行文本、标签类字间距做了豁免，同样不是漏检，清单见 `references/07-中文排印与硬规则.md`。
- 详细排查手法见 `references/05-质量检查清单.md`。
