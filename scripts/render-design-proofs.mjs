#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

function loadDependency(name) {
  try {
    return require(name);
  } catch (error) {
    throw new Error(`缺少样张依赖 ${name}: ${error.message}`);
  }
}

const { chromium } = loadDependency("playwright");
const sharp = loadDependency("sharp");
const temml = loadDependency("temml");

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const round = process.argv.includes("--round-2") ? 2 : 1;
const outputDir = join(projectRoot, "proofs", `round-${round}`);
const sheepPath = join(projectRoot, "assets", "sheep-engraving.png");

mkdirSync(outputDir, { recursive: true });

const roundOneVariants = [
  {
    id: "a",
    name: "图鉴白",
    note: "接近自然史图鉴：纸白为主，只有一道暗红色标。",
    cover: {
      paper: "#f4f0e6",
      ink: "#171715",
      accent: "#8d3d32",
      band: "none",
      titleFont: '"Alibaba PuHuiTi", "Noto Sans CJK SC", sans-serif',
      titleWeight: 700,
      titleColor: "#171715",
      subtitleColor: "#4f4b43",
      authorColor: "#171715",
    },
    interior: {
      paper: "#fbfaf7",
      ink: "#24221f",
      secondary: "#615d55",
      rule: "#c9c5bc",
      wash: "#f1efe9",
      accent: "#7e352d",
      bodyFont: '"Songti SC", STSong, serif',
      headingFont: '"Alibaba PuHuiTi", "Noto Sans CJK SC", sans-serif',
      bodySize: 30,
      leading: 1.68,
      headingWeight: 600,
    },
  },
  {
    id: "b",
    name: "经典色带",
    note: "最接近经典动物技术书：单一低饱和色带、白底版画、无黑色底栏。",
    cover: {
      paper: "#f6f2e9",
      ink: "#181715",
      accent: "#8a4037",
      band: "#8a4037",
      titleFont: '"Noto Sans CJK SC", "Alibaba PuHuiTi", sans-serif',
      titleWeight: 700,
      titleColor: "#fffdf7",
      subtitleColor: "#eee7dc",
      authorColor: "#181715",
    },
    interior: {
      paper: "#ffffff",
      ink: "#202020",
      secondary: "#5f5f5f",
      rule: "#c8c8c5",
      wash: "#f2f2f0",
      accent: "#3f3f3d",
      bodyFont: '"Noto Sans CJK SC", "Alibaba PuHuiTi", sans-serif',
      headingFont: '"Noto Sans CJK SC", "Alibaba PuHuiTi", sans-serif',
      bodySize: 29,
      leading: 1.62,
      headingWeight: 700,
    },
  },
  {
    id: "c",
    name: "书刊混排",
    note: "宋体长文、黑体标题，颜色只留在章标题短线和页码。",
    cover: {
      paper: "#faf9f5",
      ink: "#161616",
      accent: "#963f33",
      band: "none",
      titleFont: '"Songti SC", "STSong", serif',
      titleWeight: 700,
      titleColor: "#161616",
      subtitleColor: "#4b4945",
      authorColor: "#161616",
    },
    interior: {
      paper: "#fcfbf8",
      ink: "#22211f",
      secondary: "#5b5852",
      rule: "#cbc7be",
      wash: "#f3f1ec",
      accent: "#913c31",
      bodyFont: '"Songti SC", STSong, serif',
      headingFont: '"Noto Sans CJK SC", "Alibaba PuHuiTi", sans-serif',
      bodySize: 29,
      leading: 1.66,
      headingWeight: 600,
    },
  },
];

