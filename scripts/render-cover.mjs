import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

let sharp;
try {
  sharp = require(join(projectRoot, "node_modules", "sharp"));
} catch {
  try {
    sharp = require(resolve(projectRoot, "..", "..", "projects", "openclaw", "node_modules", "sharp"));
  } catch (err) {
    throw new Error("无法加载 sharp 依赖: " + err.message);
  }
}

const sheepPath = join(projectRoot, "assets", "sheep-engraving.png");
const sheepBuffer = readFileSync(sheepPath);
const sheepBase64 = `data:image/png;base64,${sheepBuffer.toString("base64")}`;

const width = 1600;
const height = 2400;

const colors = {
  paper: "#F7F4EC",
  frameLine: "#D6CFBE",
  frameLineLight: "#E8E2D4",
  band: "#843B34",
  bandBottomLine: "#6A2D27",
  bandTopLine: "#9A4A42",
  bandAccent: "#843B34",
  accentBorder: "#6A2D27",
  titleText: "#FFFDF8",
  subText: "#EFE8DC",
  captionText: "#8E887B",
  captionLine: "#CDC6B5",
  footerBand: "#181817",
  footerTopLine: "#2E2D2A",
  footerText: "#FFFDF8",
  footerSub: "#CBC5B8",
};

const bandHeight = 558;
const footerHeight = 172;

const plateLeft = 90;
const plateRight = width - 90;
const plateTop = bandHeight + 36;
const plateBottom = height - footerHeight - 36;

