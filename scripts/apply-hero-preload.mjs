/**
 * Preload hero-achtergrond vroeg in <head> (minder “hakkel” bij CSS-background).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', '.git']);

const PRELOAD_RE =
	/\t<link rel="preload" as="image" href="[^"]+" fetchpriority="high" type="image\/(?:webp|jpeg)" \/>\n?/;

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function pageCssPath(htmlPath) {
	const rel = path.relative(root, path.dirname(htmlPath));
	if (rel === '' || rel === '.') return path.join(root, 'assets/css/pages/home.css');
	return path.join(root, 'assets/css/pages', `${rel.replace(/\\/g, '/')}.css`);
}

function extractHeroAssetPath(css) {
	const patterns = [
		/\.hero\.hero-title\{background-image:url\(([^)]+)\)/,
		/section\.sec\.sec-home-hero-[ab],\s*section\.sec\.sec-home-hero-[ab]\{background-image:url\(([^)]+)\)/i,
		/section\.sec\.sec-hero-cover\{background-image:url\(([^)]+)\)/,
	];
	for (const re of patterns) {
		const m = css.match(re);
		if (m) return toAbsoluteAsset(m[1]);
	}
	return null;
}

function toAbsoluteAsset(raw) {
	let u = raw.replace(/['"]/g, '').trim();
	if (u.startsWith('../../images/')) u = `/assets/images/${u.slice('../../images/'.length)}`;
	else if (u.startsWith('../images/')) u = `/assets/images/${u.slice('../images/'.length)}`;
	else if (u.startsWith('assets/images/')) u = `/${u}`;
	if (/\.jpe?g$/i.test(u)) {
		const webp = u.replace(/\.jpe?g$/i, '.webp');
		const disk = path.join(root, webp.replace(/^\//, '').replace(/\//g, path.sep));
		u = fs.existsSync(disk) ? webp : u;
	}
	return u;
}

function heroFromIndex(html) {
	const m = html.match(/id="site-critical-css">[^<]*url\(([^)]+)\)/);
	return m ? toAbsoluteAsset(m[1]) : null;
}

function insertPreload(html, href) {
	const mime = href.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
	const tag = `\t<link rel="preload" as="image" href="${href}" fetchpriority="high" type="${mime}" />\n`;
	let next = html.replace(PRELOAD_RE, '');
	const anchor = '<meta charset="UTF-8" />';
	if (!next.includes(anchor)) return html;
	if (next.includes(`href="${href}"`)) {
		return next.includes('fetchpriority="high"') ? next : next.replace(anchor, `${anchor}\n${tag}`);
	}
	return next.replace(anchor, `${anchor}\n${tag}`);
}

let changed = 0;
for (const file of listHtmlFiles()) {
	if (file.endsWith('403.html') || file.endsWith('404.html')) continue;
	const html = fs.readFileSync(file, 'utf8');
	const cssFile = pageCssPath(file);
	let hero = null;
	if (fs.existsSync(cssFile)) {
		hero = extractHeroAssetPath(fs.readFileSync(cssFile, 'utf8'));
	}
	if (!hero && file.endsWith('index.html') && !file.includes(path.sep + 'index.html')) {
		hero = heroFromIndex(html);
	}
	if (!hero) {
		const next = html.replace(PRELOAD_RE, '');
		if (next !== html) {
			fs.writeFileSync(file, next);
			changed++;
		}
		continue;
	}
	const next = insertPreload(html, hero);
	if (next !== html) {
		fs.writeFileSync(file, next);
		changed++;
		console.log(path.relative(root, file), '→', hero);
	}
}
console.log(changed ? `Hero preload: ${changed} file(s).` : 'Hero preload unchanged.');