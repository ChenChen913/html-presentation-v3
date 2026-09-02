# 改动前基线备份

这个文件夹是 `references/decks/` 在**应用《中文PPT与网页设计调研笔记》规则之前**的完整快照，用于改动前后对比和回滚。

- 内容：10 份风格网页，与 `references/decks/` 一一对应（文件名相同）。
- 状态：已经完成过一轮「越界 / 截断 / 帧溢出」修复（`qa_check.js --all` 全绿），但**尚未**按调研笔记调整标题排版、字体、中文排印、配色对比度、导出兜底。
- 更早的「原始未修复版本」在 git 历史里（commit `225fb6f`），也在 GitHub 上。

## 怎么对比

```bash
# 单份对比
diff references/decks-before/06-TED风格.html references/decks/06-TED风格.html

# 全部差异概览（只统计改动行数）
for f in references/decks/*.html; do
  b="references/decks-before/$(basename "$f")"
  echo "$(basename "$f"): $(diff "$b" "$f" | grep -c '^[<>]') 行变化"
done
```

## 怎么回滚

```bash
# 回滚单份
cp references/decks-before/06-TED风格.html references/decks/06-TED风格.html

# 全部回滚
cp references/decks-before/*.html references/decks/
```

回滚后记得重跑一次 `node qa_check.js --all` 确认没有引入新的越界问题。
