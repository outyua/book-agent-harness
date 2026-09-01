import { execFileSync } from 'node:child_process';
import { readdir, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { publication, sections } from '../scripts/lib/manuscript.mjs';

const SITE = 'https://agent-harness.codeflow.cc';
const bookRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

function git(args) {
	return execFileSync('git', args, { cwd: bookRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

/**
 * 每个页面的最后修改时间，写进 sitemap 的 <lastmod>。
 * 取书稿文件在 git 里的最近提交时间。Cloudflare 构建机是浅克隆（只有 HEAD 一个提交），
 * 这时 `git log -1 -- 文件` 会把每个文件都报成 HEAD 的时间，等于全站都「今天改过」，
 * 所以浅克隆或没有 git 时一律退回修订日期。
 */
let gitUsable = null;
function gitDate(relativePath) {
	try {
		if (gitUsable === null) gitUsable = git(['rev-parse', '--is-shallow-repository']) === 'false';
		if (!gitUsable) return null;
		return git(['log', '-1', '--format=%cI', '--', relativePath]) || null;
	} catch {
		gitUsable = false;
		return null;
	}
}

function buildLastmod() {
	const fallback = `${publication.revisionDate}T12:00:00+08:00`; // 取中午，换算成 UTC 仍是同一天
	/** @type {Map<string, string>} */
	const map = new Map();
	let newest = fallback;
	for (const section of sections) {
		const date = gitDate(`manuscript/${section.source}`) ?? fallback;
		map.set(`/book/${section.id}`, date);
		if (date > newest) newest = date;
	}
	map.set('/', newest);
	return map;
}

const lastmod = buildLastmod();

/** Astro sitemap always writes sitemap-index.xml + sitemap-0.xml. Flatten to /sitemap.xml. */
function flattenSitemap() {
	return {
		name: 'flatten-sitemap',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				const outDir = fileURLToPath(dir);
				const files = await readdir(outDir);
				const chunks = files.filter((name) => /^sitemap-\d+\.xml$/.test(name)).sort();
				if (chunks.length !== 1 || chunks[0] !== 'sitemap-0.xml') {
					throw new Error(
						`flatten-sitemap: expected a single sitemap-0.xml, found ${chunks.join(', ') || '(none)'}`,
					);
				}
				await rename(join(outDir, 'sitemap-0.xml'), join(outDir, 'sitemap.xml'));
				await unlink(join(outDir, 'sitemap-index.xml'));
				logger.info('flattened sitemap-0.xml → sitemap.xml');
			},
		},
	};
}

// Google Analytics（GA4）。测量 ID 从环境变量 PUBLIC_GA_MEASUREMENT_ID 读取（Cloudflare 构建时在
// Worker → Settings → Variables and Secrets 里配置，本地可写在 site/.env），未设置时用默认的 G-G6XTK77696。
const gaId = process.env.PUBLIC_GA_MEASUREMENT_ID ?? 'G-G6XTK77696';
const gaHead = gaId
	? [
			{
				tag: 'script',
				attrs: { src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`, async: true },
			},
			{
				tag: 'script',
				content: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${gaId}', { anonymize_ip: true });`,
			},
		]
	: [];

// 站长工具的 HTML 标记验证：设置对应环境变量即注入（也可改用 DNS 验证，见 README）。
const verificationMeta = [
	['google-site-verification', process.env.PUBLIC_GOOGLE_SITE_VERIFICATION],
	['msvalidate.01', process.env.PUBLIC_BING_SITE_VERIFICATION],
	// 百度站长平台的 HTML 标签验证码（2026-08-31 申请）；根目录同时放了文件验证 baidu_verify_codeva-s4YKR4npRD.html
	['baidu-site-verification', process.env.PUBLIC_BAIDU_SITE_VERIFICATION ?? 'codeva-s4YKR4npRD'],
]
	.filter(([, value]) => value)
	.map(([name, content]) => ({ tag: 'meta', attrs: { name, content } }));

// 全站相同的社交卡片：横版 1200×630（由 scripts/make-og.mjs 生成，随仓库提交）。
// 竖版封面 cover.png 只用在首页正文和 Book 结构化数据里，不再当预览图，避免被裁掉文字。
// 按页不同的标签（title 去重、twitter:title、章节 JSON-LD、面包屑、markdown alternate）在 src/starlightRouteData.ts。
const seoHead = [
	{ tag: 'link', attrs: { rel: 'sitemap', href: '/sitemap.xml' } },
	{ tag: 'meta', attrs: { property: 'og:image', content: `${SITE}/og.jpg` } },
	{ tag: 'meta', attrs: { property: 'og:image:type', content: 'image/jpeg' } },
	{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
	{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
	{ tag: 'meta', attrs: { property: 'og:image:alt', content: `${publication.fullTitle}，作者 ${publication.author}` } },
	{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
	{ tag: 'meta', attrs: { name: 'twitter:image', content: `${SITE}/og.jpg` } },
	{ tag: 'meta', attrs: { name: 'twitter:image:alt', content: `${publication.fullTitle}，作者 ${publication.author}` } },
	{ tag: 'meta', attrs: { name: 'author', content: publication.author } },
	...verificationMeta,
];

// 侧栏结构与电子书书签树一致：序 → 六个部分（导读 + 各章）→ 后记。
// 侧栏用短标签：部分作为分组名，部扉页显示为「导读」，章只保留章号与标题；其他部分默认折叠。
function sidebarLabel(section) {
	if (section.type === 'part') return '导读';
	const m = section.label.match(/^第 (\d+) 章 · (.+)$/);
	return m ? `${m[1]} · ${m[2]}` : section.label;
}

function buildSidebar() {
	const groups = [];
	let current = null;
	for (const section of sections) {
		const item = { label: sidebarLabel(section), slug: `book/${section.id}` };
		if (section.type === 'part') {
			current = { label: section.label, collapsed: true, items: [item] };
			groups.push(current);
		} else if (section.type === 'chapter' && current) {
			current.items.push(item);
		} else {
			current = null;
			groups.push({ label: section.label, slug: `book/${section.id}` });
		}
	}
	return groups;
}

export default defineConfig({
	site: SITE,
	// 页面地址不带尾斜杠（/book/chapter-1）。Starlight 的 canonical、侧栏、分页链接都按这个值生成；
	// 线上由 wrangler.jsonc 的 html_handling: drop-trailing-slash 把 /book/chapter-1/ 跳到无斜杠地址。
	trailingSlash: 'never',
	integrations: [
		starlight({
			title: publication.title,
			description: publication.fullTitle,
			defaultLocale: 'root',
			locales: {
				root: { label: '简体中文', lang: 'zh-CN' },
			},
			// 页头 logo 用 sync-content.mjs 生成的小图（128×192），不再把 1600×2400 的封面塞进每个页面。
			logo: { src: './src/assets/logo.png', alt: publication.fullTitle },
			favicon: '/favicon.svg',
			customCss: ['./src/styles/book.css'],
			components: { Footer: './src/components/Footer.astro' },
			routeMiddleware: './src/starlightRouteData.ts',
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			lastUpdated: false,
			credits: false,
			sidebar: buildSidebar(),
			head: /** @type {any} */ ([...seoHead, ...gaHead]),
		}),
		// 显式配置 sitemap（Starlight 发现已有同名集成就不再自动注入），给每条 URL 加 lastmod。
		sitemap({
			serialize(item) {
				const path = new URL(item.url).pathname;
				const date = lastmod.get(path);
				if (date) item.lastmod = date;
				return item;
			},
		}),
		// Must run after the sitemap integration so its files exist first.
		flattenSitemap(),
	],
});
