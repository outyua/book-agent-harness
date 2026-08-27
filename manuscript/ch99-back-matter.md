# 后记 · 术语表 · 项目索引 · 参考文献

> **关于索引。** 本书不做传统的主题索引，用三张表替代：A 的术语表（按词查它在哪一章定义）、B 的项目索引（按项目查它在哪几章提供了证据）、以及前言《如果你已经有一个，想找问题》的症状查表（按你遇到的现象查该读哪一章）。要按概念找内容，从这三张表进。

---

## A. 术语表

全书统一用词。首次出现处负责定义，此处汇总。**中文译名优先，英文原名附后。**

| 中文 | 英文 | 定义 | 定义章节 |
|---|---|---|---|
| 执行框架 | harness | agent 系统里除模型之外的一切：代码、配置、执行逻辑、工具链、沙箱、上下文管理、恢复机制、安全边界 | 第 1 章 §1.1 |
| 代理循环 | agent loop | 一段管一次运行内部控制流的进程内代码：调模型 → 解析工具调用 → 执行 → 回填 → 判断是否继续 | 第 2 章 §2.1 |
| 会话运行时 | session runtime | 承载循环的环境，管循环管不到的一切：调度、持久化、恢复、事件分发、输入通道、隔离 | 第 2 章 §2.1、第 14 章 |
| 运行载体 | 无固定英文原名 | agent 循环实际跑在什么东西里，分 A/B/C 三档（A 常驻进程内 `Map<sessionId, ManagedSession>` / B serverless 实体——每会话一个对象、平台管唤醒 / C 每会话一个沙箱容器或 microVM——只带最小设备模型的轻量虚拟机、控制面调度）。**本书不使用「执行载体」这个说法**——同一指称两个名字，读者会以为是两档不同的东西 | 第 14 章 §14.2.6 |
| 窄接口 | narrow interface | 循环只通过一组回调或注入函数依赖外部系统（John Ousterhout, *A Philosophy of Software Design*, 2018, ch.4「Modules Should Be Deep」） | 第 2 章 §2.2.2 |
| 前缀匹配 | prefix matching | 缓存按请求前缀逐字节匹配；前缀里任何一个字节变了，其后全部作废 | 第 6 章 §6.1 |
| 断点 | cache breakpoint | 显式断点派 API 中标记缓存位置的标记 | 第 6 章 §6.2.1 |
| 插话 / 排队 | steer / queue | 用户在 agent 运行中输入的两种语义：下一个 turn 边界注入 / 等 run 结束再注入 | 第 4 章 §4.1 |
| 渐进披露 | progressive disclosure | 只把索引放进上下文，详细内容按需加载 | 第 3 章 §3.2.3 |
| 裁剪 | prune | 确定性地清空旧工具输出的正文，保留调用记录 | 第 8 章 §8.2.2 |
| 压缩 | compaction | 用模型把一段历史摘要成较短的表示 | 第 8 章 §8.2.3 |
| 真相源 / 读模型 | source of truth / read model | 完整、权威的记录 / 从权威记录派生、允许丢失部分信息且能够重建的查询结果 | 第 8 章 §8.1（第 14 章 §14.2.1 用同一对概念组织存储） |
| 上下文腐烂 | context rot | 随上下文变长，模型对窗口内信息的召回准确率下降 | 第 8 章 §8.1、第 9 章 §9.1.1 |
| 事件溯源 | event sourcing | 只追加的事件日志是真相源，表是可重建的读模型（Martin Fowler,《Event Sourcing》, 2005） | 第 14 章 §14.2.1 |
| 预写日志 | WAL, Write-Ahead Log | 先写日志再执行副作用 | 第 14 章 §14.2.2 |
| 先写意图记录，再执行副作用 | The effect sandwich | 先把即将执行的操作及其 id 写进日志，执行完成后再记录结果（pi-mono 设计文档 `pi-mono/packages/agent/docs/harness.md:129-137` 的原名为 The effect sandwich） | 第 14 章 §14.2.2 |
| 围栏 | fencing | 用所有者标识拒绝旧执行体的写入 | 第 14 章 §14.2.7 |
| 上下文隔离 | isolate | 把子任务放进独立上下文，只让摘要回到主上下文 | 第 12 章 §12.4 |
| 三项高风险能力 | lethal trifecta | Simon Willison 对以下情况的称呼：系统同时能够访问私有数据、接触不可信内容并对外通信，此时攻击者具备完成攻击所需的条件（2025-06-16） | 第 11 章 §11.1.2 |
| 标签封装与实体转义 | 无固定英文原名 | 把第三方文本放进带标签的块并做实体转义（与第 9、10 章说的「按预算选条目」不是一回事） | 第 11 章 §11.2.1 |
| 混淆代理 | confused deputy | 高权限服务替低权限调用方执行了后者本无权做的操作 | 第 15 章 §15.2.1 |
| 行级安全 | RLS, Row-Level Security | 数据库层强制的按行访问控制 | 第 15 章 §15.2.1 |
| 死循环 | doom loop | 模型反复做同一个无效动作 | 第 5 章 §5.2.3 |
| 试次 | trial | 对一个评测任务的一次尝试 | 第 17 章 §17.2.1 |
| 结果 | outcome | 试次结束时环境的最终状态（区别于轨迹里的自述） | 第 17 章 §17.2.1 |
| 评分器 | grader | 给 agent 表现的某个方面打分的逻辑 | 第 17 章 §17.2.1 |
| 必要多样性定律 | Law of Requisite Variety | 调节器的多样性必须不小于被调节系统的多样性（W. Ross Ashby, *An Introduction to Cybernetics*, 1956） | 第 1 章 §1.3 |
| 数据处理不等式 | Data Processing Inequality | 信息经过任何处理与转发只会丢失，不会增加 | 第 12 章 §12.2.1 |

