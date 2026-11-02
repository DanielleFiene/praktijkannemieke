/**
 * Past page-class-maps toe op HTML, page CSS, scoped a11y, layout (alleen grid-tokens).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyClassMap } from './semantic-slug.mjs';
import { slugFromHtmlPath } from './page-slugs.mjs';
import { GLOBAL_LAYOUT, GLOBAL_MODULES } from './generate-semantic-maps.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'scripts', 'page-class-maps');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git', 'ondersteunende-middelen-2']);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function loadMap(slug) {
	const p = path.join(mapsDir, `${slug}.json`);
	if (!fs.existsSync(p)) return null;
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function patch(content, map) {
	return applyClassMap(content, map);
}

function patchFile(file, map) {
	if (!map || !Object.keys(map).length) return false;
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before, map);
	if (after !== before) {
		fs.writeFileSync(file, after);
		return true;
	}
	return false;
}

/** a11y: per regel relevante page-maps samenvoegen. */
function patchA11yScoped(file) {
	const slugs = fs
		.readdirSync(mapsDir)
		.filter((f) => f.endsWith('.json'))
		.map((f) => f.replace(/\.json$/, ''));
	const maps = Object.fromEntries(slugs.map((s) => [s, loadMap(s)]));

	const lines = fs.readFileSync(file, 'utf8').split('\n');
	const out = lines.map((line) => {
		let merged = { ...GLOBAL_LAYOUT, ...GLOBAL_MODULES };
		for (const slug of slugs) {
			if (line.includes(`page--${slug}`)) Object.assign(merged, maps[slug]);
		}
		if (/body\.home\b|body\.home /.test(line)) Object.assign(merged, maps.home || {});
		if (/#Nei\b|#Wie\b/.test(line)) Object.assign(merged, maps.home || {});
		if (/\.Ervaringen|#Ervaringen/.test(line)) {
			for (const s of ['tarieven', 'over-annemieke', 'home']) {
				if (line.includes(`page--${s}`) || (s === 'home' && line.includes('#Ervaringen'))) {
					Object.assign(merged, maps[s] || {});
				}
			}
			if (!line.includes('page--')) Object.assign(merged, maps.tarieven || {});
		}
		if (/\.sec\.sec-0:has\(\.hero-0\)/.test(line) || /\.hero-0\b/.test(line)) {
			Object.assign(merged, maps.home || {});
		}
		if (/#site \.text-10\b/.test(line)) {
			for (const m of Object.values(maps)) Object.assign(merged, m);
		}
		return patch(line, merged);
	});
	const joined = out.join('\n');
	const before = fs.readFileSync(file, 'utf8');
	if (joined !== before) {
		fs.writeFileSync(file, joined);
		return true;
	}
	return false;
}

// HTML + page CSS
for (const file of listHtmlFiles()) {
	const slug = slugFromHtmlPath(file, root);
	const map = loadMap(slug);
	if (!map) continue;
	if (patchFile(file, map)) console.log('HTML', slug);
	const cssName =
		slug === 'home' ? 'home.css' : slug === 'privacyverklaring' ? 'privacy.css' : `${slug}.css`;
	const pageCss = path.join(root, 'assets', 'css', 'pages', cssName);
	if (fs.existsSync(pageCss) && patchFile(pageCss, map)) console.log('page CSS', cssName);
}

const a11y = path.join(root, 'assets', 'css', 'a11y.css');
if (patchA11yScoped(a11y)) console.log('a11y.css (scoped)');

for (const f of [
	path.join(root, 'assets', 'css', 'layout.css'),
	path.join(root, 'assets', 'css', 'site.css'),
	path.join(root, 'assets', 'css', 'critical-shared.css'),
	path.join(root, 'assets', 'js', 'site.js'),
]) {
	if (fs.existsSync(f) && patchFile(f, GLOBAL_LAYOUT)) console.log('layout tokens', path.basename(f));
}

// Critical inline style in index.html
const homeMap = loadMap('home');
const idx = path.join(root, 'index.html');
if (homeMap && fs.existsSync(idx)) patchFile(idx, homeMap);

console.log('Done.');