const roundTwoVariants = [
  {
    id: "d",
    name: "最终版",
    note: "封面参考经典动物技术书的版式；正文采用宋体长文、黑体层级和单一暗红强调。",
    cover: {
      paper: "#f7f4ec",
      ink: "#191918",
      accent: "#843b34",
      band: "#843b34",
      bandHeight: 510,
      animalTop: 590,
      animalWidth: 960,
      animalHeight: 1120,
      titleSize: 112,
      titleFont: '"Alibaba PuHuiTi", "Noto Sans CJK SC", sans-serif',
      titleWeight: 700,
      titleColor: "#fffdf8",
      subtitleColor: "#efe9df",
      subtitleFont: '"Alibaba PuHuiTi", "Noto Sans CJK SC", sans-serif',
      subtitleSize: 40,
      authorColor: "#fffdf8",
      footerBand: "#191918",
      footerHeight: 160,
    },
    interior: {
      paper: "#fffefb",
      ink: "#20201e",
      secondary: "#5d5a54",
      rule: "#cec9c0",
      wash: "#f4f2ed",
      accent: "#813a33",
      bodyFont: '"Songti SC", STSong, serif',
      headingFont: '"Noto Sans CJK SC", "Alibaba PuHuiTi", sans-serif',
      bodySize: 31,
      leading: 1.66,
      headingWeight: 500,
      pageMargin: 170,
      h1Size: 68,
      h2Size: 39,
    },
  },
];

const variants = round === 2 ? roundTwoVariants : roundOneVariants;

