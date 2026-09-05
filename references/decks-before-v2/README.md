# 第二轮改动前基线备份

这个文件夹是 `references/decks/` 在**第二轮「版式与分栏」改动之前**的完整快照，
用于改动前后对比和回滚。对应 commit `19130fa`。

- 内容：10 份风格网页，与 `references/decks/` 一一对应（文件名相同）。
- 状态：已完成第一轮（排印 / 对比度 / 越界修复），`qa_check` 与 `rules_check` 均全绿，
  但**尚未**处理标题拆行、`.layout-split` 竖排、标题与正文间距、形状容器裁字这四类版式问题。

三个快照的关系：

| 文件夹 | 对应 commit | 含义 |
| --- | --- | --- |
| git 历史 `225fb6f` | `225fb6f` | 原始未修复版本 |
| `references/decks-before/` | — | 第一轮（排印）前 |
| `references/decks-before-v2/` | `19130fa` | 第二轮（版式）前 ← 本文件夹 |

## 这一轮改了什么

| 类别 | 改动前 | 改动后 |
| --- | --- | --- |
| 标题里的硬编码 `<br>` | 29 处 | 13 处（正文页标题 10 处全删、卡片标题删 6 留 6、封面引言 7 处保留） |
| `.layout-split` 分栏 | flex 竖排（7 份 deck 中招） | grid `1fr 1fr`，真左右分栏 |
| 标题与正文间距 | 最大 186px | 0.4~0.6 × 字号 ≈ 19~29px |
| 05 的形状容器装字 | 五角星内接安全区仅 30%×30%，成句被裁 | 短标签用 12 角爆炸框（62%）、成句用硬边徽章（≈92%） |

详见仓库根目录 README 的「第二轮：版式与分栏」。

各份的实际改动量（`diff` 变更行数）：

| 文件 | 行数 | 主要改动 |
| --- | --- | --- |
| 01-创意活泼风 | 46 | 3 处标题去 `<br>`、3 个卡片标题合并、间距、P12 嵌套框改行内高亮 |
| 02-科技液态玻璃风 | 16 | P8 标题归位 + 去标签、3 个卡片标题合并、`.layout-split` |
| 03-学术汇报汇报风 | 4 | 仅 `.layout-split` |
| 04-清晰极客风 | 4 | 仅 `.layout-split` |
| 05-可爱漫画风 | 58 | `.layout-split` + 五角星全面改造（新增 `.burst-badge` / `.slab-badge`） |
| 06-TED风格 | 42 | P4/P6/P9 改单栏、标题左对齐单行、P9 标题顺序纠正 |
| 07-诺贝尔风格 | 46 | P4/P6/P9 重构、间距 186px→24px、行距放大、`.list-loose` |
| 07A / 07B / 07C | 0 | 单页式未改动（本轮问题集中在滚动式 deck） |

> 对比前先确认两份文件的换行符一致。本文件夹已从 git blob 的 LF 统一转成
> CRLF（与 `references/decks/` 一致），否则 `diff` 会把每一行都判为不同。

## 怎么对比

```bash
# 单份对比
diff references/decks-before-v2/07-诺贝尔风格.html references/decks/07-诺贝尔风格.html

# 全部差异概览（只统计改动行数）
for f in references/decks/*.html; do
  b="references/decks-before-v2/$(basename "$f")"
  echo "$(basename "$f"): $(diff "$b" "$f" | grep -c '^[<>]') 行变化"
done
```

## 怎么回滚

```bash
# 回滚单份
cp references/decks-before-v2/07-诺贝尔风格.html references/decks/07-诺贝尔风格.html

# 全部回滚
cp references/decks-before-v2/*.html references/decks/
```

回滚后记得重跑两道门禁确认没有引入新问题：

```bash
export NODE_PATH="D:/01 2026desk/AnyGen PPT/PPT/.workbuddy-ai/tools/node_modules"
node qa_check.js --all --offline
node rules_check.js --dir references/decks
```

注意：回滚会同时退回第一轮的排印修复吗——不会。本快照已经是第一轮之后的状态，
回滚到这里只是撤销版式改动。要回到最原始版本请用 git：`git checkout 225fb6f -- references/decks/`。
