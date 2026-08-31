# 《Agent Harness 工程：从源码里读出的设计决策》

同一个工程问题，23 个真实 coding agent 分别怎么做、为什么分歧、判断标准是什么、抄哪个。

- 在线阅读：<https://agent-harness.codeflow.cc>
- 电子书：PDF / EPUB 由 `scripts/build-book.mjs` 生成，网站首页提供下载
- 作者 王吕 · 公众号 Codeflow · wanglv93@gmail.com

## 仓库布局

| 目录 | 内容 |
|---|---|
| `manuscript/` | 书稿正文：`ch00` 前言 → `part1`–`part6` 部扉页与 `ch01`–`ch17` → `ch99` 后记；`STATUS.md` 记录稿件状态与历次复核 |
| `figures/` | 18 张图的 Graphviz DOT 源码与 SVG |
| `assets/` | 封面、羊版画、二维码、随书字体子集（OFL） |
| `styles/` | 电子书 PDF/EPUB 样式 |
| `scripts/` | 电子书构建：`build-book.mjs`（PDF + EPUB）、`render-cover.mjs`（封面）、`lib/manuscript.mjs`（章节顺序、出版信息与读者版清理逻辑，电子书与网站共用） |
| `site/` | Astro + Starlight 网站，`scripts/sync-content.mjs` 从 `manuscript/` 生成页面 |
| `.github/workflows/deploy.yml` | 推送 `main` 后自动构建电子书与网站并发布到 Cloudflare Pages |
| `verify-citations.sh` | 引用校验脚本（需要上层仓库的 `projects/` 目录，见下） |
| `editorial-standards.md` 等 | 主编手册、选题记录、排版标准、引用体例 |

## 本地构建

```bash
pnpm install                                   # 电子书依赖：marked、playwright、jszip、temml
pnpm exec playwright install chromium-headless-shell   # 首次：PDF 渲染用的 Chromium
pnpm build                                     # 生成 output/pdf、output/epub、assets/cover.png 不变
pnpm cover                                     # 只重渲染封面

pnpm --dir site install
pnpm --dir site build                          # 同步书稿 → site/src/content/docs，产出 site/dist
pnpm --dir site dev                            # 本地预览 http://localhost:4321
```

网站构建时会把 `output/` 里已有的 PDF/EPUB 复制到 `site/public/downloads/`；本地没跑过电子书构建时首页只有「开始阅读」按钮。网站与电子书共用同一份读者版清理规则（去掉各章「版本与复核」与后记里的内部复核说明），所以两边内容一致。

## 发布

**网站：Cloudflare Workers Builds（Git 集成，推送即部署）。** 在 Cloudflare 控制台「Workers & Pages → 创建 → 连接 Git 仓库」选择 `outyua/book-agent-harness`，按下面填写：

| 字段 | 值 |
|---|---|
| 项目名称 | `book-agent-harness`（与 `wrangler.jsonc` 的 `name` 一致） |
| 构建命令 | `pnpm --dir site install && pnpm --dir site build` |
| 部署命令 | `npx wrangler deploy` |
| 根目录（高级设置） | 留空（仓库根，`wrangler.jsonc` 在这里） |
| 非生产分支构建 | 可勾选，得到预览地址 |

`wrangler.jsonc` 把 Worker 配成纯静态资源模式（`assets.directory = site/dist`），并声明自定义域名 `agent-harness.codeflow.cc`（`routes[].custom_domain`），首次部署时 Cloudflare 会自动在 `codeflow.cc` 区域里创建该记录；也可以在 Worker 的 Settings → Domains & Routes 里手工添加。之后每次推送 `main`，Cloudflare 自动重新构建并发布。

**统计：** 网站用 Google Analytics（GA4，通过 Starlight 的 `head` 注入 gtag）。在 Worker 的 Settings → Variables and Secrets 里可用构建变量 `PUBLIC_GA_MEASUREMENT_ID` 覆盖测量 ID；默认为 `G-G6XTK77696`。Worker 的可观测性（traces 开、logs 关）配置在 `wrangler.jsonc` 的 `observability` 里。

