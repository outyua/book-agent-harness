# Agent Harness 工程：从源码里读出的设计决策

同一个工程问题，23 个真实 coding agent 分别怎么做、为什么分歧、判断标准是什么、抄哪个。

**在线阅读：<https://agent-harness.codeflow.cc>** · [下载 PDF](https://agent-harness.codeflow.cc/downloads/agent-harness-engineering.pdf) · [下载 EPUB](https://agent-harness.codeflow.cc/downloads/agent-harness-engineering.epub)

作者 王吕 · 公众号 Codeflow · <wanglv93@gmail.com> · 修订版 1.1（2026-08-27）

## 这本书讲什么

一个 coding agent 里，模型之外的那部分代码——循环、工具、上下文、权限、会话、评测——本书称之为 harness。全书 17 章按 agent 生命周期上的决策点组织，每一章对照真实项目的源码回答四件事：面对同一个决策点，各家分别怎么做；为什么会做出不同甚至相反的选择；判断该抄哪一个的标准是什么；照着做时最小的可用实现长什么样。

每条结论都给出文件与行号；闭源产品只依据公开材料，并标明证据级别。项目源码材料截止到 2026-08，这些项目每天都在改——把书当作设计决策的比较框架，不要把具体版本号或常量当作永久事实。

| 部 | # | 标题 | 一句话 |
|---|---|---|---|
| — | 序 | 如何读这本书 | 按症状查表、诚实边界、证据分级 |
| **1 · 立论** | 1 | Agent = Model + Harness | 循环只占它所在包的 2%–10%，其余 90% 是本书主题 |
| **2 · 循环** | 2 | Loop 是显式状态机，不是递归 | 八个实现无一用递归；两条契约把循环压到最小 |
| | 3 | 工具：接口、并行与错误回填 | 错误信息是写给模型的提示词；容错级联必须配比例护栏 |
| | 4 | 用户插话：steer、queue 与 cancel | 三种语义、三个注入点；中断标记只能由真的中断来设 |
| | 5 | 终止、熔断与恢复 | 四类失败四种策略，计数器不可共用；超时要推导不要硬编码 |
| **3 · 上下文** | 6 | KV cache 是第一约束 | 前缀匹配决定一切；缓存热时推迟改写，冷时顺手多做 |
| | 7 | System prompt 的解剖与四个决策 | 结构可抄、措辞不可抄——它是唯一单独迁移为负收益的组件 |
| | 8 | 压缩、checkpoint 与「无限上下文」 | 四级阶梯；真相层与投影层必须分开 |
| | 9 | 记忆：写路径、读路径与治理 | 写记忆与用记忆不在同一热路径；预算不是 top-k |
| | 10 | 代码库检索：为什么 grep 赢了 | 12 个本地 agent 里只有 1 个对仓库建向量索引、且默认关闭 |
| **4 · 三种边界** | 11 | 权限、沙箱与不可信输入 | 致命三角；三道防线的确定性分级；装箱永远不能是唯一防线 |
| | 12 | 要不要拆 agent | 五条论证链几乎都反对拆分；异构是唯一多方一致支持的理由 |
| | 13 | 协议：MCP、A2A、AG-UI 三条正交轴 | 全书时效性风险最高的一章 |
| **5 · 规模化** | 14 | Session Runtime | 只追加日志是唯一真相源；不可能的状态判损坏，不修复 |
| | 15 | 从单机到云端 | 补的不是 agent 能力，是产品与治理能力；凭证不进运行载体 |
| | 16 | 接进交付流水线 | issue 就是提示词；截至 2026-08，人审 merge 仍是必需的一道门 |
| **6 · 验证** | 17 | 评测与二阶回路 | 评结果不评轨迹；没有回归集，前 16 章都是净风险 |
| — | 后记 | 术语表 · 项目索引 · 参考文献 | 含「本书没有覆盖的」与资料截止日期 |

## 仓库布局

