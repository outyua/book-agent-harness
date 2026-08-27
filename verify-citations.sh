#!/usr/bin/env bash
# 全书引用复核脚本
#
# 用法：从仓库根目录运行
#   bash book-agent-harness/verify-citations.sh
#
# 它做三件事：
#   1. 抽出正文里全部 `path/to/file.ext[:行号]` 形式的引用，验证文件是否存在
#      其中 `<仓库>@<提交>/<路径>` 形式是「历史引用」，指该文件已被删除，
#      校验的是 `git cat-file -e <提交>:<路径>` 而不是工作区路径
#   2. 检查各章的体例完整性（基准块、五段结构、过期节、图的文字复述）
#   3. 检查禁用词、重复元话语与高频对仗句式
#
# 覆盖范围（2026-08-17 起分两类）：
#   - 引用路径、禁用词、交叉引用章号：ch*.md + part*.md（六篇部扉页同样受语言纪律约束）
#   - 体例完整性：只查 ch01–ch17。部扉页没有五段结构、没有基准块、没有过期节，
#     照章检查会全部误报——它的体例约束是三段固定结构，见 .review/style-sheet.md §1。
#
# 重要：文件存在 ≠ 结论仍然成立。见 book-agent-harness/editorial-standards.md §7.2。
#      本脚本只能发现「引用失效」，发现不了「引用有效但当初概括错了」。
#      后者只能靠重读代码——这在写作过程中真实发生过两次（见前言）。

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1
MS="book-agent-harness/manuscript"
FAIL=0

echo "═══ 1. 引用路径解析 ═══"
# 末尾两个 grep -v 排除的是文件名模板而非真实引用：path/to/… 是示意路径，YYYY-MM-DD 是日期占位符
grep -ohE '`[a-zA-Z0-9_@./-]+\.(ts|tsx|py|rs|go|swift|kt|sbpl|txt|md|json)(:[0-9]+(-[0-9]+)?)?`' "$MS"/ch*.md "$MS"/part*.md \
  | tr -d '`' | sed 's/:.*//' | sort -u \
  | grep -vE '^(path/to/|\.ts/|index\.md$|/\.well-known/)' \
  | grep -v 'YYYY-MM-DD' > /tmp/book_cites.txt

# 一次性建立 basename 索引（逐条 find 在 28 个仓库上太慢）
echo "  建立文件索引中…"
find projects docs -type f \
     \( -name '*.ts' -o -name '*.tsx' -o -name '*.py' -o -name '*.rs' -o -name '*.go' \
        -o -name '*.swift' -o -name '*.kt' -o -name '*.sbpl' -o -name '*.txt' -o -name '*.md' -o -name '*.json' \) \
     -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/target/*' -not -path '*/dist/*' \
     2>/dev/null | sed 's|.*/||' | sort -u > /tmp/book_basenames.txt

