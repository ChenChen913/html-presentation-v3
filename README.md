# html-presentation-v3

把任何主题、大纲或 Markdown 笔记，做成一份**能直接双击打开的单文件 HTML 演示文稿**。

零构建依赖（只引 CDN 字体）、1280×720 基准自动缩放、上下滚动翻页、键盘导航、移动端自适应、页面文字可编辑。

---

## 它能产出什么

- **一个 `.html` 文件** = 一份演示文稿，能邮件附件、能丢网盘、能打印成 PDF。
- 默认 14–17 页，7 种美术风格任选。
- 每一页都严格落在 1280×720 视口里——不出现文字截断、越界、踩 footer 这类常见翻车。

---

## 目录结构

```
SKILL.md                 主 skill 文件（工作流 + 三条铁律 + 风格表 + references 索引）
qa_check.js              逐页几何质检器（Node + playwright-core）：越界 / 截断 / 溢出
rules_check.js           逐页规则质检器：字体 / 字重 / 对比度 / 行高 / 字号 / 引号
references/
  01-设计令牌.md           坐标系 / 字号梯度 / 配色 / 字体 / 装饰规则
  02-三层元素.md           装饰层 · 结构层 · 内容层（+ 控件层）
  03-渐进式披露.md         整本 7:2:1 叙事 + 单页 4 段式动画时序
  04-幻灯片模板.md         8 种 layout 骨架（Cover / Hook / 分栏 / 网格 / 公式 / 引文 / 致谢…）
  05-质量检查清单.md       自查清单 + 已踩过的坑
  06-风格画廊.md           7 种风格对比与选型
  07-中文排印与硬规则.md    调研笔记提炼出的硬数字（字号 / 字重 / 行高 / 对比度 / 标点）
  decks/                  10 份参考 deck（7 种风格 + 07 的 3 份单页式变体）
  decks-before/           改动前的原始版本，用于 diff 对比与回滚
upload/                  参考 deck 的内容源（Markdown 原文）
中文PPT与网页设计调研笔记.md  规则来源，rules_check.js 的检查项都出自这里
```

---

## 两条核心规则（摘自 `references/`）

**三层元素**：装饰层（z=0，背景/形状/模糊，必须 `pointer-events:none`）→ 结构层（z=1，1280×720 帧 + header/footer）→ 内容层（z=10，文字/列表/公式/图片，占视口 60–80%）。

**渐进式披露**：整本按 7:2:1 分配（正文 / 章节封 / 总结致谢）；单页内容按「装饰 → 主标题 → 副标 → 正文 → 强调」分 4 段 stagger 进场；一页只讲一个核心命题。

---

## 质检

两道关卡，出稿后都要过：

```bash
npm install playwright-core

# 1) 几何：元素有没有越出 1280×720 帧、文字有没有被裁切/截断
node qa_check.js --all                        # 跑全部参考 deck
node qa_check.js path/to/deck.html --shots    # 单个 deck，并逐页截图
node qa_check.js --all --offline              # 掐断 CDN 字体，按系统字体回退再测一遍

# 2) 规则：字体栈 / 字重 / 斜体 / 字号 / 行高 / 对比度 / 引号 / 断行
node rules_check.js                           # 跑全部参考 deck
node rules_check.js path/to/deck.html         # 跑单个
```

两个脚本退出码 0 = 全部通过，非 0 = 有问题的 deck 数。

- `qa_check.js` 检测项：越界 / 纵向裁切 / 横向裁切 / 行数截断 / 帧自身溢出。
- `rules_check.js` 检测项：缺少中文字体栈 / AI 默认英文字体 / 字重 >700 / 伪斜体 / 字号过小 / 行高不达标 / 正文字间距 / 纯黑纯白字 / 对比度不足 / 直角引号 / `break-all` / 缺 `text-wrap`。
- **CDN 字体在国内常不可达**，同一份 deck 会因字体到达时机不同而测出不同结果。`qa_check.js` 测量前会等 `document.fonts.ready`；加 `--offline` 可按系统字体回退再测一遍，两条都要绿。

当前仓库内 10 份 deck（137 页）**两道关卡全绿**。
