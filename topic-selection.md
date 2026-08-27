# 出书选题方案：从 docs/ 到一本书

> 成文日期：2026-08-17。
> 输入：`docs/` 全量（394 篇 markdown、343 份 PDF）+ `projects/` 下 28 个参考代码库。
> 本文是选题的决策记录，不是写作大纲；大纲在 §5，样章在 [`sample-chapter-kv-cache.md`](sample-chapter-kv-cache.md)。

---

## 0. 结论先行

1. **素材问题不是不够，是太多。** 主线相关的原创综合约 240 万字符，一本技术书容量 30–40 万字。选题的实际动作是**砍掉约 85%**，不是补内容。
2. **唯一有效的取舍判据是「别人复制不了什么」。** 这个库唯一的护城河是 `projects/` 下 28 个真实 coding agent 的**源码级横向对照**（带 `file:line`）。基于论文和大厂博客的综合（多智能体、控制论、RAG 全景图）虽然体量最大，但读者自己也能做。
3. **选定选题：《Agent Harness 工程：从源码里读出的设计决策》**，17 章，主线是一次 agent 运行的生命周期，每章对应生命周期上的一个真实设计分歧。
4. **三项已决事项**（2026-08-17 确认）：版权与合规无约束，源码细节保留；时效性按 §4 的制度处理；图例统一用 Graphviz 生成 SVG。

---

## 1. 素材盘点：原创部分的真实体量

`wc -w` 对中文严重低估（中文无空格分词），下表按字符数统计，且已排除 `industry-articles/`、`papers/` 这类第三方存档。

| 原创模块 | 字符数 | 文件数 | 性质 |
|---|---|---|---|
| `multi-agent/landscape/` | 639,830 | 14 | 已成书体量，来源为论文+博客 |
| `cybernetics/landscape/` | 332,457 | 11 | 已成书体量，来源为论文+博客 |
| `multi-agent/open-source/` | 283,549 | 21 | 框架剖析，参考手册型 |
| `cloud-agent/` | 271,354 | 12 + 7 图 | **源码级**，方案型 |
| `system-prompts/` | 234,792 | 8 | **源码级**，21 项目横向对照 |
| `rag/prime-agent/` | 160,450 | 7 | **源码级**，单项目深读 |
| `emotion-design/implementation-landscape/` | 140,095 | 17 | 与主线无关 |
| `issue-driven-automation/notes/` | 133,937 | 8 | 专题完整，来源为官方文档 |
| `harness-engineering/notes/` | 111,368 | 8 | **源码级**混合 |
| `architecture-notes/` | 73,739 | 8 | **源码级**，单项目深读 |
| `rag/architecture/` | 58,632 | 12 | 偏薄（均篇 4.9K） |
| `agent-memory/landscape/` | 55,826 | 13 | 偏薄（均篇 4.3K），需扩写 |
| `harness-engineering/kv-cache-and-context-management.md` | 18,713 | 1 | **源码级**，密度最高 |

标注 **源码级** 的合计约 87 万字符，是全书的骨架。

### 不进本书的部分

- `seo/`、`proxy-platform/`、`michong-platform/`、`rich-text-editor/`、`writing-team-platform/`——与主线无关，属自有产品文档。
- `emotion-design/`（140K）——质量不差，但属于另一本书的题材。
- `cybernetics/landscape/`（332K）——只取第 1 章的立论与第 17 章的二阶回路框架，其余不进。理由见 §2。

---

## 2. 选题决策：三个候选与取舍

| | 候选 | 素材现成度 | 护城河 | 保鲜期 | 结论 |
|---|---|---|---|---|---|
| A | **Agent Harness 工程：从源码里读出的设计决策** | 60% | 高 | 中 | **选定** |
| B | 多智能体落地判据 | 85% | 低 | 短 | 否 |
| C | Issue 驱动的自动化交付 | 90% | 中 | 长 | 否（可作后续小书） |

**为什么不选 B。** `multi-agent/landscape/` 是库里最厚的原创（640K），改造成本最低，但两个问题致命：一是素材来源全部公开，任何愿意读 64 篇论文的人都能重做；二是这份调研自己得出的核心结论——「等 token 预算下单 agent 常常打不过多 agent」「debate 常打不过 Self-Consistency」——会让一本以多智能体为主张的书立不住。诚实写就会写成一本劝退书。它更适合作为本书第 12、13 两章。

**为什么不选 C。** `issue-driven-automation/` 完整度最高，但原创只有 14.5 万字符（其余 134K 是 94 篇第三方文章存档），且主题窄，撑死 15 万字的小书。适合本书写完之后单独出。

**为什么选 A。** 2026 年从业者最缺系统答案的问题是「我要自己造一个 coding agent，每个环节该怎么决策」，而这恰好是本库唯一有一手证据的问题。市面上讲框架用法和 prompt 技巧的书不少，讲 28 个真实 agent 内部实现如何分歧的没有。

