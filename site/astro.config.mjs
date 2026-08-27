// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { publication, sections } from '../scripts/lib/manuscript.mjs';

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

// Google Search Console 的 HTML 标记验证：设置环境变量 PUBLIC_GOOGLE_SITE_VERIFICATION 即注入（也可改用 DNS 验证，见 README）
const googleVerification = process.env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? '';
const seoHead = [
	{ tag: 'meta', attrs: { property: 'og:image:width', content: '1600' } },
	{ tag: 'meta', attrs: { property: 'og:image:height', content: '2400' } },
	{ tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
	{ tag: 'meta', attrs: { name: 'twitter:image', content: 'https://agent-harness.codeflow.cc/cover.png' } },
	{ tag: 'meta', attrs: { name: 'keywords', content: 'Agent Harness, coding agent, AI agent, agent loop, KV cache, system prompt, context engineering, MCP, Claude Code, opencode, codex' } },
	{
		tag: 'script',
		attrs: { type: 'application/ld+json' },
		content: JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Book',
			name: publication.fullTitle,
			alternateName: publication.title,
			author: { '@type': 'Person', name: publication.author, email: publication.email },
			inLanguage: 'zh-CN',
			bookFormat: 'https://schema.org/EBook',
			datePublished: publication.publicationDate,
			dateModified: publication.revisionDate,
			version: publication.revision,
			image: 'https://agent-harness.codeflow.cc/cover.png',
			url: 'https://agent-harness.codeflow.cc/',
			description: '同一个工程问题，23 个真实 coding agent 分别怎么做、为什么分歧、判断标准是什么、抄哪个。',
		}),
	},
	...(googleVerification ? [{ tag: 'meta', attrs: { name: 'google-site-verification', content: googleVerification } }] : []),
];

// 侧栏结构与电子书书签树一致：序 → 六个部分（部扉页 + 各章）→ 后记
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
	site: 'https://agent-harness.codeflow.cc',
	trailingSlash: 'always',
	integrations: [
		starlight({
			title: publication.title,
			description: publication.fullTitle,
			defaultLocale: 'root',
			locales: {
				root: { label: '简体中文', lang: 'zh-CN' },
			},
			logo: { src: './src/assets/cover.png', alt: publication.fullTitle },
			favicon: '/favicon.svg',
			customCss: ['./src/styles/book.css'],
			components: { Footer: './src/components/Footer.astro' },
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			lastUpdated: false,
			credits: false,
			sidebar: buildSidebar(),
			head: [
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://agent-harness.codeflow.cc/cover.png' } },
				{ tag: 'meta', attrs: { property: 'og:image:alt', content: `${publication.fullTitle}封面` } },
				{ tag: 'meta', attrs: { name: 'author', content: publication.author } },
				...seoHead,
				...gaHead,
			],
		}),
	],
});
