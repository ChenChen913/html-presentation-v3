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
SKILL.md              主 skill 文件（工作流 + 三条铁律 + 风格表 + references 索引）
qa_check.js           逐页质检器（Node + playwright-core）
references/
  01-设计令牌.md        坐标系 / 字号梯度 / 配色 / 字体 / 装饰规则
  02-三层元素.md        装饰层 · 结构层 · 内容层（+ 控件层）
  03-渐进式披露.md      整本 7:2:1 叙事 + 单页 4 段式动画时序
  04-幻灯片模板.md      8 种 layout 骨架（Cover / Hook / 分栏 / 网格 / 公式 / 引文 / 致谢…）
  05-质量检查清单.md    6 类自查 + 已踩过的坑
  06-风格画廊.md        7 种风格对比与选型
01创意活泼风/          参考 deck（新粗野主义）
02科技液态玻璃风/       参考 deck（玻璃拟态）
03学术汇报汇报风/       参考 deck（学术栏 + 动态 footer）
04清晰极客风/          参考 deck（Terminal + Matrix 雨）
05可爱漫画风/          参考 deck（漫画分镜）
06TED风格/            参考 deck（强对比大色块）
07诺贝尔风格/          参考 deck（学术期刊）+ 3 份单页式变体
upload/               参考 deck 的内容源（Markdown 原文）
```

---

## 两条核心规则（摘自 `references/`）

**三层元素**：装饰层（z=0，背景/形状/模糊，必须 `pointer-events:none`）→ 结构层（z=1，1280×720 帧 + header/footer）→ 内容层（z=10，文字/列表/公式/图片，占视口 60–80%）。

**渐进式披露**：整本按 7:2:1 分配（正文 / 章节封 / 总结致谢）；单页内容按「装饰 → 主标题 → 副标 → 正文 → 强调」分 4 段 stagger 进场；一页只讲一个核心命题。

---

## 质检

```bash
npm install playwright-core
node qa_check.js --all                 # 跑全部参考 deck
node qa_check.js path/to/deck.html     # 跑单个
node qa_check.js path/to/deck.html --shots   # 额外逐页截图
```

检测项：越界 / 纵向裁切 / 横向裁切 / 行数截断 / 帧自身溢出。退出码 0 表示全部通过。

当前仓库内 10 份 deck（137 页）**全部通过**质检。
