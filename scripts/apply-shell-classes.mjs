/**
 * AGENTS.md stap 5.4: semantische shell-classes naast bronexport-markup (et_pb_* blijft voor layout.css).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function addClassOnTag(html, tagPattern, className) {
	const re = new RegExp(`(<${tagPattern})([^>]*)(>)`, 'i');
	return html.replace(re, (full, open, attrs, close) => {
		if (new RegExp(`\\b${className}\\b`).test(attrs)) return full;
		if (/class="/i.test(attrs)) {
			return `${open}${attrs.replace(/class="/, `class="${className} `)}${close}`;
		}
		return `${open}${attrs} class="${className}"${close}`;
	});
}

function patch(html) {
	let next = html;
	next = addClassOnTag(next, 'div id="site"', 'site-root');
	next = addClassOnTag(next, 'div class="container clearfix header-inner"', 'clearfix');
	next = addClassOnTag(next, 'div class="container header-inner"', 'clearfix');
	next = addClassOnTag(next, 'header id="main-header"', 'site-header');
	next = addClassOnTag(next, 'footer id="main-footer"', 'site-footer');
	next = addClassOnTag(next, 'main id="hoofdinhoud"', 'site-main');
	next = addClassOnTag(next, 'nav id="nav"', 'site-nav');
	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('Shell', path.relative(root, file));
	}
}
console.log(changed ? `Done (${changed} files).` : 'Shell classes unchanged.');
