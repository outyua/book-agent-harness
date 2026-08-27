#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { publication, sections, removeChapterReview, prepareBackMatter } from "./lib/manuscript.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);

function loadDependency(name) {
  try {
    return require(name);
  } catch (error) {
    throw new Error(
      `缺少构建依赖 ${name}。请让 NODE_PATH 指向包含 marked、playwright、jszip 的 node_modules。\n${error.message}`,
    );
  }
}

const { Marked } = loadDependency("marked");
const { chromium } = loadDependency("playwright");
const JSZip = loadDependency("jszip");
const temml = loadDependency("temml/dist/temml.cjs");

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const manuscriptDir = join(projectRoot, "manuscript");
const figuresDir = join(projectRoot, "figures");
const assetsDir = join(projectRoot, "assets");
const stylesDir = join(projectRoot, "styles");
// 个人微信二维码只在本地存在，不入库；缺失时作者页只保留公众号二维码。
const personalQrCandidate = join(assetsDir, "wechat-personal.jpg");
const personalQrPath = existsSync(personalQrCandidate) ? personalQrCandidate : null;
const buildDir = join(projectRoot, ".build");
const publicationManuscriptDir = join(buildDir, "publication-manuscript");
const pdfOutputDir = join(projectRoot, "output", "pdf");
const epubOutputDir = join(projectRoot, "output", "epub");
const fontDir = join(assetsDir, "fonts");
const fontFiles = {
  serif: "NotoSerifSC-Book.woff2",
  sans: "NotoSansSC-Book.woff2",
};
const buildTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const bookmarkTree = [
  sections[0],
  { ...sections[1], children: [sections[2]] },
  { ...sections[3], children: sections.slice(4, 8) },
  { ...sections[8], children: sections.slice(9, 14) },
  { ...sections[14], children: sections.slice(15, 18) },
  { ...sections[18], children: sections.slice(19, 22) },
  { ...sections[22], children: [sections[23]] },
  sections[24],
  { id: "about-author", label: "关于作者", title: "关于作者" },
].map(toBookmarkNode);

function toBookmarkNode(item) {
  return {
    id: item.id,
    label: item.label,
    title: item.label,
    ...(item.children ? { children: item.children.map(toBookmarkNode) } : {}),
  };
}

function ensureLayout() {
  for (const directory of [buildDir, publicationManuscriptDir, pdfOutputDir, epubOutputDir]) {
    mkdirSync(directory, { recursive: true });
  }
  for (const file of [
    join(assetsDir, "sheep-engraving.png"),
    join(assetsDir, "wechat-qr.png"),
    join(fontDir, fontFiles.serif),
    join(fontDir, fontFiles.sans),
    join(fontDir, "OFL-NotoSerifSC.txt"),
    join(fontDir, "OFL-NotoSansSC.txt"),
    join(stylesDir, "cover.css"),
    join(stylesDir, "book.css"),
  ]) {
    if (!existsSync(file)) {
      throw new Error(`缺少构建输入：${file}`);
    }
  }
}

const preparedMarkdownCache = new Map();
const editorialAudit = {
  profile: publication.profile,
  removedChapterReviewSections: 0,
  removedInternalBackMatterSections: ["怎么复核这本书", "各章‘哪些会过期’速查"],
  sourceCutoffDate: publication.sourceCutoffDate,
};