### 定位（必须写死在封面与前言）

不是框架教程，不是 prompt 技巧集，不是论文综述。是：

> **同一个工程问题，28 个真实 coding agent 分别怎么做、为什么分歧、判据是什么、抄哪个。**

---

## 3. 全书写作规范

### 3.1 每章固定五段结构

1. **这一环解决什么**——大白话，不用术语。
2. **各家怎么做**——源码对照表，每行带 `file:line` 与该项目的 commit。
3. **分歧在哪、判据是什么**——把选择条件写成可判定的形式。
4. **反面证据与失败模式**——实测打脸的结论、已知 bug、被推翻的做法，与正面方案同等篇幅。
5. **可抄的最小实现**——数据结构、接口签名、伪代码、参数初值、验收测试。

### 3.2 语言纪律（沿用 `AGENTS.md`）

不发明术语；不用隐喻；不堆砌抽象词；引用理论须附原作者与英文原名；必须用专业术语时先用大白话解释。

### 3.3 图例规范（2026-08-17 决定）

- 全部用 Graphviz DOT 生成 SVG，`.dot` 源码与 `.svg` 一同入库，放 `figures/`。
- 命名 `ch{章号}-{序号}-{slug}.dot|.svg`。
- 单色安全：不靠颜色区分语义，颜色只做强调；印刷转灰度后仍可读。
- 一张图只讲一件事。超过约 15 个节点就拆图。
- 每张图正文里必须有一段文字复述其结论，图挂了不影响阅读。

---

## 4. 时效性制度（2026-08-17 决定）

素材写于 2026-07 前后，`projects/` 已同步到 2026-08-16/17。已实测：**核心 `file:line` 引用仍然精确命中**（当时以 claude-code-sourcemap 里的一处常量为例；2026-08-27 起全书改为闭源口径、不再引用该还原源码，见 `manuscript/STATUS.md`），但**有实质性新机制进来，且有旧描述已被推翻**。

### 4.1 三条硬规则

1. **每章开头必须有「基准」块**，声明：素材复核日期、所引各项目的 commit 短哈希与日期、模型/API 规格的官方文档基准日期。
2. **每条版本敏感事实带行内标记** `[核 YYYY-MM-DD]`。版本敏感 = 涉及某项目当前实现、某 API 的价格/限额/参数名、某协议的版本号。
3. **单列一节「哪些会过期、怎么自己复核」**，给出复核命令，让读者自己能验。

### 4.2 已发现的漂移（第 6 章实例）

复核 `kv-cache-and-context-management.md`（2026-07-29 成文）对照当前代码：

| 项目 | 变化 | 性质 |
|---|---|---|
| goose | #11022 新增 `cache_semantics.rs`，把断点逻辑从各 provider 收口为按 (provider, model) 声明的四类语义；`anthropic.rs` 减 299 行 | **旧描述被取代**，须重写 |
| goose | #11022 新增 `tests/prefix_invariance.rs`（428 行），把「前缀不变」做成可执行断言 | **新增**，且是全章最值得抄的一段 |
| goose | #11179 新增 `prompt_cache_disabled`，一次性快模型调用不再支付缓存写入溢价 | **新增**，成本侧新判据 |
| openclaw | #123543 修复能力/频道枚举顺序随插件发现顺序变化导致前缀抖动 | **新增失败模式**，原六条纪律未覆盖 |
| openclaw | 时间处理：底稿称「时间干脆不进 prompt，只给时区」；实际是日期与时区都进 prompt，落在缓存边界**之后**的动态段首，不进 prompt 的是**精确时间**（改用 `session_status` 工具） | **旧描述有误，须修正** |
| hermes | 时区与 UTC offset 进时间戳、"timeless prompts"；注释完整记录了缓存稳定性与正确性的张力（裸日期会让模型在夏令时边界猜错时区） | **旧结论不完整**，须补反面 |
| openclaw | #118262 `refactor: canonicalize cache mechanics` | 待核 |

结论：这套复核制度是必需的，且成本可控——一天之内可复核完一章。

**一条重要的方法论副产品**：`file:line` 是否命中，不足以判断结论是否还成立。上表第 5 项（openclaw 时间处理）的引用一直有效，错的是当初的概括。**复核必须重读代码，不能只跑 grep 校验引用。**

---

## 5. 目录草案与素材映射

主线：**一次 agent 运行的生命周期**。每章 = 生命周期上的一个决策点。

### 第一部分 · 立论（1 章）

| 章 | 主要素材 | 现成度 |
|---|---|---|
| 1. Agent = Model + Harness：可靠性的瓶颈不在模型 | `harness-engineering/reports/LLM Harness Architecture Report.md`（ETCLOVG 七层）、`cybernetics/landscape/07`（Guides–Sensors、Ashby 必要多样性定律） | 高 |

### 第二部分 · 循环（4 章）