**本书不为已有机制另造术语。** 上表优先采用源码、规范或论文中的原名；中文没有稳定译法时，先用完整句子解释动作，再给出原文名称。「标签封装与实体转义」直接描述两项操作：把第三方文本放进带标签的块，并对其中的标记字符做实体转义，定义见第 11 章 §11.2.1。

---

## B. 项目索引

调研池 28 个，正文实际引用 23 个，按被引章数排列。未引用的 5 个见前言。

| 项目 | 章数 | 主要贡献的证据 |
|---|---|---|
| opencode | 10 | 终止判定、错误归一化与重试、doom loop、权限规则引擎与 arity、edit 九级匹配级联、prune 的七项检查、inbox 双序号、事件溯源与围栏 |
| pi-mono | 9 | 循环内核与 9 回调、StreamFn 契约、工具错误统一出口、事件序与消息序、steer/followUp 双队列、压缩切点与缓存隔离、WAL 与合法前缀测试、12 种损坏原因 |
| Claude Code | 7 | system prompt 分段注册与显式豁免、条件从句换缓存、恢复链分层、日期记忆化、beta 头锁存、缓存穿透归因、消息排队、记忆的相对陈旧度标注（均为公开文档与公开行为观察，不是源码引用） |
| openclaw | 8 | 缓存边界标记、枚举顺序稳定化、时间放在每轮可变内容中、记忆写入的三项条件与单次最多删除或覆盖 25% 旧条目的限制、写入持久化存储的软阈值、不可信内容的随机边界标记与同形字折叠、云端所有权边界 |
| codebuff | 7 | DI 契约与部署搬迁、终止公式、孤儿 tool_call 剔除点、ripgrep 方法与隐藏目录、code-map |
| MiMo-Code | 7 | 工具描述按模型分化（含相反指导）、滚动双缓冲、截断后保留完整结果读取入口、checkpoint 重建与按需召回、载体适配器 |
| Roomote | 7 | 超时推导而非硬编码、孤儿扫描、不可信文本的标签封装、实体转义与降权规则、task/run 分离、三处状态核对 |
| goose | 7 | 四类缓存语义与安全默认、前缀不变性测试（含反空转断言与种子回归用例）、一次性调用关缓存、展开式循环 |
| kilocode | 6 | 缓存语义白名单、缓存断点的排列方式及其成本、按模型的失败模式 workaround、`kilo-indexing` 的语义检索流程与默认关闭、记忆让位于当前指令的声明、沙箱缺 Windows 实现 |
| kimi-code | 6 | AGENTS.md 完整降权声明、插件指令同构模板、分档提醒、工具调用配对错误的统一识别（400/422）、已关闭的 micro compaction |
| codex | 6 | 三平台沙箱与 deny default、网络策略独立、拒绝识别的诚实边界、世界状态差分、前缀稳定性测试、exec-server 端到端加密 |
| oh-my-pi | 6 | 空闲期冲洗、TTL 取值反转、失效检测三条件、prompt 压缩的 token 存活校验 |
| hermes-agent | 5 | 一会话一构建、日期降级到天及其与正确性的张力、记忆快照冻结与保留式截断 |
| cindy | 4 | 缓存命中率的计算口径、prompt 变更的 PR 阻塞性检查、记忆写入判断标准（描述为空即抛错）、审查子任务的三段标签封装与实体转义 |
| craft-agents-oss | 4 | midStreamBehavior 与两条不变量、乐观状态对账、静态/易变二分 |
| aider | 3 | 心跳保温、few-shot 按模型开关 |
| buzz | 3 | 分类超时、工作目录不是沙箱、关停 drain 的已知缺陷 |
| cloudflare-os | 3 | Durable Object 载体、streamGeneration 世代号、显式声明不支持插话 |
| grok-build | 3 | 薄 system prompt + user message 快照、注入转义、记忆排序的指数衰减与常青来源豁免 |
| OpenMinis | 3 | JSON 键序归一化、保温管理器、事故档案注释 |
| cline | 2 | variant 注册表与快照测试、检索的 ripgrep 探测与纯正则退回 |
| crush | 2 | 静态前动态后 |
| prime-agent | 1 | 用户目标的标签封装与实体转义：三字符转义 + `<untrusted_objective>` 块 + 一句降权声明 |

> **「章数」的口径。** 只统计在正文中直接承担论证的项目引用，不计普查名单中的点名和仅用于交叉说明的项目。fork 路径里的实现计入实际核对的 fork 项目，不重复计给上游项目。前言《涉及的项目》采用同一口径；本表于 2026-08-18 逐项重数。

---

## C. 参考文献

正文用短名，完整题名以本表为准。

### C.1 论文与著作（按章号排序）

论文与著作按正文首现时使用的编号、题名、作者和版本列出；无法确认正式题名的条目会明确标注，不用简称冒充正式书目信息。