function preparePublicationMarkdown(section) {
  if (preparedMarkdownCache.has(section.source)) {
    return preparedMarkdownCache.get(section.source);
  }

  let markdown = readFileSync(join(manuscriptDir, section.source), "utf8");
  if (/^chapter-\d+$/.test(section.id)) {
    const result = removeChapterReview(markdown);
    markdown = result.markdown;
    if (result.removed) editorialAudit.removedChapterReviewSections += 1;
  }
  if (section.id === "back-matter") {
    markdown = prepareBackMatter(markdown);
  }

  writeFileSync(join(publicationManuscriptDir, section.source), markdown, "utf8");
  preparedMarkdownCache.set(section.source, markdown);
  return markdown;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function dataUrl(file, mediaType = "image/png") {
  return `data:${mediaType};base64,${readFileSync(file).toString("base64")}`;
}

function inlineFontUrls(css) {
  return css
    .replaceAll(
      `../fonts/${fontFiles.serif}`,
      dataUrl(join(fontDir, fontFiles.serif), "font/woff2"),
    )
    .replaceAll(
      `../fonts/${fontFiles.sans}`,
      dataUrl(join(fontDir, fontFiles.sans), "font/woff2"),
    );
}

function removePageAtRules(css) {
  let output = "";
  let cursor = 0;
  const pageRule = /@page\b/g;
  for (let match = pageRule.exec(css); match; match = pageRule.exec(css)) {
    const openBrace = css.indexOf("{", match.index);
    if (openBrace === -1) break;
    output += css.slice(cursor, match.index);
    let depth = 1;
    let index = openBrace + 1;
    for (; index < css.length && depth > 0; index += 1) {
      if (css[index] === "{") depth += 1;
      if (css[index] === "}") depth -= 1;
    }
    cursor = index;
    pageRule.lastIndex = index;
  }
  return output + css.slice(cursor);
}

function xhtmlize(html) {
  return html
    .replace(/<br>/g, "<br />")
    .replace(/<hr>/g, "<hr />")
    .replace(/<input([^>]*?)(?<!\/)\s*>/g, "<input$1 />")
    .replace(/<img([^>]*?)(?<!\/)\s*>/g, "<img$1 />");
}

function renderMathMarkdown(markdown, mode, sourceName) {
  const protectedCode = [];
  let value = markdown.replace(
    /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g,
    (chunk) => {
      const token = `BOOKCODETOKEN${protectedCode.length}ENDTOKEN`;
      protectedCode.push(chunk);
      return token;
    },
  );

  const render = (expression, displayMode) => {
    const source = expression.trim();
    try {
      const math = temml.renderToString(source, {
        displayMode,
        throwOnError: true,
        xml: mode === "epub",
      });
      return displayMode
        ? `<div class="math-display">${math}</div>`
        : `<span class="math-inline">${math}</span>`;
    } catch (error) {
      throw new Error(`${sourceName} 中的 LaTeX 公式无法转换：${source}\n${error.message}`);
    }
  };

  value = value
    .replace(/^\s*\$\$\s*\n?([\s\S]*?)\n?\s*\$\$\s*$/gm, (_match, expression) =>
      render(expression, true),
    )
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, expression) => render(expression, true))
    .replace(/\\\((.+?)\\\)/g, (_match, expression) => render(expression, false))
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");

  return value.replace(/BOOKCODETOKEN(\d+)ENDTOKEN/g, (_match, index) => protectedCode[Number(index)]);
}

function renderMarkdown(markdown, section, mode) {
  const sourceName = section.source ?? section.label;
  const mathReadyMarkdown = renderMathMarkdown(markdown, mode, sourceName);
  let headingIndex = 0;
  const renderer = {
    heading(token) {
      headingIndex += 1;
      const id = token.depth === 1 && headingIndex === 1 ? section.id : `${section.id}-h${headingIndex}`;
      return `<h${token.depth} id="${escapeHtml(id)}">${this.parser.parseInline(token.tokens)}</h${token.depth}>`;
    },
    image(token) {
      const fileName = token.href.split("/").at(-1);
      const source =
        mode === "pdf"
          ? pathToFileURL(join(figuresDir, fileName)).href
          : `../images/${encodeURIComponent(fileName)}`;
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return `<img src="${escapeHtml(source)}" alt="${escapeHtml(token.text)}"${title} />`;
    },
  };
  const parser = new Marked({ gfm: true, breaks: false, renderer });
  let html = parser.parse(mathReadyMarkdown);
  html = html.replace(
    /<p><img ([^>]*?)alt="([^"]*)"([^>]*?)\s*\/><\/p>/g,
    (_match, before, caption, after) => {
      const sourceAttributes = `${before}${after}`;
      const wide = /ch(?:04-1-steer-queue-cancel|17-1-three-loops)\.svg/.test(sourceAttributes);
      return `<figure${wide ? ' class="wide-figure"' : ""}><img ${before}alt="${caption}"${after} /><figcaption>${caption}</figcaption></figure>`;
    },
  );
  html = html.replaceAll("<th>", '<th scope="col">');
  return mode === "epub" ? xhtmlize(html) : html;
}