| 章 | 主要素材 | 现成度 |
|---|---|---|
| 2. Loop 是显式状态机，不是递归 | `cloud-agent/session-runtime-and-agent-loop.md` §0–2；goose #9574 "Unrolled agent loop" 待并入 | 高 |
| 3. 工具：接口设计、并行执行、错误回填 | 同上 §2；`multi-agent/industry-articles/anthropic_writing-tools-for-agents.md` | 中，需补源码 |
| 4. 用户插话：steer / queue / cancel 三种语义 | 同上 §4.4（pi-mono 双队列、opencode inbox、craft `midStreamBehavior`） | 高 |
| 5. 终止、熔断、重试与 doom loop | 同上 §10–12（Claude Code 恢复链、opencode 错误归一化、Roomote 超时矩阵） | 高 |

### 第三部分 · 上下文（5 章，全书最厚）

| 章 | 主要素材 | 现成度 |
|---|---|---|
| 6. **KV cache 是第一约束** | `harness-engineering/kv-cache-and-context-management.md` + §4.2 的四项更新 | 高（样章已写） |
| 7. **System prompt 的解剖与四个设计决策** | `system-prompts/` 全套（综合 + 7 篇 landscape） | 高 |
| 8. 压缩、checkpoint 与「无限上下文」 | `mimo-code-infinite-context.md`、`rag/prime-agent/01`、opencode compaction/prune | 高 |
| 9. 记忆：七条路线与检索–更新–遗忘 | `agent-memory/landscape/`（偏薄，须扩写） | 低 |
| 10. 代码库检索：agent 里的 RAG 与 LLM Wiki | `rag/architecture/`、`rag/llm-wiki/`、`rag/recall-optimization-deep-dive.md` | 低 |

### 第四部分 · 边界（3 章）

| 章 | 主要素材 | 现成度 |
|---|---|---|
| 11. 权限、沙箱与不可信输入三道防线 | `agent-security/`（**仅 28 份 PDF，零原创**）、`cloud-agent/harness-agent-scm-issue-integration.md` 的不可信文本节 | 最低，几乎全新写 |
| 12. 要不要拆 agent：判据与反面证据 | `multi-agent/landscape/01`（token 经济学）、`04`（上下文隔离）、`09` | 高，需 640K 压成 1 章 |
| 13. 协议：MCP / A2A / AG-UI 三条正交轴 | `multi-agent/protocols/` | 高，**事实须整体重核**（库内已标注 5 篇协议 PDF 全部过时） |

### 第五部分 · 运行时（3 章）

| 章 | 主要素材 | 现成度 |
|---|---|---|
| 14. Session Runtime：事件溯源、WAL 与崩溃恢复 | `cloud-agent/session-runtime-best-practice.md`、`pi-harness-v2-deep-dive.md` | 高 |
| 15. 从单机到云端：多租户与三档 Session 载体 | `cloud-agent/harness-agent-cloud-proposal.md` + review | 高 |
| 16. 接进交付流水线：issue 进、PR 出 | `issue-driven-automation/report.md` + notes | 高 |

### 第六部分 · 收口（1 章）

| 章 | 主要素材 | 现成度 |
|---|---|---|
| 17. 评测与二阶回路：先有评测，再谈演化 | `benchmarks/`（**零原创**）、Meta-Harness / AHE 论文、`cybernetics/landscape/07` §5、goose `prefix_invariance` 与 pi-mono `validPrefixes` 两种测试法 | 低 |

### 现成度汇总

- 高（可直接改写）：11 章
- 中（需补源码调研）：1 章
- 低（须大量新写）：5 章——第 9、10、11、17 章是主要工作量，其中**第 11 章安全是最大缺口**（该目录零原创）。

---

## 6. 全书的诚实边界（写进前言）

1. **本书的证据是「设计正确性」证据，不是「效果」证据。** 库里记录的是各家源码怎么写、注释怎么解释，不是「写成这样效果好多少」。除了少数厂商自报数字（Manus 的 100:1 输入输出比、Anthropic 的 90.2% 提升），没有本书自测的对照实验。
2. **缺生产运营数据**：没有失败复盘、没有成本实测、没有长周期稳定性数据。
3. **缺国内第一方工程实践**：`multi-agent/README.md` 已记录这一缺口（仅获得美团 1 篇官方工程博客）。
4. **样本有偏**：28 个项目全部是能拿到源码的，闭源商业 agent（Devin、Cursor 服务端）只能靠公开材料推断。

---

## 7. 下一步

1. ✅ 样章第 6 章已写 → [`sample-chapter-kv-cache.md`](sample-chapter-kv-cache.md)
2. 第 7 章（System prompt）按同一格式写第二篇样章，验证格式在「分歧型」章节上同样成立（第 6 章是「共识型」）
3. 第 11 章（安全）启动独立源码调研——这是全书最大缺口
4. 第 13 章（协议）事实整体重核，MCP / A2A 版本以官方 spec 为准
5. 建立复核脚本：把 §4 的 `file:line` 校验做成可重复执行的检查
