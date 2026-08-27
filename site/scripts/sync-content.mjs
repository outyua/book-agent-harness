// 把 ../manuscript 下的书稿同步为 Starlight 页面。
//
// 做的事：
//   1. 按 scripts/lib/manuscript.mjs 里的章节顺序读取书稿，套用与电子书相同的读者版清理
//      （去掉各章「版本与复核」、后记里的内部复核说明）。
//   2. 用 Temml 把 LaTeX 公式预渲染成 MathML，Astro 的 markdown 直接保留这些 HTML。
//   3. 把插图路径改到 /figures/，并把 SVG、封面、字体拷进 public/。
//   4. 生成首页 index.mdx（目录 + 下载链接）。
//   5. 若 ../output/ 里已有构建好的 PDF/EPUB，复制到 public/downloads/ 供下载。
//
// 用法：在 site/ 目录运行 `pnpm sync`（`pnpm build` 会先自动执行）。

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import temml from "temml";
import { publication, sections, removeChapterReview, prepareBackMatter } from "../../scripts/lib/manuscript.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(scriptDir, "..");
const bookRoot = resolve(siteDir, "..");
const manuscriptDir = join(bookRoot, "manuscript");
const figuresDir = join(bookRoot, "figures");
const assetsDir = join(bookRoot, "assets");
const outputDir = join(bookRoot, "output");
const docsDir = join(siteDir, "src", "content", "docs");
const bookDocsDir = join(docsDir, "book");
const publicDir = join(siteDir, "public");

const releaseBase = "https://github.com/outyua/book-agent-harness/releases/latest/download";

const downloads = {
  pdf: "agent-harness-engineering.pdf",
  epub: "agent-harness-engineering.epub",
};

function renderMath(markdown, sourceName) {
  const protectedChunks = [];
  let value = markdown.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g, (chunk) => {
    const token = `BOOKCODETOKEN${protectedChunks.length}ENDTOKEN`;
    protectedChunks.push(chunk);
    return token;
  });

  const render = (expression, displayMode) => {
    const source = expression.trim();
    try {
      const math = temml.renderToString(source, { displayMode, throwOnError: true });
      return displayMode
        ? `\n<div class="math-display">${math}</div>\n`
        : `<span class="math-inline">${math}</span>`;
    } catch (error) {
      throw new Error(`${sourceName} 中的 LaTeX 公式无法转换：${source}\n${error.message}`);
    }
  };

  value = value
    .replace(/^\s*\$\$\s*\n?([\s\S]*?)\n?\s*\$\$\s*$/gm, (_m, expression) => render(expression, true))
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, expression) => render(expression, true))
    .replace(/\\\((.+?)\\\)/g, (_m, expression) => render(expression, false))
    // 行内 $...$：只匹配同一行内、不含空格起止的短公式，避免误伤价格等文本
    .replace(/\$([^$\n]{1,120}?)\$/g, (_m, expression) => render(expression, false));

  return value.replace(/BOOKCODETOKEN(\d+)ENDTOKEN/g, (_m, index) => protectedChunks[Number(index)]);
}