function sectionClass(section) {
  if (section.type === "part") return "part-page";
  if (section.type === "back") return "back-matter";
  return "chapter";
}

function publicationPageHtml() {
  return `
    <section class="publication-page" id="publication">
      <h1>出版信息</h1>
      <dl class="publication-grid">
        <dt>书名</dt><dd>${escapeHtml(publication.fullTitle)}</dd>
        <dt>作者</dt><dd>${escapeHtml(publication.author)}</dd>
        <dt>版本</dt><dd>${escapeHtml(publication.edition)} · ${publication.publicationDate}</dd>
        <dt>修订</dt><dd>修订版 ${publication.revision} · ${publication.revisionDate}</dd>
        <dt>联系方式</dt><dd><a href="mailto:${publication.email}">${publication.email}</a></dd>
        <dt>公众号</dt><dd>${publication.account}（微信搜一搜）</dd>
        <dt>ISBN</dt><dd>未申请</dd>
      </dl>
      <div class="publication-note">
        <p>版权所有 © 2026 王吕。本电子书未声明开放许可；转载、节选与商业使用请联系作者。</p>
        <p>本书引用的开源项目、商标和代码片段，其权利归各自权利人；相关引用用于技术评论、比较与说明。</p>
        <p>修订版 ${publication.revision}（${publication.revisionDate}）：${escapeHtml(publication.revisionNote)}</p>
        <p>项目源码材料截止到 ${publication.sourceCutoffDate}。协议、产品与源码会变化，实施前请以当前源码和官方文档为准。</p>
        <p>封面羊插图由 OpenAI 图像生成工具生成；封面与内页版式由作者与 Codex 整理。</p>
      </div>
    </section>`;
}

function titlePageHtml() {
  return `
    <section class="title-page" id="title-page">
      <h1>${escapeHtml(publication.title)}</h1>
      <div class="subtitle">${escapeHtml(publication.subtitle)}</div>
      <div class="author-name">作者 ${escapeHtml(publication.author)}</div>
    </section>`;
}

function aboutAuthorHtml(accountQrSource, personalQrSource) {
  return `
    <section class="author-page" id="about-author">
      <h1>关于作者</h1>
      <div class="author-card">
        <div class="author-copy">
          <h2>王吕</h2>
          <p>持续研究 coding agent、执行框架与多 agent 工程。本书来自对真实项目源码的逐项对照。</p>
          <p class="contact-line"><strong>邮箱</strong>　<a href="mailto:${publication.email}">${publication.email}</a></p>
          <p class="contact-line"><strong>公众号</strong>　${publication.account}</p>
          ${personalQrSource ? "<p class=\"contact-line\"><strong>个人微信</strong>　扫描下方二维码添加好友</p>" : ""}
        </div>
        <div class="contact-qr-grid">
          <div class="contact-qr">
            <img src="${accountQrSource}" alt="公众号 ${publication.account} 二维码" />
            <p>公众号 · ${publication.account}</p>
          </div>
          ${personalQrSource ? `<div class="contact-qr contact-qr-personal">
            <div class="personal-qr-crop">
              <img src="${personalQrSource}" alt="个人微信二维码" />
            </div>
            <p>个人微信</p>
          </div>` : ""}
        </div>
      </div>
      <div class="end-mark">END</div>
    </section>`;
}

function tocHtml() {
  const entries = sections
    .map((section) => {
      const className = section.type === "part" ? "part-entry" : "chapter-entry";
      return `<li class="${className}"><a href="#${section.id}">${escapeHtml(section.label)}</a></li>`;
    })
    .join("\n");
  return `
    <section class="toc-page" id="contents">
      <h1>目录</h1>
      <ol class="toc-list">
        ${entries}
        <li class="chapter-entry"><a href="#about-author">关于作者</a></li>
      </ol>
    </section>`;
}

