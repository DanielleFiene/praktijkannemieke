/**
 * Bouwt per pagina een class-map (leesbare namen i.p.v. sec-0, text-1, …).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { semanticSlug } from './semantic-slug.mjs';
import { slugFromHtmlPath } from './page-slugs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'scripts', 'page-class-maps');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git', 'ondersteunende-middelen-2']);

export const GLOBAL_LAYOUT = {
	'col-1-2': 'col-half',
	'col-1-4': 'col-quarter',
	'col-3-4': 'col-three-quarter',
};

export const GLOBAL_MODULES = {
	'btn-0': 'btn-contact',
	'rule-0': 'rule-spacer',
	'rule-1': 'rule-spacer',
	social_0: 'social-footer',
};

export const FOOTER_TEXT = {
	'text-8': 'text-footer-about',
	'text-9': 'text-footer-docs',
	'text-10': 'text-footer-disclaimer',
	'text-11': 'text-footer-services',
	'text-12': 'text-footer-werkwijze',
	'text-13': 'text-footer-contact',
	'text-14': 'text-footer-badges',
};

/** Zelfde builder-skeleton op behandeling-/infopagina’s. */
export const SERVICE_SHELL = {
	'sec-0': 'sec-hero-intro',
	'sec-1': 'sec-hero-cover',
	'sec-2': 'sec-main',
	'sec-4': 'sec-outro',
	'sec-6': 'sec-site-footer',
	'hero-0': 'hero-title',
	'hero-1': 'hero-cover',
	'row-0': 'row-lead',
	'row-1': 'row-main',
	'row-2': 'row-footer',
};

export const EXTENDED_SHELL = {
	...SERVICE_SHELL,
	'sec-3': 'sec-ervaringen',
	'sec-5': 'sec-extra',
	'sec-7': 'sec-site-footer-alt',
	'row-3': 'row-extra',
	'row-4': 'row-footer-band',
};

const SERVICE_SLUGS = new Set([
	'access-bars',
	'shambhala-reiki',
	'vlindermassage',
	'magnesiumpakking',
	'neem-contact-op',
]);

const EXTENDED_SLUGS = new Set(['tarieven', 'over-annemieke', 'ondersteunende-middelen']);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function firstHeading(html, fromIndex) {
	const slice = html.slice(fromIndex, fromIndex + 5000);
	const inner = slice.match(/<div class="text-inner">([\s\S]*?)<\/div>/i);
	const block = inner ? inner[1] : slice;
	const h = block.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
	if (h) return h[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	const p = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
	if (p) return p[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
	return '';
}

function buildMapForHtml(html, pageSlug) {
	const map = { ...GLOBAL_LAYOUT, ...GLOBAL_MODULES };
	if (pageSlug === 'home') Object.assign(map, buildHomeShell());
	else if (SERVICE_SLUGS.has(pageSlug)) Object.assign(map, SERVICE_SHELL);
	else if (EXTENDED_SLUGS.has(pageSlug)) Object.assign(map, EXTENDED_SHELL);
	else if (pageSlug === 'privacyverklaring') {
		Object.assign(map, {
			'sec-0': 'sec-hero-intro',
			'sec-1': 'sec-privacy-body',
			'sec-3': 'sec-site-footer',
			'hero-0': 'hero-title',
			'row-0': 'row-lead',
			'row-1': 'row-footer',
		});
	}

	const used = new Set(Object.values(map));
	const reserve = (token) => {
		let base = token;
		let n = 2;
		while (used.has(base)) base = `${token}-${n++}`;
		used.add(base);
		return base;
	};

	const textRe = /<div class="mod text text-(\d+)\b[^"]*"[^>]*>/gi;
	let sm;
	while ((sm = textRe.exec(html)) !== null) {
		const n = sm[1];
		const key = `text-${n}`;
		if (map[key]) continue;
		if (FOOTER_TEXT[key] && Number(n) >= 8) {
			map[key] = FOOTER_TEXT[key];
			used.add(map[key]);
			continue;
		}
		const heading = firstHeading(html, sm.index);
		map[key] = reserve(`text-${semanticSlug(heading || `${pageSlug}-${n}`, 30)}`);
	}

	for (const n of [...new Set([...html.matchAll(/\brow row-(\d+)\b/g)].map((m) => m[1]))]) {
		const key = `row-${n}`;
		if (map[key]) continue;
		const idx = html.indexOf(`row row-${n}`);
		const heading = firstHeading(html, idx);
		map[key] = reserve(`row-${semanticSlug(heading || `band-${n}`, 24)}`);
	}

	const colRe = /\bcol col-(?:full|col-full|half|quarter|three-quarter|col-1-2|col-1-4|col-3-4) col-(\d+)\b/g;
	let cm;
	while ((cm = colRe.exec(html)) !== null) {
		const n = cm[1];
		const key = `col-${n}`;
		if (map[key]) continue;
		const heading = firstHeading(html, cm.index);
		map[key] = reserve(`col-${semanticSlug(heading || `c${n}`, 22)}`);
	}

	if (pageSlug === 'home') {
		/* shell already merged */
	}

	return map;
}

function buildHomeShell() {
	const map = {
		'sec-0': 'sec-home-hero-a',
		'sec-1': 'sec-home-hero-b',
		'sec-2': 'sec-nei',
		'sec-3': 'sec-home-quote',
		'sec-4': 'sec-wie',
		'sec-6': 'sec-site-footer',
		'sec-8': 'sec-disclaimer-repeat',
		'hero-0': 'hero-quote-a',
		'hero-1': 'hero-quote-b',
		'hero-2': 'hero-tools-quote',
		'row-0': 'row-nei-title',
		'row-1': 'row-nei-columns',
		'row-2': 'row-wie-heading',
		'row-3': 'row-wie-columns',
		'row-4': 'row-footer-columns',
		'row-5': 'row-disclaimer',
	};
	return map;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'generate-semantic-maps.mjs') {
	fs.mkdirSync(mapsDir, { recursive: true });
	for (const file of listHtmlFiles()) {
		const slug = slugFromHtmlPath(file, root);
		const html = fs.readFileSync(file, 'utf8');
		const map = buildMapForHtml(html, slug);
		fs.writeFileSync(path.join(mapsDir, `${slug}.json`), `${JSON.stringify(map, null, 2)}\n`);
		console.log('Map', slug, Object.keys(map).length);
	}
}