| 编号 | 标题 | 用在 |
|---|---|---|
| 无编号 | *Agent Harness Engineering: A Survey*（Li et al., 2026，ETCLOVG 七层）。**确无 arXiv 编号**，TMLR 双盲在审、尚未通过同行评审 [核实于 2026-08-18]。两个可查证入口：作者项目页 `https://picrew.github.io/LLM-Harness/`（给出去匿名的 17 人作者名单，第一作者 Junjie Li）与 OpenReview `https://openreview.net/forum?id=eONq7FdiHa`（对匿名访问设人机验证，本书未直接取到页面）。**不要与 arXiv:2605.29682 混为一谈**，那是另一篇 | 第 1 章 |
| arXiv:2603.28052 | *Meta-Harness: End-to-End Optimization of Model Harnesses*（Lee 等，v1 2026-03-30） | 第 1、17 章 |
| arXiv:2604.25850 | *Agentic Harness Engineering: Observability-Driven Automatic Evolution of Coding-Agent Harnesses*（AHE，Lin 等，v4 2026-05-18） | 第 1、7、9、17 章 |
| arXiv:2601.11868 | *Terminal-Bench: Benchmarking Agents on Hard, Realistic Tasks in Command Line Interfaces*（Merrill、Shaw 等，2026-01-17；本书引的是 2.0 版基准） | 第 1、17 章 |
| — | W. Ross Ashby, *An Introduction to Cybernetics*, 1956 | 第 1 章 |
| — | Roger C. Conant & W. Ross Ashby, *Every Good Regulator of a System Must Be a Model of That System*, International Journal of Systems Science, 1970 | 第 1 章 |
| arXiv:2307.03172 | *Lost in the Middle: How Language Models Use Long Contexts*（Nelson F. Liu 等，TACL 2024） | 第 8 章 |
| arXiv:2410.10813 | *LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory*（Di Wu 等） | 第 9 章 |
| arXiv:2511.03506 | *HaluMem: Evaluating Hallucinations in Memory Systems of Agents*（Ding Chen、Simin Niu 等，v3 2026-01-05） | 第 9 章 |
| arXiv:2510.01353 | *MemTrack: Evaluating Long-Term Memory and State Tracking in Multi-Platform Dynamic Agent Environments*（Darshan Deshpande 等，Patronus AI，2025-10-01，NeurIPS 2025 Workshop SEA） | 第 9 章 |
| arXiv:2604.11364 | *The Missing Knowledge Layer in Cognitive Architectures for AI Agents*（Michaël Roynard，2026-04-13） | 第 9 章 |
| arXiv:2501.13956 | *Zep: A Temporal Knowledge Graph Architecture for Agent Memory*（Preston Rasmussen 等，2025-01-20） | 第 9 章 |
| arXiv:2504.19413 | *Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory*（Prateek Chhikara 等，2025-04-28） | 第 9 章 |
| arXiv:2512.12818 | *Hindsight is 20/20: Building Agent Memory that Retains, Recalls, and Reflects*（Latimer 等，2025-12-14） | 第 9 章 |
| arXiv:2603.03296 | *PlugMem: A Task-Agnostic Plugin Memory Module for LLM Agents*（Ke Yang 等，2026-02-06） | 第 9 章 |
| arXiv:2603.00026 | *ActMem: Bridging the Gap Between Memory Retrieval and Reasoning in LLM Agents*（Zhang 等，2026-02-04） | 第 9、10 章 |
| arXiv:2603.15125 | *From Storage to Steering: Memory Control Flow Attacks on LLM Agents*（MCFA，Xu 等） | 第 9、11 章 |
| arXiv:2605.25480 | *Retrieval as Reasoning: Self-Evolving Agent-Native Retrieval via LLM-Wiki*（Ming 等，v1 2026-05-25，腾讯微信团队） | 第 10 章 |
| arXiv:2604.11243 | Wen 与 Ku；正文采用简称「Knowledge Compounding」，正式标题未确认 | 第 10 章 |
| arXiv:2605.18490 | Cochran；本书正文用的说法是「预注册对照研究」，正式标题未取到（同上） | 第 10 章 |
| arXiv:2404.13208 | *The Instruction Hierarchy: Training LLMs to Prioritize Privileged Instructions*（Wallace 等，2024） | 第 11 章 |
| arXiv:2503.18813 | *Defeating Prompt Injections by Design*（Debenedetti 等，2025） | 第 11 章 |
| arXiv:2603.11088 | *The Attack and Defense Landscape of Agentic AI: A Comprehensive Survey*（Kim 等，2026） | 第 11 章 |
| arXiv:2410.07283 | *Prompt Infection: LLM-to-LLM Prompt Injection within Multi-Agent Systems*（Lee 与 Tiwari，2024） | 第 11 章 |
| arXiv:2604.02460 | *Single-Agent LLMs Outperform Multi-Agent Systems on Multi-Hop Reasoning Under Equal Thinking Token Budgets*（Tran 与 Kiela，v2 2026-04-11） | 第 12 章 |
| arXiv:2601.12307 | *Rethinking the Value of Multi-Agent Workflow: A Strong Single Agent Baseline*（Xu 等，v1 2026-01-18） | 第 12 章 |
| arXiv:2602.03794 | *Understanding Agent Scaling in LLM-Based Multi-Agent Systems via Diversity*（Yang 等，2026-02-03） | 第 12 章 |
| arXiv:2606.00655 | *Scaling Behavior of Single LLM-Driven Multi-Agent Systems*（Li 等，2026-05-30） | 第 12 章 |
| arXiv:2512.08296 | *Towards a Science of Scaling Agent Systems*（Kim 等，v3 2026-04-08） | 第 12 章 |
| arXiv:2502.08788 | *Stop Overvaluing Multi-Agent Debate — We Must Rethink Evaluation and Embrace Model Heterogeneity*（Zhang 等，v3 2025-06-21） | 第 12 章 |
| arXiv:2511.07784 | *Can LLM Agents Really Debate? A Controlled Study of Multi-Agent Debate in Logical Reasoning*（Wu 等，2025-11-11） | 第 12 章 |
| arXiv:2402.05120 | *More Agents Is All You Need*（Li 等，TMLR） | 第 12 章 |
| arXiv:2406.07155 | *Scaling Large Language Model-based Multi-Agent Collaboration*（Qian 等，ICLR 2025；MacNet 是论文里那套系统的名字，不是标题的一部分） | 第 12 章 |
| — | Thomas M. Cover 与 Joy A. Thomas, *Elements of Information Theory*, 1991 初版（数据处理不等式的原始出处） | 第 12 章 |
| arXiv:2504.16736 | *A Survey of AI Agent Protocols*（Yang 等，v3 2025-06-21） | 第 13 章 |
| arXiv:2505.02279 | *A survey of agent interoperability protocols: Model Context Protocol (MCP), Agent Communication Protocol (ACP), Agent-to-Agent Protocol (A2A), and Agent Network Protocol (ANP)*（Ehtesham 等，v2 2025-05-23） | 第 13 章 |
| arXiv:2606.19135 | *A Technical Taxonomy of LLM Agent Communication Protocols*（Sander 等，v1 2026-06-17） | 第 13 章 |
| arXiv:2602.11327 | *Security Threat Modeling for Emerging AI-Agent Protocols: A Comparative Analysis of MCP, A2A, Agora, and ANP*（Anbiaee 等，v2 2026-04-17） | 第 13 章 |
| arXiv:2410.11905 | *A Scalable Communication Protocol for Networks of Large Language Models*（Marro 等，v1 2024-10-14；Agora 是论文里那套协议的名字，不在标题里，按标题搜不到「Agora」） | 第 13 章 |
| arXiv:2603.02277 | *Quantifying Frontier LLM Capabilities for Container Sandbox Escape*（Marchand 等，2026-03-01） | 第 15 章 |
| arXiv:2402.09171 | *Automated Unit Test Improvement using Large Language Models at Meta*（TestGen-LLM，Alshahwan、Harman 等，FSE-SEIP 2024） | 第 16 章 |
| arXiv:2310.06770 | *SWE-bench: Can Language Models Resolve Real-World GitHub Issues?*（Jimenez、Yang 等，Princeton，ICLR 2024） | 第 16 章 |
| arXiv:2410.06992 | *SWE-Bench+: Enhanced Coding Benchmark for LLMs*（Aleithan 等，2024-10-09） | 第 16、17 章 |
| arXiv:2505.23419 | SWE-bench Live | 第 16 章 |
| arXiv:2410.03859 | SWE-bench Multimodal | 第 16 章 |
| arXiv:2504.02605 | Multi-SWE-bench | 第 16 章 |
| arXiv:2502.12115 | SWE-Lancer | 第 16 章 |
| arXiv:2509.05372 | *Adversarial Bug Reports as a Security Risk in Language Model-Based Automated Program Repair*（Przymus、Happe、Cito，2025） | 第 16 章 |
| arXiv:2308.10022 | *Cupid: Leveraging ChatGPT for More Accurate Duplicate Bug Report Detection*（Ting Zhang、Ivana Clairine Irsan 等，SMU） | 第 16 章 |
| — | *Who Should Fix This Bug?*（John Anvik、Lyndon Hiew、Gail C. Murphy，ICSE 2006） | 第 16 章 |
| arXiv:2602.07150 | *On Randomness in Agentic Evals*（Bjarnason、Silva & Monperrus，KTH，v3 2026-03-25，ICLR 2026 Workshop on Agents in the Wild） | 第 17 章 |
| arXiv:2506.09289 | *UTBoost: Rigorous Evaluation of Coding Agents on SWE-Bench*（Yu 等，2025-06-10） | 第 17 章 |
| arXiv:2503.06745 | *Beyond Black-Box Benchmarking: Observability, Analytics, and Optimization of Agentic Systems*（Moshkovich 等，IBM Research，2025-03-09） | 第 17 章 |
| arXiv:2405.14782 | *Lessons from the Trenches on Reproducible Evaluation of Language Models*（Biderman 等，EleutherAI，2024-05-23） | 第 17 章 |
| arXiv:2506.07982 | *τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment*（Barres 等，2025-06-09） | 第 17 章 |
| — | Chris Argyris & Donald A. Schön, *Organizational Learning: A Theory of Action Perspective*, Addison-Wesley, 1978 | 第 17 章 |
| — | Heinz von Foerster 主编, *Cybernetics of Cybernetics: Or, the Control of Control and the Communication of Communication*, BCL Report 73.38, University of Illinois, 1974 | 第 17 章 |

