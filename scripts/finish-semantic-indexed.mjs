/**
 * Vult col-N / row-N in bestaande maps aan en past toe (na eerste semantic pass).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyClassMap, semanticSlug } from './semantic-slug.mjs';
import { slugFromHtmlPath } from './page-slugs.mjs';
import { EXTENDED_SHELL } from './generate-semantic-maps.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'scripts', 'page-class-maps');

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

function listHtmlFiles() {
	const skip = new Set(['ondersteunende-middelen-2', 'node_modules', 'tests']);
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || skip.has(name.name)) continue;
		const p = path.join(root, name.name, 'index.html');
		if (fs.existsSync(p)) files.push(p);
	}
	return files;
}

for (const file of listHtmlFiles()) {
	const slug = slugFromHtmlPath(file, root);
	const mapPath = path.join(mapsDir, `${slug}.json`);
	if (!fs.existsSync(mapPath)) continue;
	const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
	const html = fs.readFileSync(file, 'utf8');
	const used = new Set(Object.values(map));
	const reserve = (t) => {
		let b = t;
		let i = 2;
		while (used.has(b)) b = `${t}-${i++}`;
		used.add(b);
		return b;
	};

	Object.assign(map, EXTENDED_SHELL);
	if (pageSlug === 'home') {
		Object.keys(EXTENDED_SHELL).forEach((k) => delete map[k]);
		Object.assign(map, buildHomeShell());
	}

	for (const m of html.matchAll(/\brow row-([\w-]+)\b/g)) {
		const token = m[1];
		if (/^\d+$/.test(token)) {
			const key = `row-${token}`;
			if (map[key]) continue;
			const idx = m.index;
			map[key] = reserve(`row-${semanticSlug(firstHeading(html, idx) || `band-${token}`, 24)}`);
		}
	}
	for (const m of html.matchAll(/\bcol col-(?:full|half|quarter|three-quarter|col-1-2|col-1-4|col-3-4) col-(\d+)\b/g)) {
		const n = m[1];
		const key = `col-${n}`;
		if (map[key]) continue;
		map[key] = reserve(`col-${semanticSlug(firstHeading(html, m.index) || `c${n}`, 22)}`);
	}

	fs.writeFileSync(mapPath, `${JSON.stringify(map, null, 2)}\n`);
	let next = applyClassMap(html, map);
	if (next !== html) fs.writeFileSync(file, next);
	const cssName = slug === 'home' ? 'home.css' : `${slug}.css`;
	const cssPath = path.join(root, 'assets', 'css', 'pages', cssName);
	if (fs.existsSync(cssPath)) {
		const css = fs.readFileSync(cssPath, 'utf8');
		const cssNext = applyClassMap(css, map);
		if (cssNext !== css) fs.writeFileSync(cssPath, cssNext);
	}
	console.log('Cols/rows', slug);
}

// a11y second pass voor body.home en indexed restjes
const a11yPath = path.join(root, 'assets', 'css', 'a11y.css');
const homeMap = JSON.parse(fs.readFileSync(path.join(mapsDir, 'home.json'), 'utf8'));
const slugs = fs.readdirSync(mapsDir).filter((f) => f.endsWith('.json'));
const a11yNext = fs
	.readFileSync(a11yPath, 'utf8')
	.split('\n')
	.map((line) => {
		let merged = {};
		if (/body\.home\b|body\.home |\.home main/.test(line)) Object.assign(merged, homeMap);
		for (const f of slugs) {
			const slug = f.replace(/\.json$/, '');
			if (line.includes(`page--${slug}`)) {
				Object.assign(merged, JSON.parse(fs.readFileSync(path.join(mapsDir, f), 'utf8')));
			}
		}
		if (/#Nei\b|#Wie\b/.test(line)) Object.assign(merged, homeMap);
		if (!Object.keys(merged).length) return line;
		return applyClassMap(line, merged);
	})
	.join('\n');
fs.writeFileSync(a11yPath, a11yNext);
console.log('a11y patched');