function dataUrl(path) {
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

function coverHtml(variant) {
  const v = variant.cover;
  const hasBand = v.band !== "none";
  const hasFooterBand = Boolean(v.footerBand);
  const bandHeight = v.bandHeight ?? (hasBand ? 630 : 570);
  const animalTop = v.animalTop ?? (hasBand ? 700 : 650);
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{width:1440px;height:2160px;margin:0;overflow:hidden;background:${v.paper}}
    body{font-family:${v.titleFont};color:${v.ink}}
    .page{position:relative;width:1440px;height:2160px;overflow:hidden;background:${v.paper}}
    .title-zone{position:absolute;inset:0 0 auto 0;height:${bandHeight}px;padding:86px 108px 70px;background:${hasBand ? v.band : v.paper};border-bottom:${hasBand ? 0 : 2}px solid ${v.ink}}
    .title{max-width:1200px;margin:0;color:${v.titleColor};font-family:${v.titleFont};font-size:${v.titleSize ?? (variant.id === "c" ? 116 : 122)}px;font-weight:${v.titleWeight};letter-spacing:-.025em;line-height:1.01}
    .title span{display:block}
    .subtitle{margin:34px 0 0;color:${v.subtitleColor};font-family:${v.subtitleFont ?? '"Songti SC",STSong,serif'};font-size:${v.subtitleSize ?? 45}px;font-weight:400;letter-spacing:0;line-height:1.35}
    .accent{position:absolute;left:108px;top:${bandHeight}px;width:${hasBand ? 220 : 180}px;height:${hasBand ? 10 : 12}px;background:${v.accent}}
    .animal-field{position:absolute;left:82px;right:82px;top:${animalTop}px;bottom:${hasFooterBand ? v.footerHeight : 205}px;border-bottom:${hasFooterBand ? 0 : 2}px solid ${v.ink}}
    .animal{position:absolute;left:50%;bottom:40px;width:${v.animalWidth ?? 1140}px;height:${v.animalHeight ?? 1180}px;transform:translateX(-50%);object-fit:contain;filter:contrast(1.07)}
    .author{position:absolute;left:${hasFooterBand ? 0 : 108}px;right:${hasFooterBand ? 0 : 108}px;bottom:${hasFooterBand ? 0 : 72}px;height:${hasFooterBand ? `${v.footerHeight}px` : "auto"};padding:${hasFooterBand ? "0 108px" : 0};display:flex;align-items:center;justify-content:space-between;background:${hasFooterBand ? v.footerBand : "transparent"};color:${v.authorColor};font-family:"Alibaba PuHuiTi","Noto Sans CJK SC",sans-serif}
    .author strong{font-size:46px;font-weight:600;letter-spacing:0}
    .author span{font-size:22px;font-weight:500;letter-spacing:.08em;text-transform:uppercase}
  </style></head><body><main class="page">
    <header class="title-zone"><h1 class="title"><span>Agent Harness</span><span>工程</span></h1><p class="subtitle">从源码里读出的设计决策</p></header>
    <div class="accent"></div>
    <section class="animal-field"><img class="animal" src="${dataUrl(sheepPath)}" alt="羊的自然史版画"></section>
    <footer class="author"><strong>作者 王吕</strong><span>电子版 · 2026</span></footer>
  </main></body></html>`;
}

function interiorHtml(variant) {
  const v = variant.interior;
  const pageMargin = v.pageMargin ?? 150;
  const math = temml.renderToString("\\text{Agent} = \\text{Model} + \\text{Harness}", {
    displayMode: true,
    throwOnError: true,
  });
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{width:1440px;height:2160px;margin:0;overflow:hidden;background:${v.paper}}
    body{color:${v.ink};font-family:${v.bodyFont};font-size:${v.bodySize}px;font-weight:400;line-height:${v.leading};letter-spacing:0;word-spacing:0;text-align:left;-webkit-font-smoothing:antialiased}
    .page{position:relative;width:1440px;height:2160px;padding:150px ${pageMargin}px 156px;background:${v.paper}}
    .running{position:absolute;left:${pageMargin}px;right:${pageMargin}px;top:74px;display:flex;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid ${v.rule};color:${v.secondary};font-family:${v.headingFont};font-size:18px;font-weight:500;letter-spacing:.02em}
    h1,h2{font-family:${v.headingFont};font-weight:${v.headingWeight};letter-spacing:-.018em;text-align:left}
    h1{max-width:1040px;margin:0 0 68px;font-size:${v.h1Size ?? 72}px;line-height:1.16}
    h1:after{display:block;width:86px;height:7px;margin-top:30px;background:${v.accent};content:""}
    h2{margin:54px 0 24px;font-size:${v.h2Size ?? 42}px;line-height:1.3}
    p{margin:0 0 28px;text-align:left}
    strong{font-family:${v.headingFont};font-weight:600}
    code{padding:2px 8px;background:${v.wash};font-family:SFMono-Regular,Monaco,monospace;font-size:.82em;overflow-wrap:anywhere}
    .math{margin:46px 0 48px;padding:34px 0;border-top:1px solid ${v.rule};border-bottom:1px solid ${v.rule};font-family:"STIX Two Math","STIXGeneral",serif;font-size:45px;text-align:center}
    math{font-family:"STIX Two Math","STIXGeneral",serif}
    table{width:100%;margin:38px 0 42px;border-collapse:collapse;font-family:${v.headingFont};font-size:23px;line-height:1.46;text-align:left}
    th,td{padding:15px 17px;border-top:1px solid ${v.rule};border-bottom:1px solid ${v.rule};vertical-align:top}
    th{background:${v.wash};font-weight:600}
    blockquote{margin:40px 0 0;padding:0 0 0 24px;border-left:1px solid ${v.accent};color:${v.secondary};font-size:27px;line-height:1.65}
    blockquote p{margin:0}
    .folio{position:absolute;left:${pageMargin}px;right:${pageMargin}px;bottom:68px;padding-top:18px;border-top:1px solid ${v.rule};color:${v.accent};font-family:${v.headingFont};font-size:19px;text-align:center}
  </style></head><body><article class="page">
    <header class="running"><span>AGENT HARNESS 工程</span><span>王吕</span></header>
    <h1>第 1 章 · Agent = Model + Harness</h1>
    <h2>1.1 循环只占 2%–10%，剩下的是什么</h2>
    <p>一个能干活的 coding agent，代码里真正让模型转起来的循环只是很小的一部分。权限、上下文、工具、恢复和验证，才决定它能不能长期工作。</p>
    <p><strong>先把定义写清楚。</strong> 本书所说的执行框架，英文是 <code>harness</code>。它不是模型，也不是单独一个工作流框架。</p>
    <div class="math" role="math" aria-label="Agent equals Model plus Harness">${math}</div>
    <table><thead><tr><th>项目</th><th>循环所在文件</th><th>循环占比</th></tr></thead><tbody>
      <tr><td>pi-mono</td><td><code>agent-loop.ts</code></td><td>6.2%</td></tr>
      <tr><td>opencode</td><td><code>processor.ts</code></td><td>2.0%</td></tr>
      <tr><td>codebuff</td><td><code>run-agent-step.ts</code></td><td>9.8%</td></tr>
    </tbody></table>
    <blockquote><p>公式不是口号。它要求我们把模型之外的工程代码当成独立对象来设计、验证和复核。</p></blockquote>
    <footer class="folio">12</footer>
  </article></body></html>`;
}

async function renderPage(browser, html, output) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 2160 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, fullPage: false });
  await page.close();
}