**SEO 与站长工具：** 站点生成单一 `sitemap.xml`（每条 URL 带 `lastmod`，取书稿文件的 git 提交时间；`sitemap-index.xml`、`sitemap-0.xml` 301 到它），`public/robots.txt` 指向它。每页有 `<title>`（首页不重复书名）、按页描述（章节页取本章前三个二级标题）、canonical、Open Graph / Twitter 卡片（横版 `og.jpg` 1200×630，由 `pnpm --dir site og` 在本机生成后提交，改书名/作者/封面后重跑）、`lang="zh-CN"`。结构化数据：首页 `WebSite` + `Book`（含各章 `hasPart`），章节页 `Chapter`/`TechArticle`（`isPartOf` 指向本书）+ `BreadcrumbList`，都在 `site/src/starlightRouteData.ts` 里按页写进 `<head>`。`.md` 纯文本版与 `llms*.txt` 通过 `_headers` 加 `X-Robots-Tag: noindex`，只给 AI 爬虫用，不和网页版争排名；`_headers` 同时下发 HSTS、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` 与静态资源的长期缓存。

站长工具验证：把各家给的 HTML 标记值设为 Worker 构建变量后重新部署——Google `PUBLIC_GOOGLE_SITE_VERIFICATION`、Bing `PUBLIC_BING_SITE_VERIFICATION`、百度 `PUBLIC_BAIDU_SITE_VERIFICATION`；或在 Cloudflare 的 codeflow.cc 区域加 DNS TXT 记录。验证后提交 `https://agent-harness.codeflow.cc/sitemap.xml`。另外两项只能在 Cloudflare 控制台做：SSL/TLS → Edge Certificates 打开 **Always Use HTTPS**（现在 `http://` 直接 200，不跳转）；Security → Bots 确认没有拦搜索引擎与 AI 爬虫。

**电子书：GitHub Action → GitHub Release。** `.github/workflows/ebook.yml` 在书稿、图、素材或构建脚本变动时运行，用 Chromium 生成 PDF/EPUB，发布到 Release `latest`。网站首页的下载按钮在 Cloudflare 构建环境里没有本地成品时，自动指向 `https://github.com/outyua/book-agent-harness/releases/latest/download/…`。仓库为私有时这些链接需要登录 GitHub 才能下载；公开仓库可直接访问。

## 写作与校验

### 目录

| 文件 | 内容 |
|---|---|
| [`manuscript/`](manuscript/) | **正文**。`ch00` 前言 → `part1`–`part6` 六篇部扉页与 `ch01`–`ch17` 正文交替 → `ch99` 后记。文件名按字母序排时 `part*` 会排在 `ch*` 之后，实际阅读顺序见下方章节表与前言《全书分六个部》 |
| [`manuscript/STATUS.md`](manuscript/STATUS.md) | 稿件状态、校验结果、写作中被复核改变的结论 |
| [`editorial-standards.md`](editorial-standards.md) | 主编手册：五段体例、语言纪律、证据分级、图例规范、验收清单 |
| [`publication-typesetting-standard-review.md`](publication-typesetting-standard-review.md) | 出版物排版标准对照：开本、版心、字号、行距、表图、公式、PDF 与 EPUB 验收基线 |
| [`topic-selection.md`](topic-selection.md) | 选题决策记录：素材盘点、三个候选的取舍、目录与素材映射 |
| [`verify-citations.sh`](verify-citations.sh) | 机器校验脚本（引用解析 / 体例 / 语言纪律 / 交叉引用） |
| [`figures/`](figures/) | 18 张图的 Graphviz DOT 源码与 SVG |

### 章节

阅读顺序自上而下：每个部的扉页读完再读该部各章。

| 部 | # | 标题 | 一句话 |
|---|---|---|---|
| — | 序 | 如何读这本书 | 按症状查表、诚实边界、证据分级 |
| **1 · 立论**（`part1-thesis.md`） | 1 | Agent = Model + Harness | 循环只占它所在包的 2%–10%，其余 90% 是本书主题 |
| **2 · 循环**（`part2-loop.md`） | 2 | Loop 是显式状态机，不是递归 | 八个实现无一用递归；两条契约把循环压到最小 |
| | 3 | 工具：接口、并行与错误回填 | 错误信息是写给模型的提示词；容错级联必须配比例护栏 |
| | 4 | 用户插话：steer、queue 与 cancel | 三种语义、三个注入点；中断标记只能由真的中断来设 |
| | 5 | 终止、熔断与恢复 | 四类失败四种策略，计数器不可共用；超时要推导不要硬编码 |
| **3 · 上下文**（`part3-context.md`） | 6 | KV cache 是第一约束 | 前缀匹配决定一切；缓存热时推迟改写，冷时顺手多做 |
| | 7 | System prompt 的解剖与四个决策 | 结构可抄、措辞不可抄——它是唯一单独迁移为负收益的组件 |
| | 8 | 压缩、checkpoint 与「无限上下文」 | 四级阶梯；真相层与投影层必须分开 |
| | 9 | 记忆：写路径、读路径与治理 | 写记忆与用记忆不在同一热路径；预算不是 top-k |
| | 10 | 代码库检索：为什么 grep 赢了 | 12 个本地 agent 里只有 1 个对仓库建向量索引、且默认关闭，而 Cursor 的数据说明了为什么 |
| **4 · 三种边界**（`part4-boundaries.md`） | 11 | 权限、沙箱与不可信输入 | 致命三角；三道防线的确定性分级；装箱永远不能是唯一防线 |
| | 12 | 要不要拆 agent | 五条论证链几乎都反对拆分；异构是唯一多方一致支持的理由 |
| | 13 | 协议：MCP、A2A、AG-UI 三条正交轴 | 全书时效性风险最高的一章；MCP 刚移除了会话与 SSE 续传 |
| **5 · 规模化**（`part5-scale.md`） | 14 | Session Runtime | 只追加日志是唯一真相源；不可能的状态判损坏，不修复 |
| | 15 | 从单机到云端 | 补的不是 agent 能力，是产品与治理能力；凭证不进运行载体 |
| | 16 | 接进交付流水线 | issue 就是提示词；截至 2026-08，人审 merge 在安全上仍是必需的一道门 |
| **6 · 验证**（`part6-verification.md`） | 17 | 评测与二阶回路 | 评结果不评轨迹；没有回归集，前 16 章都是净风险 |
| — | 后记 | 术语表 · 项目索引 · 参考文献 | 含「本书没有覆盖的」与资料截止日期；本书用三张表替代传统主题索引 |