| 目录 / 文件 | 内容 |
|---|---|
| `manuscript/` | 书稿正文：`ch00` 前言 → `part1`–`part6` 部扉页与 `ch01`–`ch17` → `ch99` 后记。文件名按字母序排时 `part*` 会排在 `ch*` 之后，阅读顺序以上表为准。`STATUS.md` 记录稿件状态与历次复核 |
| `figures/` | 18 张图的 Graphviz DOT 源码与导出的 SVG |
| `assets/` | 封面、封面版画、公众号二维码、社交预览图、随书字体子集（Noto Serif/Sans SC，OFL 授权文本同目录） |
| `styles/` | PDF / EPUB 样式 |
| `scripts/` | 电子书构建：`build-book.mjs`（PDF + EPUB）、`render-cover.mjs`（封面叠字）、`lib/manuscript.mjs`（章节顺序、出版信息、读者版清理规则——电子书与网站共用的唯一真相源） |
| `site/` | Astro + Starlight 网站；`site/scripts/sync-content.mjs` 从 `manuscript/` 生成页面、`llms.txt` 与每页的 `.md` 版本 |
| `site/public/downloads/` | 构建好的 PDF / EPUB，由 CI 提交，随网站部署 |
| `wrangler.jsonc` | Cloudflare Workers 配置（静态资源模式、自定义域名） |
| `.github/workflows/ebook.yml` | 电子书 CI：书稿变动时用 Chromium 生成 PDF / EPUB，提交回 `site/public/downloads/` |
| `editorial-standards.md`、`citation-and-voice-scheme.md`、`publication-typesetting-standard-review.md`、`topic-selection.md`、`design-direction.md` | 写作与出版过程的决策记录：主编手册、引用体例、排版标准、选题、视觉方向 |
| `verify-citations.sh` | 引用校验脚本。它按 `file:line` 到被引项目的源码里逐条核对，需要作者本机的研究仓库（`projects/` 下 28 个被引项目的克隆），公开仓库里不能直接运行 |

## 本地构建

```bash
# 电子书（依赖 marked、playwright、jszip、temml）
pnpm install
pnpm exec playwright install chromium-headless-shell   # 首次：PDF 渲染用的 Chromium
brew install poppler                                   # pdfinfo，构建清单要读页数
pnpm build                                             # 产出 output/pdf、output/epub
pnpm cover                                             # 只重渲染封面

# 网站
pnpm --dir site install
pnpm --dir site build      # 同步书稿 → site/src/content/docs，产出 site/dist
pnpm --dir site dev        # 本地预览 http://localhost:4321
```

网站构建时若 `output/` 里有刚生成的 PDF / EPUB，会复制到 `site/public/downloads/` 覆盖仓库里那份。两边共用同一份读者版清理规则（去掉各章「版本与复核」节与后记里的内部复核说明），所以网页、PDF、EPUB 内容一致。

电子书成品是 6×9 英寸开本、Tagged PDF，书签由标题结构生成；EPUB 3 并带 NCX 兼容老阅读器。公式用 Temml 在构建期转成 MathML，不引入运行时脚本。

## 发布

**网站**由 Cloudflare Workers Builds 在推送 `main` 时自动构建部署：控制台「Workers & Pages → 创建 → 连接 Git 仓库」，构建命令 `pnpm --dir site install && pnpm --dir site build`，部署命令 `npx wrangler deploy`，根目录留空。`wrangler.jsonc` 声明了自定义域名，首次部署会自动建 DNS 记录。

**电子书**由 `.github/workflows/ebook.yml` 生成：书稿、图、素材、样式或脚本变动时触发，成品复制到 `site/public/downloads/`，以 `github-actions[bot]` 身份提交回 `main`，这次推送再触发一次网站构建，首页的下载按钮随之更新。

页面地址不带尾斜杠（`/book/chapter-1`）：`site/astro.config.mjs` 的 `trailingSlash: 'never'` 与 `wrangler.jsonc` 的 `html_handling: "drop-trailing-slash"` 必须一致；带斜杠的旧地址由 `site/public/_redirects` 301 到新地址。

站点还提供给 AI 爬虫与 LLM 的入口：`/llms.txt`、`/llms-full.txt`、每页的 `/book/<页面>.md`，每份都带作者署名与出处。`robots.txt` 对主流搜索引擎与 AI 爬虫放行。

可选的构建变量（Worker → Settings → Variables and Secrets）：`PUBLIC_GA_MEASUREMENT_ID`（GA4）、`PUBLIC_GOOGLE_SITE_VERIFICATION`、`PUBLIC_BING_SITE_VERIFICATION`、`PUBLIC_BAIDU_SITE_VERIFICATION`（站长工具验证）。

## 反馈与勘误

发现错误、有不同看法，或者你手上的源码已经和书里写的不一样了：

- 提 Issue，写明章节与原文片段；
- 或写邮件到 <wanglv93@gmail.com>（每章末尾的「反馈与勘误」链接会自动带上章节标题）；
- 或在公众号 Codeflow 后台留言。

被采纳的勘误会记入下一次修订，修订记录见 `manuscript/STATUS.md`。

## 许可

两部分分开授权，详见 [`LICENSE`](LICENSE)：

- **书稿与插图**（`manuscript/`、`figures/`、封面与版画）：[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh-hans)。可以自由转载与分享，须署名「王吕」并注明出处 <https://agent-harness.codeflow.cc>；不得用于商业目的，不得修改后再分发。引用片段用于评论、教学属于合理使用，不受此限。
- **代码**（`scripts/`、`site/`、`styles/`、`verify-citations.sh`、`wrangler.jsonc`、CI 配置）：[MIT](LICENSE)。

随书字体 Noto Serif SC / Noto Sans SC 按 SIL Open Font License 1.1 分发，授权文本在 `assets/fonts/`。
