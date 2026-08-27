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

// 侧栏结构与电子书书签树一致：序 → 六个部分（部扉页 + 各章）→ 后记
function buildSidebar() {
	const groups = [];
	let current = null;
	for (const section of sections) {
		const item = { label: section.label, slug: `book/${section.id}` };
		if (section.type === 'part') {
			current = { label: section.label, items: [item] };
			groups.push(current);
		} else if (section.type === 'chapter' && current) {
			current.items.push(item);
		} else {
			current = null;
			groups.push(item);
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
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			lastUpdated: false,
			credits: false,
			sidebar: buildSidebar(),
			head: [
				{ tag: 'meta', attrs: { property: 'og:image', content: 'https://agent-harness.codeflow.cc/cover.png' } },
				{ tag: 'meta', attrs: { property: 'og:image:alt', content: `${publication.fullTitle}封面` } },
				{ tag: 'meta', attrs: { name: 'author', content: publication.author } },
				...gaHead,
			],
		}),
	],
});