### 校验

```bash
bash book-agent-harness/verify-citations.sh
```

2026-08-27 本轮运行结果：**五项全部通过**——174 条引用全部解析（含 4 条历史引用）、17 章体例完整、无禁用词、交叉引用全部有效，前言与项目索引一致。（引用、禁用词、交叉引用章号三项覆盖 `ch*.md` 与六篇 `part*.md`；体例完整性只查 ch01–ch17，因为部扉页是三段结构。）

引用条数会随每一轮增补变化，**以脚本当次输出为准**，这里的数字只是一次快照。四项结论是否全部通过，才是要看的东西。

**这个脚本发现不了什么**：它只能发现「引用失效」，发现不了「引用有效但当初的概括是错的」。后者在写作中真实发生过两次，见 `manuscript/STATUS.md`。

### 电子书成品

出版版采用 6×9 英寸开本，包含封面、书名页、出版信息、目录、六个部扉页、17 章正文、后记和作者页。封面动物是一只羊：`imagegen` 生成黑白自然史版画，书名和作者名由排版程序叠加，避免生成式图片出现错字。公众号与个人微信二维码并列放在书末作者页，保留足够留白以便扫描。

成品是**正式读者版**。构建时会保留正文中的必要源码引用，但自动移除 17 个章末「版本与复核」、后记中的仓库克隆与机器校验说明、保鲜期维护表，以及内部稿件路径。原始研究稿仍保留在 `manuscript/`；用于 PDF 和 EPUB 的清理后稿件写入 `.build/publication-manuscript/`，便于逐项检查。

成品路径：

- `output/pdf/agent-harness-engineering.pdf`
- `output/epub/agent-harness-engineering.epub`
- `assets/cover.png`

出版信息采用当前已知事实：作者王吕，邮箱 `wanglv93@gmail.com`，公众号 `Codeflow`，电子版第一版日期 `2026-08-19`。 修订版本号与修订日期在 `scripts/lib/manuscript.mjs` 的 `publication.revision` / `revisionDate` 维护，当前为修订版 1.1（2026-08-27），版权页「修订」行与书末作者页均会显示；作者署名统一为「作者 王吕」。没有虚构出版社与书号，版权页明确写作“ISBN 未申请”。

构建脚本是 `scripts/build-book.mjs`（命令见上文「本地构建」）。出版信息与修订版本号在 `scripts/lib/manuscript.mjs` 的 `publication` 里维护。Temml 在构建期把 LaTeX 转成 MathML；PDF 页眉、页码和书签由 Chromium 原生分页与 outline 生成。

正文使用随书嵌入的 Noto Serif SC / Noto Sans SC 字形子集，授权文本在 `assets/fonts/`。构建后的 SHA-256、PDF 页数、标签状态、公式数、表格数、插图数和 EPUB 图数写入 `.build/build-manifest.json`。PDF 需要按 `pdf` 技能要求渲染为 PNG 做目检；EPUB 需要运行 EPUBCheck、ZIP、XML/XHTML 和资源引用校验，不能只看扩展名。2026-08-20 的正式读者版为 384 页，Tagged PDF = yes，2 个 MathML、0 个原始 `$$`；EPUBCheck 5.3.0 为 0 error / 0 warning。

## 已决事项

1. **版权与合规无约束**——源码细节（含反编译还原源码）保留。
2. **出版分层**——`manuscript/` 保留研究与复核材料；PDF / EPUB 采用正式读者版，只保留正文来源、参考文献、资料截止日期与适用边界。
3. **图例**——Graphviz 生成 SVG，`.dot` 与 `.svg` 一同入库；单色安全；正文必须有文字复述。

## 素材来源

见 [`../README.md`](../README.md) 的主题地图。骨架对应的源码级调研主要在
[`../system-prompts/`](../system-prompts/)、[`../cloud-agent/`](../cloud-agent/)、
[`../harness-engineering/`](../harness-engineering/)、[`../agent-memory/`](../agent-memory/)、
[`../multi-agent/`](../multi-agent/)、[`../issue-driven-automation/`](../issue-driven-automation/)。

第 11 章（安全）是全新写作——`../agent-security/` 此前只有论文 PDF、零原创综合。
