// 书稿的公共元数据与清理逻辑，供电子书构建（scripts/build-book.mjs）与网站内容同步（site/scripts/sync-content.mjs）共用。
const publication = {
  title: "Agent Harness 工程",
  subtitle: "从源码里读出的设计决策",
  fullTitle: "Agent Harness 工程：从源码里读出的设计决策",
  author: "王吕",
  email: "wanglv93@gmail.com",
  account: "Codeflow",
  language: "zh-CN",
  publicationDate: "2026-08-19",
  edition: "电子版第一版",
  revision: "1.1",
  revisionDate: "2026-08-27",
  revisionNote: "按 2026-08-26/27 的项目源码同步复核引用与结论；Claude Code 改为闭源口径，不再引用还原源码。",
  profile: "正式读者版",
  sourceCutoffDate: "2026-08-27",
  identifier: "urn:uuid:79fb2739-4758-4d50-a84f-1599ee24bb5a",
};

const sections = [
  { source: "ch00-preface.md", id: "preface", type: "chapter", label: "序 · 如何读这本书" },
  { source: "part1-thesis.md", id: "part-1", type: "part", label: "第 1 部分 · 立论" },
  { source: "ch01-model-plus-harness.md", id: "chapter-1", type: "chapter", label: "第 1 章 · Agent = Model + Harness" },
  { source: "part2-loop.md", id: "part-2", type: "part", label: "第 2 部分 · 循环" },
  { source: "ch02-agent-loop.md", id: "chapter-2", type: "chapter", label: "第 2 章 · Loop 是显式状态机，不是递归" },
  { source: "ch03-tools.md", id: "chapter-3", type: "chapter", label: "第 3 章 · 工具：接口、并行与错误回填" },
  { source: "ch04-steering.md", id: "chapter-4", type: "chapter", label: "第 4 章 · 用户插话：steer、queue 与 cancel" },
  { source: "ch05-termination-recovery.md", id: "chapter-5", type: "chapter", label: "第 5 章 · 终止、熔断与恢复" },
  { source: "part3-context.md", id: "part-3", type: "part", label: "第 3 部分 · 上下文" },
  { source: "ch06-kv-cache.md", id: "chapter-6", type: "chapter", label: "第 6 章 · KV cache 是第一约束" },
  { source: "ch07-system-prompt.md", id: "chapter-7", type: "chapter", label: "第 7 章 · System prompt 的内容组成与四个设计决策" },
  { source: "ch08-compaction.md", id: "chapter-8", type: "chapter", label: "第 8 章 · 压缩、checkpoint 与「无限上下文」" },
  { source: "ch09-memory.md", id: "chapter-9", type: "chapter", label: "第 9 章 · 记忆：写路径、读路径与治理" },
  { source: "ch10-code-retrieval.md", id: "chapter-10", type: "chapter", label: "第 10 章 · 代码库检索：为什么 grep 赢了" },
  { source: "part4-boundaries.md", id: "part-4", type: "part", label: "第 4 部分 · 三种边界" },
  { source: "ch11-security.md", id: "chapter-11", type: "chapter", label: "第 11 章 · 权限、沙箱与不可信输入" },
  { source: "ch12-multi-agent.md", id: "chapter-12", type: "chapter", label: "第 12 章 · 要不要拆 agent" },
  { source: "ch13-protocols.md", id: "chapter-13", type: "chapter", label: "第 13 章 · 协议：MCP、A2A、AG-UI 分别连接哪些参与方" },
  { source: "part5-scale.md", id: "part-5", type: "part", label: "第 5 部分 · 规模化" },
  { source: "ch14-session-runtime.md", id: "chapter-14", type: "chapter", label: "第 14 章 · Session Runtime：事件溯源、WAL 与崩溃恢复" },
  { source: "ch15-cloud-multitenancy.md", id: "chapter-15", type: "chapter", label: "第 15 章 · 从单机到云端：多租户与会话载体" },
  { source: "ch16-delivery-pipeline.md", id: "chapter-16", type: "chapter", label: "第 16 章 · 接进交付流水线：issue 进，PR 出" },
  { source: "part6-verification.md", id: "part-6", type: "part", label: "第 6 部分 · 验证" },
  { source: "ch17-eval-second-order.md", id: "chapter-17", type: "chapter", label: "第 17 章 · 评测与 harness 自动改进：先建立评测，再自动调整实现" },
  { source: "ch99-back-matter.md", id: "back-matter", type: "back", label: "后记 · 术语表 · 项目索引 · 参考文献" },
];

function trimSectionBreak(value) {
  return value.replace(/(?:\n\s*)?(?:\n---\s*)?\n*$/, "\n\n");
}

function removeChapterReview(markdown) {
  const reviewStart = markdown.search(/^## \d+\.6 版本与复核\s*$/m);
  if (reviewStart === -1) return { markdown, removed: false };

  const tailStart = markdown.indexOf("\n## 尾声 · 全书收束", reviewStart);
  const before = trimSectionBreak(markdown.slice(0, reviewStart));
  const after = tailStart === -1 ? "" : markdown.slice(tailStart + 1);
  return { markdown: `${before}${after}`.trimEnd() + "\n", removed: true };
}

function prepareBackMatter(markdown) {
  const internalStart = markdown.search(/^## D\. 怎么复核这本书\s*$/m);
  const publicAppendixStart = markdown.search(/^## F\. 本书没有覆盖的\s*$/m);
  let value = markdown;

  if (internalStart !== -1 && publicAppendixStart !== -1 && publicAppendixStart > internalStart) {
    value = `${trimSectionBreak(value.slice(0, internalStart))}${value.slice(publicAppendixStart)}`;
  }

  return value
    .replace(/^## F\. 本书没有覆盖的\s*$/m, "## D. 本书没有覆盖的")
    .replace(/^## G\. 最后的提醒：这本书停在哪一天\s*$/m, "## E. 资料截止日期");
}


export { publication, sections, trimSectionBreak, removeChapterReview, prepareBackMatter };