total=0; ok=0; miss=0; hist=0
: > /tmp/book_missing.txt
while read -r p; do
  [ -z "$p" ] && continue
  total=$((total+1))
  # 历史引用：`<仓库>@<提交>/<路径>` 指已从工作区删除的文件，按 <提交>:<路径> 校验，
  # 不校验工作区路径（体例见 .review/style-sheet.md §3「历史引用」）。
  if printf '%s' "$p" | grep -qE '^[A-Za-z0-9_.-]+@[0-9a-f]{7,40}/'; then
    repo=${p%%@*}; rest=${p#*@}; hash=${rest%%/*}; path=${rest#*/}
    if git -C "projects/$repo" cat-file -e "$hash:$path" 2>/dev/null; then
      ok=$((ok+1)); hist=$((hist+1))
    else
      miss=$((miss+1)); echo "$p（历史引用，$hash:$path 在 projects/$repo 里取不到）" >> /tmp/book_missing.txt
    fi
  # 完整路径（projects/ 或 docs/ 下），或章内二次简写引用（basename 存在即可）
  elif [ -e "projects/$p" ] || [ -e "docs/$p" ] || [ -e "$p" ]; then
    ok=$((ok+1))
  elif grep -qxF "$(basename "$p")" /tmp/book_basenames.txt; then
    ok=$((ok+1))   # 简写引用，同章前文已给全路径
  else
    miss=$((miss+1)); echo "$p" >> /tmp/book_missing.txt
  fi
done < /tmp/book_cites.txt
echo "  总计 $total  解析成功 ${ok}（其中历史引用 ${hist}，按 <提交>:<路径> 校验）  未解析 $miss"
if [ "$miss" -gt 0 ]; then
  echo "  ⚠ 未解析清单："; sed 's/^/    /' /tmp/book_missing.txt; FAIL=1
fi

echo
echo "═══ 2. 体例完整性（只查 ch01–ch17，部扉页体例不同，见文件头说明）═══"
SEC2=0
for f in "$MS"/ch0[1-9]*.md "$MS"/ch1*.md; do
  n=$(basename "$f")
  base=$(grep -c '^### 本章基准' "$f")
  over=$(grep -c '哪些会过期' "$f")
  fig=$(grep -c '!\[图' "$f")
  # 检查正文是否对插图有实质性文字解析（图挂了不影响阅读），支持自然图解叙述或标准复述
  narr=$(grep -cE '(的结论用文字复述|图 [0-9]+-[0-9]+.*(展示|说明|概括|对应|表明|自底向上|结构|映射|拓扑|核心|分界线|自左向右|自上而下|自内向外|流程))' "$f")
  bad=""
  [ "$base" -ne 1 ] && bad="$bad 缺基准块"
  [ "$over" -lt 1 ] && bad="$bad 缺过期节"
  [ "$narr" -lt "$fig" ] && bad="$bad 图($fig)与文字解析($narr)数量不符"
  # 图片链接必须相对 manuscript/ 可解析（2026-08-17 曾在第 6 章发现坏链而旧版脚本未报）
  imgbad=$(grep -ohE '!\[[^]]*\]\([^)]+\)' "$f" | sed -E 's/.*\(([^)]+)\).*/\1/' \
    | while read -r ip; do [ -e "$MS/$ip" ] || echo "$ip"; done | tr '\n' ' ')
  [ -n "${imgbad// /}" ] && bad="$bad 图片链接失效: $imgbad"
  if [ -n "$bad" ]; then echo "  ⚠ $n:$bad"; FAIL=1; SEC2=1; fi
done
[ "$SEC2" -eq 0 ] && echo "  全部通过（17 章）"

echo
echo "═══ 3. 语言纪律（ch*.md + part*.md）═══"
BAD_WORDS="赋能 抓手 闭环 颗粒度 底层逻辑 组合拳 双刃剑 护城河 高效 优雅 强大 无缝 极大提升 深度融合 全方位 多维度 生态位 范式转移 颠覆 众所周知 不难看出 不难发现 显而易见 业界普遍认为 毫无疑问 值得注意的是 在一定程度上 某种意义上 或许可以说 综上所述 总而言之 可以直接检查的问题 不做对会怎样 方法提醒 判据 落地 兜底 骨架 护栏 逃生舱 铁律 锚点 一等公民"
hits=0
for w in $BAD_WORDS; do
  c=$(grep -o "$w" "$MS"/ch*.md "$MS"/part*.md 2>/dev/null | wc -l | tr -d ' ')
  if [ "$c" != "0" ]; then echo "  ⚠ 禁用词「${w}」× $c"; grep -n "$w" "$MS"/ch*.md "$MS"/part*.md | head -2 | sed 's/^/    /'; hits=1; FAIL=1; fi
done

# 证据性质必须限定一个完整命题，不能独立充当句首标签。这里有意不禁
# 「表 1-1 的数据为本书测量」这类完整句，只拦句首或前一句结束后的孤立标签。
orphan_evidence_re='(^|[。！？][[:space:]]*)(本书测量|本书推算|本书推断|本书普查|论文实测，?未复现)[[:space:]]*[。！？]([[:space:]]|$)'
if grep -nE "$orphan_evidence_re" "$MS"/ch*.md "$MS"/part*.md >/tmp/book_orphan_evidence.txt 2>/dev/null; then
  echo "  ⚠ 发现脱离具体命题的证据标签"
  head -5 /tmp/book_orphan_evidence.txt | sed 's/^/    /'
  hits=1; FAIL=1
fi

# 这些表达曾在正文中导致对象不明、编辑过程外露或口号替代论证。相比泛查
# 「这个」「那个」，只拦已经确认没有必要保留的高置信短语，避免误伤正常指代。
SLOP_PHRASES="那一行 另一包 那个包 上面那份 下面那份 那个数 引用时会分开标 合起来有个名字 本书要讲的东西 这不是巧合 最重要的一条 先说结论 实证很干脆 就这些 跳不得"
for w in $SLOP_PHRASES; do
  c=$(grep -o "$w" "$MS"/ch*.md "$MS"/part*.md 2>/dev/null | wc -l | tr -d ' ')
  if [ "$c" != "0" ]; then
    echo "  ⚠ 对象不明、编辑备注或口号式表达「${w}」× ${c}"
    grep -n "$w" "$MS"/ch*.md "$MS"/part*.md | head -2 | sed 's/^/    /'
    hits=1; FAIL=1
  fi
done

# 对仗句偶尔用于纠正误解可以保留；同一文件超过两次，通常说明句式已经替代论证。
contrast_re='不是.{0,120}而是|并不是.{0,120}而是|不只是.{0,120}(更|还)|不仅.{0,120}(更|还)'
for f in "$MS"/ch*.md "$MS"/part*.md; do
  c=$(grep -Ec "$contrast_re" "$f" 2>/dev/null || true)
  if [ "$c" -gt 2 ]; then
    echo "  ⚠ $(basename "$f") 对仗句式出现 $c 次（同一文件上限 2 次）"
    grep -nE "$contrast_re" "$f" | head -3 | sed 's/^/    /'
    hits=1; FAIL=1
  fi
done

[ "$hits" -eq 0 ] && echo "  全部通过"

echo
echo "═══ 4. 交叉引用章号（ch*.md + part*.md）═══"
badch=$(grep -oh "第 [0-9]\+ 章" "$MS"/ch*.md "$MS"/part*.md | grep -oE '[0-9]+' | sort -n | uniq | awk '$1>17 || $1<1')
if [ -n "$badch" ]; then echo "  ⚠ 引用了不存在的章：$badch"; FAIL=1; else echo "  全部指向 1–17 章"; fi

echo
echo "═══ 5. 前言《涉及的项目》表 vs 后记 B 项目索引（裁决 33(b)）═══"
# 后记 B 是唯一真相源（.review/adjudications.md 裁决 33）。这里比对两张表的
# 项目名集合与章数，任何一处不一致都报错并列出双方各自的数字。
python3 - "$MS/ch00-preface.md" "$MS/ch99-back-matter.md" <<'PYEOF'
import re, sys

preface_path, backmatter_path = sys.argv[1], sys.argv[2]

# 后记 B：单列一个项目名 + 一个数字的行
b_text = open(backmatter_path, encoding='utf-8').read()
b_section = b_text.split('## B. 项目索引', 1)[1].split('## C.', 1)[0]
b = {}
for line in b_section.splitlines():
    line = line.strip()
    if not line.startswith('|'):
        continue
    cells = [c.strip() for c in line.strip('|').split('|')]
    if len(cells) < 2:
        continue
    name, cnt = cells[0], cells[1]
    if name in ('项目', '---') or not re.fullmatch(r'\d+', cnt):
        continue
    b[name] = int(cnt)

# 前言：两张两列表并排，单元格可能是「A、B、C」配「各 N」
p_text = open(preface_path, encoding='utf-8').read()
p_section = p_text.split('## 涉及的项目', 1)[1].split('## 最后', 1)[0]
p = {}
for line in p_section.splitlines():
    line = line.strip()
    if not line.startswith('|'):
        continue
    cells = [c.strip() for c in line.strip('|').split('|')]
    if len(cells) < 4:
        continue
    pairs = [(cells[0], cells[1]), (cells[2], cells[3])]
    for name, cnt in pairs:
        if not name or name == '项目':
            continue
        cnt = cnt.replace('各', '').strip()
        if not re.fullmatch(r'\d+', cnt):
            continue
        for nm in name.split('、'):
            nm = nm.strip()
            if nm:
                p[nm] = int(cnt)

fail5 = 0
only_b = sorted(set(b) - set(p))
only_p = sorted(set(p) - set(b))
if only_b:
    print(f"  ⚠ 只在后记 B 出现、前言缺失：{only_b}")
    fail5 = 1
if only_p:
    print(f"  ⚠ 只在前言出现、后记 B 缺失：{only_p}")
    fail5 = 1
for name in sorted(set(b) & set(p)):
    if b[name] != p[name]:
        print(f"  ⚠ 「{name}」章数不一致：后记 B={b[name]}，前言={p[name]}")
        fail5 = 1

if fail5 == 0:
    print(f"  两表项目名集合与章数一致（共 {len(b)} 个项目）")
sys.exit(fail5)
PYEOF
if [ $? -ne 0 ]; then FAIL=1; fi

echo
if [ "$FAIL" -eq 0 ]; then echo "✓ 全部检查通过"; else echo "✗ 有检查未通过，见上"; fi
exit $FAIL