两条说明：

- **有四条本书只取到简称与 arXiv 号**（SWE-bench Live、SWE-bench Multimodal、Multi-SWE-bench、SWE-Lancer 四个基准，见第 16 章 §16.4 反面证据三），英文全名未取证，按编号可以检索到原文。
- **LoCoMo 的书目已取到**：*Evaluating Very Long-Term Conversational Memory of LLM Agents*，Adyasha Maharana 等，arXiv:2402.17753，2024-02-27。第 9 章 §9.4.2 用到的三个分数**不出自该论文**，全是各家厂商自述——本书引用的是 LoCoMo 数据集，不是论文的实验结论，两者不要混。

### C.2 实践者文章、厂商发布物与技术报告

标题一律用《》（斜体只留给 C.1 的论文与著作）。本表只收**在正文承担了具体论断**的实践者与厂商材料；仅作背景提及的材料不列。

| 来源 | 标题 | 用在 |
|---|---|---|
| Birgitta Böckeler / martinfowler.com | 《Harness engineering for coding agent users》（2026-04-02） | 第 1 章 |
| Vivek Trivedy / LangChain Blog | 《The Anatomy of an Agent Harness》（2026-03-10，`https://www.langchain.com/blog/the-anatomy-of-an-agent-harness`） | 第 1 章 |
| Vivek Trivedy / LangChain Blog | 《Improving Deep Agents with harness engineering》（2026-02-17，`https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering`，厂商自述；§1.1 表里 52.8%→66.5% 两个数出自此篇，不是同作者的《The Anatomy of an Agent Harness》） | 第 1 章 |
| Can Bölük / blog.can.ac | 《We improved 15 LLMs at coding in one afternoon. Only the harness changed.》（2026-02-12，`https://blog.can.ac/2026/02/12/the-harness-problem/`，该地址现跳转至 `https://stencil.so/blog/the-harness-problem`） | 第 1 章 |
| Anthropic | 《Writing effective tools for agents — with agents》（2025-09-11） | 第 3 章 |
| Manus（Yichao 'Peak' Ji） | 《Context Engineering for AI Agents: Lessons from Building Manus》（2025-07-18） | 第 6 章 |
| Chroma（Kelly Hong、Anton Troynikov & Jeff Huber） | 《Context Rot: How Increasing Input Tokens Impacts LLM Performance》（技术报告，2025-07-14，`trychroma.com/research/context-rot`；非同行评审，测量代码公开可复跑，`github.com/chroma-core/context-rot`） | 第 8、9 章 |
| OpenAI | 《Dreaming: Better memory for a more helpful ChatGPT》（2026-06-04，厂商自述） | 第 9 章 |
| Microsoft Research | 《PlugMem: Transforming raw agent interactions into reusable knowledge》（2026-03-10，厂商自述；对应论文见 C.1 arXiv:2603.03296） | 第 9 章 |
| Cursor（Stefan Heule、Emily Jia、Naman Jain） | 《Improving agent with semantic search》（2025-11-06，`https://cursor.com/blog/semsearch`，厂商自述；资料快照 2026-08-04） | 第 10 章 |
| Andrej Karpathy | 《LLM Wiki》gist（2026-04-04，`https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f`） | 第 10 章 |
| Simon Willison | 《The lethal trifecta for AI agents: private data, untrusted content, and external communication》（2025-06-16） | 第 11 章 |
| Anthropic | 《How we built our multi-agent research system》（2025-06-13，厂商自述） | 第 12 章 |
| Cognition（Walden Yan） | 《Don't Build Multi-Agents》（2025-06-12，`https://cognition.com/blog/dont-build-multi-agents`） | 第 12 章 |
| LangChain | 《Context Engineering for Agents》（2025-07-02，`https://www.langchain.com/blog/context-engineering-for-agents`） | 第 12 章 |
| Sierra（Neil Rahilly） | 《Context engineering: the key to great agents》（2026-05-05，`https://sierra.ai/blog/context-engineering-the-key-to-great-agents`，客服 agent 厂商自述） | 第 12 章 |
| Anthropic | 《Equipping agents for the real world with Agent Skills》（2025-10-16，`https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills`） | 第 12 章 |
| LangChain 官方文档 | 《Multi-agent architectures》（页面无发布日期，`https://docs.langchain.com/oss/python/langchain/multi-agent`，抓取 2026-07-22） | 第 12 章 |
| Martin Fowler / martinfowler.com | 《Event Sourcing》（2005） | 第 14 章 |
| GitHub | 《WRAP up your backlog with GitHub Copilot coding agent》（Brittany Ellich 与 Jason Etcovitch，2025-12-26）、IssueOps 定义（2025-03） | 第 16 章 |
| Anthropic | 《Claude Code best practices》文档（页面无发布日期，本书抓取 2026-08-04） | 第 16 章 |
| OpenAI | Codex 文档（页面无发布日期，本书抓取 2026-08-04） | 第 16 章 |
| OpenAI（Ryan Lopopolo） | 《Harness engineering: leveraging Codex in an agent-first world》（2026-02-11，厂商自述；§16.4 反面证据五：起初 3 名、后增至 7 名工程师，5 个月产出约百万行代码、约 1,500 个合并 PR） | 第 16 章 |
| OpenAI Forum | 《How OpenAI Engineers use Codex to Tackle Big Projects with Rigor》（2025-12-04，厂商自述；§16.4 反面证据五：OpenAI 内部 Codex 采用率 >92%） | 第 16 章 |
| DORA | 2025 报告（2025-09-23，问卷调查，近 5,000 名从业者） | 第 16 章 |
| METR | 《Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity》（2025-07-10，arXiv:2507.09089，随机对照试验 n=16；发布方已于 2026-02-24 声明属历史快照） | 第 16 章 |
| Thoughtworks | Technology Radar Vol 31（2024-10-23）/ Vol 32（2025-04-02） | 第 16 章 |
| GitHub | 《Optionally skip approval for Copilot coding agent Actions workflows》changelog（2026-03-13，`https://github.blog/changelog/2026-03-13-optionally-skip-approval-for-copilot-coding-agent-actions-workflows/`） | 第 16 章 |
| Google | 《Jules》官方文档与 changelog（产品页 `https://jules.google/`，changelog 2025-06-26 `https://jules.google/docs/changelog/2025-06-26/`；抓取 2026-08-04） | 第 16 章 |
| Cognition（Devin） | 《Devin》官方文档（`https://docs.devin.ai`；页面无发布日期，抓取 2026-08-04） | 第 16 章 |
| Cognition | 《How Cognition Uses Devin to Build Devin》（2026-02-27，厂商自述；§16.4 反面证据五：上周合并 659 个 Devin PR，2025 年最好的一周是 154 个） | 第 16 章 |
| Cognition（Devin） | 《Devin's 2025 Performance Review: Learnings From 18 Months of Agents At Work》（2025-11-14，厂商自述；§16.2.1 判断标准二与 §16.4 反面证据五：PR 合并率 2024 年 34% → 2025 年 67%） | 第 16 章 |
| Cursor | 《Cloud Agents》官方文档（页面无发布日期，`https://cursor.com/docs/cloud-agent`，抓取 2026-08-04） | 第 16 章 |
| Microsoft（VS Code 团队） | 《Issues Triaging》wiki（页面无发布日期，`https://github.com/microsoft/vscode/wiki/Issues-Triaging`，抓取 2026-08-04；§16.5.1 引句 "Triaging an issue usually takes around one business day"） | 第 16 章 |
| Anthropic | 《Demystifying evals for AI agents》（2026-01-09） | 第 17 章 |

