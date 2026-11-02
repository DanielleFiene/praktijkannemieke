/**
 * Slug-gebaseerde pagina-markup; geen CMS page-id's meer in HTML.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HERO_LAYOUT_SLUGS, slugFromHtmlPath } from './page-slugs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

const MENU_ID_TO_CLASS = {
	'menu-item-422': 'menu-item--home',
	'menu-item-204': 'menu-item--nei',
	'menu-item-509': 'menu-item--behandelingen',
	'menu-item-26': 'menu-item--shambhala-reiki',
	'menu-item-304': 'menu-item--access-bars',
	'menu-item-511': 'menu-item--vlindermassage',
	'menu-item-510': 'menu-item--magnesiumpakking',
	'menu-item-24': 'menu-item--ondersteunende-middelen',
	'menu-item-500': 'menu-item--tarieven',
	'menu-item-25': 'menu-item--over-annemieke',
	'menu-item-23': 'menu-item--contact',
	'menu-item-620': 'menu-item--whatsapp',
};

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function patchBodyClasses(html, slug) {
	const extras = [`page--${slug}`];
	if (HERO_LAYOUT_SLUGS.has(slug)) extras.push('page-layout-hero');
	return html.replace(/<body class="([^"]*)"/, (full, classes) => {
		let next = classes
			.replace(/\bpage--[\w-]+\b/g, '')
			.replace(/\bpage-layout-hero\b/g, '')
			.replace(/\s+/g, ' ')
			.trim();
		for (const c of extras) {
			if (!next.includes(c)) next = `${next} ${c}`;
		}
		return `<body class="${next.trim()}"`;
	});
}

function patchArticle(html, slug) {
	return html.replace(
		/<article(?: id="page-\d+")? class="page page--(?:\d+|[\w-]+)">/g,
		`<article class="page page--${slug}">`
	);
}

function patchMenuItems(html) {
	let next = html;
	for (const [id, semantic] of Object.entries(MENU_ID_TO_CLASS)) {
		const re = new RegExp(`<li id="${id}" class="([^"]*)"`, 'g');
		next = next.replace(re, (_m, cls) => {
			let cleaned = cls
				.replace(/\bmenu-item-\d+\b/g, '')
				.replace(/\bpage_item\b/g, '')
				.replace(/\bpage-item-\d+\b/g, '')
				.replace(/\bcurrent_page_item\b/g, '')
				.replace(/\s+/g, ' ')
				.trim();
			const isCurrent = cleaned.includes('current-menu-item');
			if (isCurrent) {
				cleaned = cleaned.replace(/\bcurrent-menu-item\b/g, '').trim();
			}
			cleaned = `menu-item ${semantic}${isCurrent ? ' current-menu-item menu-item--current' : ''} ${cleaned}`
				.replace(/\s+/g, ' ')
				.trim();
			return `<li class="${cleaned}"`;
		});
	}
	return next;
}

function patchContentWrapper(html) {
	return html
		.replace(
			/<div class="entry-content">\s*<div class="et-l et-l--post">\s*<div class="et_builder_inner_content et_pb_gutters3">/g,
			'<div class="page-content entry-content">\n\t\t\t<div class="page-content__inner et_builder_inner_content et_pb_gutters3">'
		)
		.replace(/<style id="page-critical-css">/g, '<style id="site-critical-css">');
}

function patch(html, file) {
	const slug = slugFromHtmlPath(file, root);
	let next = html;
	next = patchArticle(next, slug);
	next = patchBodyClasses(next, slug);
	next = patchMenuItems(next);
	next = patchContentWrapper(next);
	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before, file);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('Normalize', path.relative(root, file));
	}
}
console.log(changed ? `Done (${changed} files).` : 'Markup unchanged.');