async function buildComparison() {
  const cellWidth = 680;
  const pageHeight = 1020;
  const labelHeight = 104;
  const gap = 30;
  const boardWidth = gap + variants.length * (cellWidth + gap);
  const boardHeight = gap + 2 * (pageHeight + labelHeight + gap);
  const composites = [];

  for (const [column, variant] of variants.entries()) {
    for (const [row, kind] of ["cover", "interior"].entries()) {
      const input = join(outputDir, `${kind}-${variant.id}.png`);
      const resized = await sharp(input).resize(cellWidth, pageHeight, { fit: "cover" }).png().toBuffer();
      const label = Buffer.from(`<svg width="${cellWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#eceae4"/><text x="18" y="39" font-family="PingFang SC, sans-serif" font-size="26" font-weight="600" fill="#1d1d1b">${variant.id.toUpperCase()} · ${variant.name} · ${kind === "cover" ? "封面" : "正文"}</text><text x="18" y="76" font-family="PingFang SC, sans-serif" font-size="19" fill="#5c5952">${variant.note}</text></svg>`);
      const left = gap + column * (cellWidth + gap);
      const top = gap + row * (pageHeight + labelHeight + gap);
      composites.push({ input: resized, left, top });
      composites.push({ input: label, left, top: top + pageHeight });
    }
  }
  await sharp({ create: { width: boardWidth, height: boardHeight, channels: 3, background: "#bdb9b0" } })
    .composite(composites)
    .png()
    .toFile(join(outputDir, "comparison.png"));
}

async function buildProofPdf(browser) {
  const pages = variants.flatMap((variant) => [
    { name: `${variant.name} · 封面`, path: join(outputDir, `cover-${variant.id}.png`) },
    { name: `${variant.name} · 正文`, path: join(outputDir, `interior-${variant.id}.png`) },
  ]);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:6in 9in;margin:0}*{box-sizing:border-box}html,body{margin:0}.proof{width:6in;height:9in;page-break-after:always}.proof:last-child{page-break-after:auto}.proof img{display:block;width:6in;height:9in;object-fit:cover}</style></head><body>${pages.map((item) => `<section class="proof"><img src="${dataUrl(item.path)}" alt="${item.name}"></section>`).join("")}</body></html>`;
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: join(outputDir, `book-design-proof-round-${round}.pdf`), printBackground: true, preferCSSPageSize: true });
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const variant of variants) {
      await renderPage(browser, coverHtml(variant), join(outputDir, `cover-${variant.id}.png`));
      await renderPage(browser, interiorHtml(variant), join(outputDir, `interior-${variant.id}.png`));
    }
    await buildComparison();
    await buildProofPdf(browser);
    writeFileSync(
      join(outputDir, "proof-manifest.json"),
      JSON.stringify(
        {
          round,
          generatedAt: new Date().toISOString(),
          variants: variants.map(({ id, name, note }) => ({ id, name, note })),
          latex: "Temml 0.13.4 -> MathML",
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(outputDir);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