### C.3 规范

| 规范 | 版本（本书基准） | 用在 |
|---|---|---|
| MCP | spec revision 2026-07-28 | 第 13 章 |
| A2A | 协议版本 1.0。规范站页头写的发布版本是 `1.0.0`，仓库最新标签是 `v1.0.1`（补丁版，按规范 §3.6 不参与版本协商） | 第 13 章 |
| AG-UI | 无正式 revision 号 | 第 13 章 |
| Anthropic Messages API | 官方文档 2026-07 版 | 第 6 章 |
| RFC 6902（JSON Patch） | — | 第 13 章 |
| Noise 协议框架（Noise Protocol Framework） | Trevor Perrin, 2018；本书未锁定 revision 号，codex 用的具体套件写在源码里 | 第 15 章 |

### C.4 安全公告

第 15 章 §15.4 用它们说明「这一档也会破」，不用来给三档沙箱排优劣；第 16 章 §16.4 反面证据二另引一条（GitHub Copilot，非沙箱运行时，作「注入致 RCE 已真实发生」的实例，2025 年已修复）。各条的前提条件写在正文里。编号与日期取自 NVD。

| 编号 | 运行时 | 日期 | 用在 |
|---|---|---|---|
| CVE-2018-16359 | gVisor | 2018-09-02 | 第 15 章 |
| CVE-2025-2713 | gVisor | 2025-03-28 | 第 15 章 |
| CVE-2020-2026 | Kata Containers | 2020-06-10 | 第 15 章 |
| CVE-2026-44210 | Kata Containers | 2026-07-23 | 第 15 章 |
| CVE-2026-5747 | Firecracker | 2026-04-08 | 第 15 章 |
| CVE-2025-53773 | GitHub Copilot | 2025-08-12（已修复） | 第 16 章 §16.4 反面证据二 |

