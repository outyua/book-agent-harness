// Starlight 路由中间件：在每个页面渲染前改写 <head>，补齐按页不同的 SEO 标签。
//
// 做的事：
//   1. 首页 <title> 不再重复品牌（Starlight 默认拼成「页面标题 | 站名」，首页两段都是书名）。
//   2. 首页 og:type=website，其余 article；每页补 twitter:title / twitter:description。
//   3. 正文页加 <link rel="alternate" type="text/markdown">，指向同名 .md。
//   4. 结构化数据：首页 WebSite + Book；正文页 Chapter/TechArticle（isPartOf 指向本书）+ BreadcrumbList。
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { publication, sections } from '../../scripts/lib/manuscript.mjs';

const SITE = 'https://agent-harness.codeflow.cc';
const BOOK_ID = `${SITE}/#book`;
const AUTHOR_ID = `${SITE}/#author`;

const author = {
	'@type': 'Person',
	'@id': AUTHOR_ID,
	name: publication.author,
	email: publication.email,
	url: `${SITE}/`,
};

const bookRef = { '@type': 'Book', '@id': BOOK_ID, name: publication.fullTitle, url: `${SITE}/` };

type Section = (typeof sections)[number];
type HeadEntry = { tag: string; attrs?: Record<string, string | boolean | undefined>; content?: string };

/** 每个页面所属的部分（章 → 部扉页；序、部扉页、后记 → 无） */
const parentPart = new Map<string, Section>();
{
	let current: Section | null = null;
	for (const section of sections) {
		if (section.type === 'part') current = section;
		else if (section.type === 'chapter' && current) parentPart.set(section.id, current);
		else current = null;
	}
}

function jsonLd(data: unknown) {
	return { tag: 'script' as const, attrs: { type: 'application/ld+json' }, content: JSON.stringify(data) };
}

function homeGraph() {
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE}/#website`,
				url: `${SITE}/`,
				name: publication.title,
				alternateName: publication.fullTitle,
				inLanguage: 'zh-CN',
				publisher: { '@id': AUTHOR_ID },
			},
			{
				'@type': 'Book',
				'@id': BOOK_ID,
				name: publication.fullTitle,
				alternateName: publication.title,
				author,
				inLanguage: 'zh-CN',
				bookFormat: 'https://schema.org/EBook',
				datePublished: publication.publicationDate,
				dateModified: publication.revisionDate,
				version: publication.revision,
				image: `${SITE}/cover.png`,
				url: `${SITE}/`,
				description:
					'同一个工程问题，23 个真实 coding agent 分别怎么做、为什么分歧、判断标准是什么、抄哪个。17 章覆盖 agent loop、工具、KV cache、system prompt、压缩、记忆、检索、权限、多 agent、MCP/A2A/AG-UI、session runtime、云端多租户、交付流水线与评测。',
				hasPart: sections
					.filter((s) => s.type === 'chapter')
					.map((s) => ({ '@type': 'Chapter', name: s.label, url: `${SITE}/book/${s.id}` })),
			},
		],
	};
}

function pageGraph(section: Section | undefined, pageUrl: string, title: string, description: string, markdownUrl: string) {
	const crumbs: { name: string; item: string }[] = [{ name: publication.title, item: `${SITE}/` }];
	const part = section ? parentPart.get(section.id) : undefined;
	if (part) crumbs.push({ name: part.label, item: `${SITE}/book/${part.id}` });
	crumbs.push({ name: section?.label ?? title, item: pageUrl });

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': ['Chapter', 'TechArticle'],
				'@id': `${pageUrl}#chapter`,
				headline: title,
				name: section?.label ?? title,
				description,
				inLanguage: 'zh-CN',
				url: pageUrl,
				mainEntityOfPage: pageUrl,
				isPartOf: bookRef,
				author,
				publisher: { '@id': AUTHOR_ID },
				datePublished: publication.publicationDate,
				dateModified: publication.revisionDate,
				image: `${SITE}/og.jpg`,
				encoding: { '@type': 'MediaObject', contentUrl: markdownUrl, encodingFormat: 'text/markdown' },
			},
			{
				'@type': 'BreadcrumbList',
				'@id': `${pageUrl}#breadcrumb`,
				itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
			},
		],
	};
}

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const { entry, head } = route;
	const data = entry.data;
	const pageUrl = new URL(context.url.pathname, context.site ?? SITE).href;
	const isHome = data.template === 'splash';
	const description = data.description ?? '';

	// 首页标题：只出现一次书名
	if (isHome) {
		const titleTag = head.find((t: HeadEntry) => t.tag === 'title');
		if (titleTag) titleTag.content = data.title;
		const ogType = head.find((t: HeadEntry) => t.tag === 'meta' && t.attrs?.property === 'og:type');
		if (ogType?.attrs) ogType.attrs.content = 'website';
	}

	head.push(
		{ tag: 'meta', attrs: { name: 'twitter:title', content: data.title } },
		{ tag: 'meta', attrs: { name: 'twitter:description', content: description } },
	);

	if (isHome) {
		head.push(jsonLd(homeGraph()));
		return;
	}

	const id = context.url.pathname.match(/^\/book\/([^/]+)\/?$/)?.[1];
	const section = sections.find((s) => s.id === id);
	const markdownUrl = `${pageUrl.replace(/\/$/, '')}.md`;
	head.push(
		{ tag: 'link', attrs: { rel: 'alternate', type: 'text/markdown', href: markdownUrl, title: 'Markdown 版' } },
		jsonLd(pageGraph(section, pageUrl, data.title, description, markdownUrl)),
	);
});
