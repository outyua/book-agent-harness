// 生成社交分享用的横版图（Open Graph / Twitter / 微信卡片）：1200×630，写入 ../assets/og.jpg。
//
// 为什么不在构建时生成：文字靠系统里的中文字体渲染，Cloudflare 的构建机没有中文字体，
// 会出豆腐块。所以在本机跑一次、把结果提交进仓库，sync-content.mjs 再拷进 public/。
//
// 用法：在 site/ 目录运行 `pnpm og`。改了书名、作者或封面后重新跑一次。

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { publication } from "../../scripts/lib/manuscript.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const bookRoot = resolve(scriptDir, "..", "..");
const assetsDir = join(bookRoot, "assets");

const W = 1200;
const H = 630;
const PAD = 40;
const COVER_H = H - PAD * 2; // 550
const COVER_W = Math.round((COVER_H * 2) / 3); // 366，封面为 2:3
const LEFT_W = COVER_W + PAD * 2; // 446
const TEXT_X = LEFT_W + 64;

const paper = "#fcfbf8";
const ink = "#1f1d1b";
const accent = "#7a2e2b";
const gray = "#6b6560";
const font = "'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif";

function esc(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${paper}"/>
  <rect width="${LEFT_W}" height="${H}" fill="${accent}"/>
  <g font-family="${font}" fill="${ink}">
    <text x="${TEXT_X}" y="150" font-size="72" font-weight="700">Agent Harness</text>
    <text x="${TEXT_X}" y="236" font-size="72" font-weight="700">工程</text>
    <text x="${TEXT_X}" y="310" font-size="34" font-weight="500" fill="${accent}">${esc(publication.subtitle)}</text>
    <text x="${TEXT_X}" y="388" font-size="26" fill="${gray}">同一个工程问题，23 个真实 coding agent 分别怎么做、</text>
    <text x="${TEXT_X}" y="428" font-size="26" fill="${gray}">为什么分歧、判断标准是什么、抄哪个。</text>
    <line x1="${TEXT_X}" y1="482" x2="${W - PAD - 24}" y2="482" stroke="#e6e1da" stroke-width="2"/>
    <text x="${TEXT_X}" y="536" font-size="28" font-weight="600">作者 ${esc(publication.author)}</text>
    <text x="${TEXT_X}" y="576" font-size="22" fill="${gray}">公众号 ${esc(publication.account)} · agent-harness.codeflow.cc</text>
  </g>
</svg>`;

const cover = await sharp(join(assetsDir, "cover.png")).resize(COVER_W, COVER_H).png().toBuffer();
const shadow = await sharp({
  create: { width: COVER_W + 24, height: COVER_H + 24, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.35 } },
})
  .blur(10)
  .png()
  .toBuffer();

const out = join(assetsDir, "og.jpg");
const info = await sharp(Buffer.from(svg))
  .composite([
    { input: shadow, left: PAD - 6, top: PAD - 2 },
    { input: cover, left: PAD, top: PAD },
  ])
  .jpeg({ quality: 88, mozjpeg: true })
  .toFile(out);

console.log(`已生成 ${out}：${info.width}×${info.height}，${Math.round(info.size / 1024)} KB`);