---

## D. 怎么复核这本书

### D.1 拿到这些项目的代码

正文每章末尾的复核命令默认在 `projects/` 目录中逐项目运行（例如 `cd projects && grep ...`）。这个目录不是本书附带的压缩包，需要把 27 个开源仓库分别克隆到以项目名命名的子目录。下面的脚本执行这项工作。

脚本使用 `--depth 1`，只下载最新提交，足以运行本书大多数命令。目录名默认取仓库名；freebuff 与 pi 会映射为正文使用的 codebuff 与 pi-mono，aaif-goose 的仓库名与正文项目名一致，无需映射。

浅克隆不包含历史提交，直接执行 `checkout <短哈希>` 会失败。需要核实写作时对应版本时，先从各章末尾「项目 commit」表取得短哈希，再执行 `git -C projects/<项目名> fetch --unshallow`；只补一个提交时也可以执行 `git -C projects/<项目名> fetch origin <短哈希>`。随后用 `git -C projects/<项目名> checkout <短哈希>` 切换版本。

以下四类复核需要历史记录：第 2 章 §2.2.3 的两条 codebuff 历史引用；第 7 章 §7.6 待核实清单第 7 项的五条 cline 历史引用（变体注册表文件在 §7.2.5 与 §7.6 各引用一次，`verify-citations.sh` 按路径去重后计为五条）；各章基准块 commit 的逐条校验；D.2 中 `verify-citations.sh` 的历史引用检查。运行这些复核前，先按上一段补齐相应仓库的历史：

```bash
mkdir -p projects && cd projects
repos=(
  Aider-AI/aider QoderAI/better-harness block/buzz makecindy/cindy
  cline/cline cloudflare/cloudflare-os CodebuffAI/freebuff
  openai/codex craft-ai-agents/craft-agents-oss charmbracelet/crush deepseek-ai/deepseek-harness
  withastro/flue aaif-goose/goose xai-org/grok-build herdrdev/herdr
  NousResearch/hermes-agent Kilo-Org/kilocode MoonshotAI/kimi-code huangruiteng/loopx
  XiaomiMiMo/MiMo-Code can1357/oh-my-pi openclaw/openclaw anomalyco/opencode
  OpenMinis/OpenMinis earendil-works/pi PrimeIntellect-ai/prime-agent RooCodeInc/Roomote
)
for repo in "${repos[@]}"; do
  name="${repo##*/}"
  # 仓库改名/迁移的三家（codebuff→freebuff、block→aaif-goose、pi-mono→pi）：
  # 克隆目录名保持正文使用的项目名（codebuff、pi-mono），否则章末命令里的 projects/<项目名> 会失配
  case "$repo" in
    CodebuffAI/freebuff) name="codebuff" ;;
    earendil-works/pi)   name="pi-mono" ;;
  esac
  git clone --depth 1 "https://github.com/$repo.git" "$name"
done
```

Claude Code 不开源，不在这份克隆清单里。本书写到它时依据 Anthropic 官方文档与工程博客，以及对其公开行为的观察；正文没有它的 `file:line` 引用，各章基准块里的「Claude Code」一行写明了这一证据边界。