const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title-en {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "PingFang SC", "Noto Sans SC", "Alibaba PuHuiTi", "Helvetica Neue", sans-serif;
        font-size: 120px;
        font-weight: 700;
        letter-spacing: -2px;
        fill: ${colors.titleText};
      }
      .title-cn {
        font-family: "PingFang SC", "Noto Sans SC", "Alibaba PuHuiTi", "Source Han Sans SC", "Heiti SC", sans-serif;
        font-size: 116px;
        font-weight: 700;
        letter-spacing: 6px;
        fill: ${colors.titleText};
      }
      .subtitle {
        font-family: "PingFang SC", "Noto Sans SC", "Alibaba PuHuiTi", "Songti SC", sans-serif;
        font-size: 42px;
        font-weight: 400;
        letter-spacing: 2px;
        fill: ${colors.subText};
      }
      .caption-main {
        font-family: "Songti SC", "STSong", "Noto Serif SC", "Georgia", serif;
        font-size: 22px;
        font-weight: 500;
        letter-spacing: 5px;
        fill: ${colors.captionText};
        text-anchor: middle;
      }
      .caption-sub {
        font-family: "Times New Roman", "Songti SC", serif;
        font-size: 19px;
        font-style: italic;
        letter-spacing: 3px;
        fill: ${colors.captionText};
      }
      .author-name {
        font-family: "PingFang SC", "Noto Sans SC", "Alibaba PuHuiTi", sans-serif;
        font-size: 48px;
        font-weight: 600;
        letter-spacing: 4px;
        fill: ${colors.footerText};
      }
      .author-tag {
        font-family: "PingFang SC", "Noto Sans SC", "Alibaba PuHuiTi", sans-serif;
        font-size: 34px;
        font-weight: 400;
        letter-spacing: 1px;
        fill: ${colors.footerSub};
      }
      .edition {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif;
        font-size: 24px;
        font-weight: 500;
        letter-spacing: 3.5px;
        fill: ${colors.footerSub};
        text-anchor: end;
      }
    </style>
  </defs>

  <!-- 1. Paper Background -->
  <rect width="${width}" height="${height}" fill="${colors.paper}"/>

  <!-- 2. Central Natural History Engraving Plate Window (Inner Classical Border) -->
  <rect x="${plateLeft}" y="${plateTop}" width="${plateRight - plateLeft}" height="${plateBottom - plateTop}" fill="none" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <rect x="${plateLeft + 8}" y="${plateTop + 8}" width="${plateRight - plateLeft - 16}" height="${plateBottom - plateTop - 16}" fill="none" stroke="${colors.frameLineLight}" stroke-width="0.8"/>
  
  <!-- Subtle corner marks on plate frame -->
  <line x1="${plateLeft - 8}" y1="${plateTop}" x2="${plateLeft + 24}" y2="${plateTop}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateLeft}" y1="${plateTop - 8}" x2="${plateLeft}" y2="${plateTop + 24}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateRight - 24}" y1="${plateTop}" x2="${plateRight + 8}" y2="${plateTop}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateRight}" y1="${plateTop - 8}" x2="${plateRight}" y2="${plateTop + 24}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateLeft - 8}" y1="${plateBottom}" x2="${plateLeft + 24}" y2="${plateBottom}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateLeft}" y1="${plateBottom - 24}" x2="${plateLeft}" y2="${plateBottom + 8}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateRight - 24}" y1="${plateBottom}" x2="${plateRight + 8}" y2="${plateBottom}" stroke="${colors.frameLine}" stroke-width="1.8"/>
  <line x1="${plateRight}" y1="${plateBottom - 24}" x2="${plateRight}" y2="${plateBottom + 8}" stroke="${colors.frameLine}" stroke-width="1.8"/>

  <!-- 3. Top Title Band -->
  <rect x="0" y="0" width="${width}" height="${bandHeight}" fill="${colors.band}"/>
  <line x1="0" y1="0" x2="${width}" y2="0" stroke="${colors.bandTopLine}" stroke-width="3"/>
  <line x1="0" y1="${bandHeight}" x2="${width}" y2="${bandHeight}" stroke="${colors.bandBottomLine}" stroke-width="3"/>
  
  <!-- Classical Accent Tab below band -->
  <rect x="120" y="${bandHeight}" width="200" height="14" fill="${colors.bandAccent}"/>
  <line x1="120" y1="${bandHeight}" x2="120" y2="${bandHeight + 14}" stroke="${colors.accentBorder}" stroke-width="1.5"/>
  <line x1="320" y1="${bandHeight}" x2="320" y2="${bandHeight + 14}" stroke="${colors.accentBorder}" stroke-width="1.5"/>
  <line x1="120" y1="${bandHeight + 14}" x2="320" y2="${bandHeight + 14}" stroke="${colors.accentBorder}" stroke-width="1.5"/>

  <!-- 4. Typography in Title Band -->
  <g transform="translate(120, 172)">
    <text x="-2" y="0" class="title-en">Agent Harness</text>
    <text x="0" y="130" class="title-cn">工程</text>
    <text x="0" y="232" class="subtitle">从源码里读出的设计决策</text>
  </g>

  <!-- 5. Central Merino Sheep Engraving -->
  <image href="${sheepBase64}" x="280" y="690" width="1040" height="1215" preserveAspectRatio="xMidYMid meet"/>

  <!-- Specimen Latin / Academic Caption Line with proper spacing -->
  <g transform="translate(800, 2075)">
    <line x1="-220" y1="-8" x2="-140" y2="-8" stroke="${colors.captionLine}" stroke-width="1"/>
    <text x="0" y="0" class="caption-main">美利奴羊 <tspan class="caption-sub">· Ovis aries</tspan></text>
    <line x1="140" y1="-8" x2="220" y2="-8" stroke="${colors.captionLine}" stroke-width="1"/>
  </g>

  <!-- 6. Bottom Author Band -->
  <rect x="0" y="${height - footerHeight}" width="${width}" height="${footerHeight}" fill="${colors.footerBand}"/>
  <line x1="0" y1="${height - footerHeight}" x2="${width}" y2="${height - footerHeight}" stroke="${colors.footerTopLine}" stroke-width="2"/>

  <!-- Author Content -->
  <g transform="translate(120, ${height - footerHeight + 104})">
    <text x="0" y="0" class="author-name"><tspan class="author-tag">作者</tspan> 王吕</text>
    <text x="${width - 240}" y="-6" class="edition">电子版 · 2026</text>
  </g>
</svg>
`;

export async function renderCover() {
  const outputPng = join(projectRoot, "assets", "cover.png");
  const svgBuffer = Buffer.from(svg);
  await sharp(svgBuffer)
    .resize(width, height)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPng);
  return outputPng;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  renderCover().then((p) => console.log("Rendered cover:", p)).catch(console.error);
}