function firstParagraph(markdown) {
  const lines = markdown.split("\n");
  for (const line of lines) {
    const text = line.trim();
    if (!text || text.startsWith("#") || text.startsWith(">") || text.startsWith("|") || text.startsWith("!") || text.startsWith("---") || text.startsWith("```")) continue;
    const plain = text.replace(/[*`_\[\]]/g, "").replace(/\(https?:[^)]*\)/g, "");
    return plain.length > 140 ? `${plain.slice(0, 140)}…` : plain;
  }
  return publication.subtitle;
}

function yamlString(value) {
  return JSON.stringify(value);
}

function prepareSection(section) {
  let markdown = readFileSync(join(manuscriptDir, section.source), "utf8");
  if (/^chapter-\d+$/.test(section.id)) markdown = removeChapterReview(markdown).markdown;
  if (section.id === "back-matter") markdown = prepareBackMatter(markdown);

  // 页面标题来自 frontmatter，去掉正文里的一级标题
  const h1 = markdown.match(/^# (.+)$/m);
  const title = h1 ? h1[1].trim() : section.label;
  if (h1) markdown = markdown.replace(h1[0], "");
  markdown = markdown.replace(/^\s*---\s*\n/, "\n");

  markdown = markdown.replace(/\]\((?:\.\.\/)?figures\//g, "](/figures/");
  markdown = renderMath(markdown, section.source);

  return { title, description: firstParagraph(markdown), body: markdown.trim() + "\n" };
}

function writeSectionPages() {
  rmSync(bookDocsDir, { recursive: true, force: true });
  mkdirSync(bookDocsDir, { recursive: true });
  sections.forEach((section, index) => {
    const page = prepareSection(section);
    const frontmatter = [
      "---",
      `title: ${yamlString(page.title)}`,
      `description: ${yamlString(page.description)}`,
      `sidebar:`,
      `  order: ${index + 1}`,
      `  label: ${yamlString(section.label)}`,
      section.type === "part" ? "tableOfContents: false" : "",
      "---",
    ]
      .filter(Boolean)
      .join("\n") + "\n\n";
    writeFileSync(join(bookDocsDir, `${section.id}.md`), frontmatter + page.body, "utf8");
  });
}

function copyStaticAssets() {
  const figuresOut = join(publicDir, "figures");
  rmSync(figuresOut, { recursive: true, force: true });
  mkdirSync(figuresOut, { recursive: true });
  for (const file of readdirSync(figuresDir)) {
    if (file.endsWith(".svg")) cpSync(join(figuresDir, file), join(figuresOut, file));
  }

  const fontsOut = join(publicDir, "fonts");
  mkdirSync(fontsOut, { recursive: true });
  for (const file of readdirSync(join(assetsDir, "fonts"))) {
    cpSync(join(assetsDir, "fonts", file), join(fontsOut, file));
  }

  cpSync(join(assetsDir, "cover.png"), join(publicDir, "cover.png"));
  mkdirSync(join(siteDir, "src", "assets"), { recursive: true });
  cpSync(join(assetsDir, "cover.png"), join(siteDir, "src", "assets", "cover.png"));

  const downloadsOut = join(publicDir, "downloads");
  mkdirSync(downloadsOut, { recursive: true });
  const available = {};
  for (const [kind, name] of Object.entries(downloads)) {
    const source = join(outputDir, kind, name);
    if (existsSync(source)) {
      cpSync(source, join(downloadsOut, name));
      available[kind] = `/downloads/${name}`;
    } else if (existsSync(join(downloadsOut, name))) {
      available[kind] = `/downloads/${name}`;
    } else {
      // 没有本地构建产物（例如 Cloudflare 构建环境）时，指向 GitHub Action 发布的最新 Release 附件
      available[kind] = `${releaseBase}/${name}`;
    }
  }
  return available;
}

function writeIndexPage(available) {
  const partRows = [];
  let currentPart = null;
  for (const section of sections) {
    if (section.type === "part") {
      currentPart = section;
      partRows.push(`\n### [${section.label}](/book/${section.id}/)\n`);
      continue;
    }
    if (section.type === "chapter" && currentPart) {
      partRows.push(`- [${section.label}](/book/${section.id}/)`);
    }
  }

  const actions = [
    { text: "开始阅读", link: "/book/preface/", icon: "right-arrow", variant: "primary" },
  ];
  if (available.pdf) actions.push({ text: "下载 PDF", link: available.pdf, icon: "document", variant: "secondary" });
  if (available.epub) actions.push({ text: "下载 EPUB", link: available.epub, icon: "open-book", variant: "secondary" });

  const actionsYaml = actions
    .map(
      (a) =>
        `    - text: ${yamlString(a.text)}\n      link: ${yamlString(a.link)}\n      icon: ${a.icon}\n      variant: ${a.variant}`,
    )
    .join("\n");

  const content = `---
title: ${yamlString(publication.fullTitle)}
description: ${yamlString("同一个工程问题，23 个真实 coding agent 分别怎么做、为什么分歧、判断标准是什么、抄哪个。")}
template: splash
hero:
  title: ${yamlString(publication.title)}
  tagline: ${yamlString(publication.subtitle + " —— 同一个工程问题，23 个真实 coding agent 分别怎么做、为什么分歧、判断标准是什么、抄哪个。")}
  image:
    file: ../../assets/cover.png
    alt: ${yamlString(publication.fullTitle + "封面")}
  actions:
${actionsYaml}
---

import { Card, CardGrid } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="读什么" icon="open-book">
    17 章按 agent 生命周期上的决策点组织：循环、工具、插话、恢复、KV cache、system prompt、压缩、记忆、检索、权限、多 agent、协议、会话运行时、云端、交付流水线、评测。
  </Card>
  <Card title="证据从哪来" icon="magnifier">
    每一条结论都对照真实项目源码，给出文件与行号；闭源产品只依据公开材料，并标明证据级别。资料截止 ${publication.sourceCutoffDate}。
  </Card>
  <Card title="版本" icon="information">
    ${publication.edition} · ${publication.publicationDate}；修订版 ${publication.revision} · ${publication.revisionDate}。${publication.revisionNote}
  </Card>
  <Card title="作者" icon="pen">
    ${publication.author} · 公众号 ${publication.account} · ${publication.email}
  </Card>
</CardGrid>

## 目录

- [${sections[0].label}](/book/${sections[0].id}/)
${partRows.join("\n")}

- [${sections.at(-1).label}](/book/${sections.at(-1).id}/)
`;
  writeFileSync(join(docsDir, "index.mdx"), content, "utf8");
}

writeSectionPages();
const available = copyStaticAssets();
writeIndexPage(available);
console.log(
  `同步完成：${sections.length} 个页面，下载链接：${Object.values(available).join(" ")}`,
);