不想安装 27 个仓库时，可以直接在网页打开单条 `file:line` 引用。地址模板是 `github.com/<用户名>/<仓库名>/blob/<commit>/<路径>#L<行号>`，各章末尾「项目 commit」表提供对应的短哈希。

**codebuff 与 pi-mono 在线上地址中分别使用 `CodebuffAI/freebuff`、`earendil-works/pi`**；本地目录仍使用正文中的项目名，映射关系见前面的克隆脚本。只有需要在全部项目中搜索模式或统计次数的复核命令才必须使用本地仓库，例如第 3、6、9、10 章的普查命令。

### D.2 机器校验：本书内部一致性

**这个脚本只查本书内部的一致性**（引用路径存不存在、体例齐不齐、章号对不对），不需要你克隆任何项目代码就能启动；唯一例外是第 1 项里的 4 条历史引用，要核验 `<提交>:<路径>`，需要对应项目的本地克隆且含全历史（见第 1 项说明）。要核实每一章正文里那些技术结论本身，得用各章末尾写明的复核方法；其中要跑命令的那几类需要 27 个项目的本地代码，见上面 D.1。

`book-agent-harness/verify-citations.sh`。从仓库根目录运行：

```bash
bash book-agent-harness/verify-citations.sh
```

它检查五件事：

1. **引用路径解析**——抽出正文（含六篇分部扉页）全部 `path/file.ext[:行号]`，验证文件存在；写成 `<仓库>@<提交>/<路径>` 的**历史引用**（指该文件已从工作区删除。全书这类引用共 7 处：第 2 章 §2.2.3 两条 codebuff 引用，第 7 章 §7.6 待核实清单第 7 项五条 cline 引用；脚本按 `<仓库>@<提交>/<路径>` 的形式只计到 4 条——cline 四条带扩展名的文件路径，`__tests__/` 目录引用与两条写成 `git show` 命令的 codebuff 引用不在这一项里）改用 `git cat-file -e <提交>:<路径>` 校验。**这一项要求对应项目的克隆含全历史**——照 D.1 用 `--depth 1` 克隆的话，历史提交不在本地，7 条会整批误报失效；先按 D.1 的 fetch 命令补全历史再跑。
2. **体例完整性**（只查第 1–17 章）——每章有基准块、有「哪些会过期」一节、图的数量与文字复述的数量相等、图片链接可解析。分部扉页与前言、后记的体例不同，不在此项内。
3. **语言检查**——一张 12 个词的禁用词表（企业黑话，以及「无需论证」式的套话）的全文扫描。**它不检查断言有没有出处**，那件事没有机器办法，只能靠审读。
4. **交叉引用章号**——全部指向 1–17 章。
5. **前言《涉及的项目》表 vs 本篇 B 项目索引一致性**——两张表的项目名集合与「出现章数」必须逐一相等，本篇 B 表是真相源，不一致即报错（裁决 33(b)）。

**这个脚本发现不了什么**（重要）：它只能发现「引用失效」，发现不了「引用有效但当初的概括是错的」。后者在本书写作过程中真实发生过两次：

- openclaw 的时间处理——`file:line` 一直有效，错的是「时间干脆不进 prompt」这句概括。
- pi-mono 的设计文档——旧名 harness-v2.md 被重命名为 `packages/agent/docs/harness.md`（v2 转正），内容仍在。

**结论：机器校验是必要的下限，不是充分条件。复核必须重读代码。**

### D.3 核实正文里的技术结论

各章章末「版本与复核」（§N.6）是复核入口：基准块给复核日期与 commit，「哪些会过期，怎么自己复核」给方法。**普查型、度量型、时效型断言**——普查范围与判定口径、要实测的常量、协议或规范的当前版本——复核命令就在该章 §N.6 里，照着跑即可。**其余结论**按正文自己的 `file:line` 直接核对源码，或按 D.1 拼 GitHub 网页地址在线核对。

**四章的复核对象不是源码**，同样按各自 §N.6 走。第 12 章核对论文引用页，第 13 章核对规范站点，第 16 章核对平台官方页与你自己仓库，第 17 章检验你自己的评测集。

---

## E. 各章「哪些会过期」速查

按保鲜期归类，方便定期复核时排优先级。

### 最短（用之前必须重查）

- 第 13 章：MCP 的 revision 与内容、A2A 的版本与方法名
- 第 15 章：三类沙箱运行时的 CVE 清单（照 §15.6 的 NVD 查询命令重跑）
- 第 16 章：产品格局表、平台硬约束
- 第 7 章：所有具体的 prompt 措辞

### 短（约一季度）

- 第 6 章：价格、倍率、限额
- 第 8 章：`PRUNE_PROTECT` 等所有常量、压缩触发阈值
- 第 9 章：各项目的记忆常量
- 第 10 章：「本地 agent 基本不建向量索引（12 之 1，默认关闭）」这一普查结论
- 第 11 章：`ARITY` 字典、「只有 X 家这么做」类断言
- 第 15 章：Kubernetes / PostgreSQL 的文档版本、Firecracker 的启动时长与内存开销（厂商自述）
- 第 5 章：错误文本正则表
- 第 1 章：代码行数测量
- 第 1 章：「harness 收益随模型变强而缩小」（§1.6 定为短档，是本书最值得持续观察的一条）
- 第 2 章：终止条件的具体写法、goose 的状态机迁移进度
- 第 3 章：各家的内建工具数量与工具描述字节数（§3.2.3 的口径，本书两轮内翻转过两次）
- 第 4 章：各家的默认 `midStreamBehavior`
- 第 12、13 章：框架与协议的存活状态（§12.6、§13.6 均定为短档；MCP / A2A 的版本另见「最短」档）
- 第 14 章：§14.2.3「寄存器模型只写在规格里」——一次提交就可能推翻；超时矩阵的具体数值
- 第 17 章：Meta-Harness 的 76.4% 与它在 Terminal-Bench 2 榜单上的名次