async function renderCover(browser) {
  const coverCss = inlineFontUrls(readFileSync(join(stylesDir, "cover.css"), "utf8"));
  const sheep = dataUrl(join(assetsDir, "sheep-engraving.png"));
  const coverHtml = `<!doctype html>
    <html lang="zh-CN"><head><meta charset="utf-8"><style>${coverCss}</style></head>
    <body><main class="cover">
      <section class="title-band">
        <h1 class="title"><span>Agent Harness</span><span class="cn">工程</span></h1>
        <p class="subtitle">从源码里读出的设计决策</p>
      </section>
      <section class="animal-field"><img class="animal" src="${sheep}" alt="一只羊的自然史版画"></section>
      <footer class="author-band"><span class="author">作者 王吕</span><span class="edition">修订版 ${publication.revision} · ${publication.revisionDate}</span></footer>
    </main></body></html>`;

  const page = await browser.newPage({ viewport: { width: 1600, height: 2400 }, deviceScaleFactor: 1 });
  await page.setContent(coverHtml, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const output = join(assetsDir, "cover.png");
  await page.locator(".cover").screenshot({ path: output });
  await page.close();
  return output;
}

function buildPrintHtml(coverPath) {
  const bookCss = inlineFontUrls(readFileSync(join(stylesDir, "book.css"), "utf8"));
  const renderedSections = sections
    .map((section) => {
      const markdown = preparePublicationMarkdown(section);
      return `<section class="${sectionClass(section)} section-${section.id}" data-source="${section.source}">${renderMarkdown(markdown, section, "pdf")}</section>`;
    })
    .join("\n");
  return `<!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="author" content="${escapeHtml(publication.author)}">
        <meta name="description" content="${escapeHtml(publication.subtitle)}">
        <title>${escapeHtml(publication.fullTitle)}</title>
        <style>${bookCss}</style>
      </head>
      <body>
        <img class="book-cover" src="${dataUrl(coverPath)}" alt="${escapeHtml(publication.fullTitle)}封面">
        ${titlePageHtml()}
        ${publicationPageHtml()}
        ${tocHtml()}
        ${renderedSections}
        ${aboutAuthorHtml(
          dataUrl(join(assetsDir, "wechat-qr.png")),
          personalQrPath ? dataUrl(personalQrPath, "image/jpeg") : null,
        )}
      </body>
    </html>`;
}

async function buildPdf(browser, coverPath) {
  const html = buildPrintHtml(coverPath);
  const htmlPath = join(buildDir, "book.html");
  const finalPdfPath = join(pdfOutputDir, "agent-harness-engineering.pdf");
  writeFileSync(htmlPath, html, "utf8");

  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const documentAudit = await page.evaluate(() => ({
    mathElements: document.querySelectorAll("math").length,
    rawDisplayMath: (document.body.innerText.match(/\$\$/g) || []).length,
    tables: document.querySelectorAll("table").length,
    figures: document.querySelectorAll("figure").length,
  }));
  await page.pdf({
    path: finalPdfPath,
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    tagged: true,
    outline: true,
  });
  await page.close();

  const pdfInfo = execFileSync("pdfinfo", [finalPdfPath], { encoding: "utf8" });
  const readPdfInfo = (label) =>
    pdfInfo.match(new RegExp(`^${label}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "unknown";
  return {
    path: finalPdfPath,
    inspection: {
      pages: Number(readPdfInfo("Pages")),
      tagged: readPdfInfo("Tagged"),
      pageSize: readPdfInfo("Page size"),
      ...documentAudit,
    },
  };
}

function xhtmlDocument(title, body, extraClass = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-CN" xml:lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" type="text/css" href="../styles/book.css" />
  </head>
  <body class="${escapeHtml(extraClass)}">${xhtmlize(body)}</body>
</html>`;
}

function epubNav(items) {
  const renderItems = (list) =>
    `<ol>${list
      .map((item) => {
        const file = item.id === "about-author" ? "about-author.xhtml" : `${item.id}.xhtml`;
        const children = item.children?.length ? renderItems(item.children) : "";
        return `<li><a href="text/${file}">${escapeHtml(item.label)}</a>${children}</li>`;
      })
      .join("")}</ol>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-CN" xml:lang="zh-CN">
  <head><meta charset="utf-8" /><title>目录</title><link rel="stylesheet" type="text/css" href="styles/book.css" /></head>
  <body><nav epub:type="toc" id="toc"><h1>目录</h1>${renderItems(items)}</nav></body>
</html>`;
}

function ncxDocument(items) {
  let playOrder = 0;
  const renderItems = (list) =>
    list
      .map((item) => {
        playOrder += 1;
        const currentOrder = playOrder;
        const file = item.id === "about-author" ? "about-author.xhtml" : `${item.id}.xhtml`;
        const children = item.children?.length ? renderItems(item.children) : "";
        return `<navPoint id="nav-${escapeHtml(item.id)}" playOrder="${currentOrder}"><navLabel><text>${escapeHtml(item.label)}</text></navLabel><content src="text/${file}" />${children}</navPoint>`;
      })
      .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${publication.identifier}" /></head>
  <docTitle><text>${escapeHtml(publication.fullTitle)}</text></docTitle>
  <docAuthor><text>${escapeHtml(publication.author)}</text></docAuthor>
  <navMap>${renderItems(items)}</navMap>
</ncx>`;
}

function contentOpf(manifestItems, spineItems) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" prefix="schema: http://schema.org/" unique-identifier="book-id" version="3.0" xml:lang="zh-CN">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${publication.identifier}</dc:identifier>
    <dc:title>${escapeHtml(publication.fullTitle)}</dc:title>
    <dc:creator id="creator">${escapeHtml(publication.author)}</dc:creator>
    <dc:language>${publication.language}</dc:language>
    <dc:date>${publication.publicationDate}</dc:date>
    <dc:publisher>${escapeHtml(publication.author)}</dc:publisher>
    <dc:rights>版权所有 © 2026 王吕</dc:rights>
    <dc:description>Coding agent 执行框架的源码对照、设计判断标准与最小实现。</dc:description>
    <meta property="dcterms:modified">${buildTimestamp}</meta>
    <meta property="schema:accessMode">textual</meta>
    <meta property="schema:accessMode">visual</meta>
    <meta property="schema:accessModeSufficient">textual,visual</meta>
    <meta property="schema:accessibilityFeature">alternativeText</meta>
    <meta property="schema:accessibilityFeature">MathML</meta>
    <meta property="schema:accessibilityFeature">readingOrder</meta>
    <meta property="schema:accessibilityFeature">structuralNavigation</meta>
    <meta property="schema:accessibilityFeature">tableOfContents</meta>
    <meta property="schema:accessibilityHazard">none</meta>
    <meta property="schema:accessibilitySummary">本书提供结构化目录、标题层级、图片替代文本和 MathML 公式。代码示例与外部链接需使用支持相应功能的阅读器。</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join("\n    ")}
  </spine>
</package>`;
}

async function buildEpub(coverPath) {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>`,
  );

  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />`,
    `<item id="css" href="styles/book.css" media-type="text/css" />`,
    `<item id="font-serif" href="fonts/${fontFiles.serif}" media-type="font/woff2" />`,
    `<item id="font-sans" href="fonts/${fontFiles.sans}" media-type="font/woff2" />`,
    `<item id="cover-image" href="images/cover.png" media-type="image/png" properties="cover-image" />`,
    `<item id="qr-image" href="images/wechat-qr.png" media-type="image/png" />`,
    ...(personalQrPath ? [`<item id="personal-qr-image" href="images/wechat-personal.jpg" media-type="image/jpeg" />`] : []),
    `<item id="cover-page" href="text/cover.xhtml" media-type="application/xhtml+xml" />`,
    `<item id="title-page" href="text/title.xhtml" media-type="application/xhtml+xml" />`,
    `<item id="publication-page" href="text/publication.xhtml" media-type="application/xhtml+xml" />`,
    `<item id="about-author" href="text/about-author.xhtml" media-type="application/xhtml+xml" />`,
  ];
  const spine = [
    `<itemref idref="cover-page" linear="yes" />`,
    `<itemref idref="title-page" linear="yes" />`,
    `<itemref idref="publication-page" linear="yes" />`,
  ];

  const epubCss = removePageAtRules(readFileSync(join(stylesDir, "book.css"), "utf8"));
  zip.file("OEBPS/styles/book.css", epubCss);
  zip.file(`OEBPS/fonts/${fontFiles.serif}`, readFileSync(join(fontDir, fontFiles.serif)));
  zip.file(`OEBPS/fonts/${fontFiles.sans}`, readFileSync(join(fontDir, fontFiles.sans)));
  zip.file(
    "META-INF/licenses/OFL-NotoSerifSC.txt",
    readFileSync(join(fontDir, "OFL-NotoSerifSC.txt"), "utf8"),
  );
  zip.file(
    "META-INF/licenses/OFL-NotoSansSC.txt",
    readFileSync(join(fontDir, "OFL-NotoSansSC.txt"), "utf8"),
  );
  zip.file("OEBPS/images/cover.png", readFileSync(coverPath));
  zip.file("OEBPS/images/wechat-qr.png", readFileSync(join(assetsDir, "wechat-qr.png")));
  if (personalQrPath) zip.file("OEBPS/images/wechat-personal.jpg", readFileSync(personalQrPath));

  const coverBody = `<section class="epub-cover-page" epub:type="cover"><img class="epub-cover" src="../images/cover.png" alt="${escapeHtml(publication.fullTitle)}封面" /></section>`;
  zip.file("OEBPS/text/cover.xhtml", xhtmlDocument(publication.fullTitle, coverBody, "epub-cover-page"));
  zip.file("OEBPS/text/title.xhtml", xhtmlDocument(publication.fullTitle, titlePageHtml()));
  zip.file("OEBPS/text/publication.xhtml", xhtmlDocument("出版信息", publicationPageHtml()));

  for (const section of sections) {
    const markdown = preparePublicationMarkdown(section);
    const rendered = renderMarkdown(markdown, section, "epub");
    const body = `<section class="${sectionClass(section)} section-${section.id}">${rendered}</section>`;
    const fileName = `${section.id}.xhtml`;
    zip.file(`OEBPS/text/${fileName}`, xhtmlDocument(section.label, body));
    const properties = rendered.includes("<math") ? ' properties="mathml"' : "";
    manifest.push(`<item id="${section.id}" href="text/${fileName}" media-type="application/xhtml+xml"${properties} />`);
    spine.push(`<itemref idref="${section.id}" />`);
  }

  const figureNames = sections
    .flatMap((section) => {
      const markdown = preparePublicationMarkdown(section);
      return [...markdown.matchAll(/!\[[^\]]*\]\(\.\.\/figures\/([^\)]+)\)/g)].map((match) => match[1]);
    })
    .filter((value, index, all) => all.indexOf(value) === index);
  for (const [index, fileName] of figureNames.entries()) {
    zip.file(`OEBPS/images/${fileName}`, readFileSync(join(figuresDir, fileName)));
    manifest.push(`<item id="figure-${index + 1}" href="images/${escapeHtml(fileName)}" media-type="image/svg+xml" />`);
  }

  const aboutBody = aboutAuthorHtml("../images/wechat-qr.png", personalQrPath ? "../images/wechat-personal.jpg" : null);
  zip.file("OEBPS/text/about-author.xhtml", xhtmlDocument("关于作者", aboutBody));
  spine.push(`<itemref idref="about-author" />`);
  zip.file("OEBPS/nav.xhtml", epubNav(bookmarkTree));
  zip.file("OEBPS/toc.ncx", ncxDocument(bookmarkTree));
  zip.file("OEBPS/content.opf", contentOpf(manifest, spine));

  const outputPath = join(epubOutputDir, "agent-harness-engineering.epub");
  const bytes = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
  });
  writeFileSync(outputPath, bytes);
  return { path: outputPath, figures: figureNames.length };
}

function writeBuildManifest(results) {
  const files = [results.coverPath, results.pdf.path, results.epub.path];
  const manifest = {
    publication,
    generatedAt: new Date().toISOString(),
    files: files.map((file) => ({
      path: file.replace(`${projectRoot}/`, ""),
      bytes: readFileSync(file).length,
      sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
    })),
    pdf: results.pdf.inspection,
    epub: { figures: results.epub.figures },
    editorial: editorialAudit,
  };
  writeFileSync(join(buildDir, "build-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  return manifest;
}

async function main() {
  ensureLayout();
  const browser = await chromium.launch({ headless: true });
  try {
    const coverPath = await renderCover(browser);
    const pdf = await buildPdf(browser, coverPath);
    const epub = await buildEpub(coverPath);
    const manifest = writeBuildManifest({ coverPath, pdf, epub });
    console.log(JSON.stringify(manifest, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
