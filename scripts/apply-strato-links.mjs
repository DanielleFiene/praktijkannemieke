/**
 * Interne links/assets: absoluut vanaf site-root (/tarieven/), geen index.html in href.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGE_SLUGS } from './site-url.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function pageSlugFromFile(file) {
	const rel = path.relative(root, path.dirname(file)).replace(/\\/g, '/');
	if (!rel || rel === '.') return '';
	return rel;
}

function patchHtml(html, slug) {
	let next = html;

	next = next.replaceAll('href="../index.html#', 'href="/#');
	next = next.replaceAll('href="../index.html"', 'href="/"');

	for (const s of PAGE_SLUGS) {
		next = next.replaceAll(`href="../${s}/index.html"`, `href="/${s}/"`);
		next = next.replaceAll(`href="${s}/index.html"`, `href="/${s}/"`);
		next = next.replaceAll(`href="${s}/"`, `href="/${s}/"`);
		next = next.replace(new RegExp(`href="${s}/#([^"]+)"`, 'g'), `href="/${s}/#$1"`);
	}

	next = next.replace(/href="index\.html(#([^"]*))?"/g, (_, __, frag) => {
		if (slug) return frag ? `href="/${slug}/#${frag}"` : `href="/${slug}/"`;
		return frag ? `href="/#${frag}"` : 'href="/"';
	});

	next = next.replace(/href="\.\.#([^"]*)"/g, 'href="/#$1"');
	next = next.replace(/href="\.\.\/#([^"]*)"/g, 'href="/#$1"');
	next = next.replace(/href="\.\.\/([^"]+)"/g, (_, tail) => {
		if (tail.startsWith('assets/')) return `href="/${tail}"`;
		if (tail.endsWith('/index.html')) return `href="/${tail.replace(/\/index\.html$/, '/')}"`;
		if (tail.endsWith('.html') && !tail.includes('/')) return `href="/${tail}"`;
		return `href="/${tail}/"`;
	});

	next = next.replace(/href="\.\.\/assets\//g, 'href="/assets/');
	next = next.replace(/src="\.\.\/assets\//g, 'src="/assets/');
	next = next.replace(/href="assets\//g, 'href="/assets/');
	next = next.replace(/src="assets\//g, 'src="/assets/');
	next = next.replace(/content="\.\.\/assets\//g, 'content="/assets/');
	next = next.replace(/content="\.\/assets\//g, 'content="/assets/');
	next = next.replace(/href="\.\.\/humans\.txt"/g, 'href="/humans.txt"');
	next = next.replace(/href="\.\.\/site\.webmanifest"/g, 'href="/site.webmanifest"');
	next = next.replace(/href="site\.webmanifest"/g, 'href="/site.webmanifest"');
	next = next.replace(/href="\.\.\/([^"]+\.html)"/g, 'href="/$1"');

	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const slug = pageSlugFromFile(file);
	const before = fs.readFileSync(file, 'utf8');
	const after = patchHtml(before, slug);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('Links', path.relative(root, file));
	}
}
console.log(changed ? `Done (${changed} files).` : 'Links unchanged.');