### 中（约一年）

- 各家实现的 `file:line`
- 论文的具体数字

### 长（原理性，不需要复核）

- 第 1 章：Agent = Model + Harness、Ashby 定律
- 第 2 章：四条不变量
- 第 6 章：前缀匹配的物理性质
- 第 11 章：三项高风险能力、三类防护措施的确定性分级
- 第 12 章：DPI、KV cache 分界线
- 第 14 章：事件溯源、先写意图记录再执行副作用、单写者
- 第 17 章：结果 ≠ 轨迹

---

## F. 本书没有覆盖的

诚实列出，方便读者知道该去别处找什么：

| 主题 | 为什么没写 |
|---|---|
| 模型训练与微调 | 超出 harness 范围（第 1 章定义） |
| 具体框架的用法 | 本书不是框架教程；框架 API 与配置也会频繁变化 |
| 非编码类 agent（客服、研究、computer use） | 素材全部来自 coding agent，不敢外推 |
| 前端与交互设计 | 第 14 章只覆盖到状态同步的协议层 |
| 成本优化的完整体系 | 只覆盖了缓存（第 6 章）与多 agent 的 token 经济学（第 12 章） |
| 国内厂商的第一方实践 | 素材缺口，见前言诚实边界第三条 |
| 闭源商业 agent 的内部实现 | 拿不到源码，只能靠公开材料推断 |
| agent 的长期运营数据 | 见前言诚实边界第二条 |
| 可观测性（单独一章） | 第 1 章 §1.2.1 把它列为七层之一，本书却没给它单独一章。调研到的项目做法差异不大，主要是读取 usage 字段、记录事件日志和保存执行轨迹，没有形成可比较的不同方案，而本书只有在存在不同方案和选择标准时才单独成章。相关内容分布在三处：第 6 章 §6.5.3 依次检查缓存命中率、失效原因和成本归因；第 14 章说明事件日志与重放；第 17 章说明评测。原因见第 1 章 §1.2.1 |
| 多模态注入与 MCP server 供应链（第 11 章威胁模型） | 第 11 章 §11.1.3 的威胁模型表核实过七类输入，没把图片/截图这类多模态载体、以及「装一个 MCP server 等于在 host 凭证上下文里执行任意代码」这条供应链向量单独成行（后者与第 13 章 §13.2.1 的 MCP 信任模型直接相关）。两条都是真实攻击面，本书写作时没形成独立的分歧与判断标准，认领在这里 |
| 事件 schema 演化（版本化与 upcasting）（第 14 章） | 第 14 章 §14.4 反证一第 3 条把「投影迁移麻烦」列为事件溯源的缺点，只给了二选一（重建全部投影 / 维护版本），没给版本化解法；长期存事件日志、schema 一定会变的读者，需要自己补 payload schema version + upcasting 迁移函数这一套 |
| 控制面多副本 HA（选主、split-brain）（第 15 章） | 第 15 章 §15.2.5 覆盖 owner 死亡发现与孤儿回收，但控制面自身的多副本、选主、split-brain 没写；§15.3 判断标准四「杀掉控制面，等 5 分钟」是单副本思维。要上多租户的读者，控制面怎么多活、怎么避免两个控制面同时活着，要自己补 |
| 按租户的配额强制机制（第 15 章） | 配额与计费只在第 15 章 §15.5.5 的实施顺序中用一句话列入 V2，没有说明具体机制：如何强制速率限制、并发上限和资源上限，以及超过配额时系统如何响应，本书都没有写 |
| 子 agent 失败语义（第 12 章） | 第 12 章 §12.4 反证一第 3 条承认失败模式不在实验内，判断标准五只给了替代方案。子 agent 应按分布式组件管理——超时、重试、孤儿清理、partial result 记账、归因问责——这些判断标准本书没给 |
| 自动改写 harness 的停止条件与评测预算（第 17 章） | 第 17 章 §17.5.5 的自动改进循环 `for t in 1..N` 只给出了两项停止条件：连续 K 轮无改进，或评测预算达到上限。评测 token 预算如何分配到各轮没有展开，读者需要根据自己的任务分布和成本确定 |
| 用户侧遗忘/删除（第 9 章） | 第 9 章只覆盖工程侧的记忆维护（降低过期内容的权重、整理记忆、限制一次最多删除或覆盖 25% 的旧条目），没写面向用户的主动删除、保留期与合规删除；第 8、9 章只在正文带过「隐私治理需求」一句 |
| 自动前缀缓存的最小可缓存长度（第 6 章） | 第 6 章覆盖服务端驱逐侧（四类语义、失效检测、命中率口径），没写自动缓存派的最小可缓存长度阈值——OpenAI、Gemini 实际都有这个阈值，工具密集型前缀可能短于阈值，直接影响 §6.2.2 的缓存经济学 |

---

## G. 最后的提醒：这本书停在哪一天

**项目源码材料截止到 2026-08-17**。部分规范、论文与安全公告核对到 2026-08-18；具体日期在正文或参考文献中标明。

本书讨论的设计原则通常比具体实现稳定，但版本号、价格、限额、项目存活状态与代码位置都会变化。把书中的事实判断用于新项目之前，请以当前源码、官方规范和你自己的运行数据为准。
