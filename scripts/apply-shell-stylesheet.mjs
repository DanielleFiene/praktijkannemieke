/**
 * Voeg assets/css/shell.css toe (header/nav/footer overrides na layout.css).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const shellPath = path.join(root, 'assets', 'css', 'shell.css');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

const SHELL_CSS = `/*
 * shell.css – site-header, navigatie, footer (stap 5.4)
 * Bronexport-layout (layout.css) blijft; dit zijn site-specifieke overrides.
 */

.site-header,
#main-header.site-header {
	position: relative;
}

.site-nav,
#top-menu-nav.site-nav {
	flex: 1 1 auto;
}

.site-footer,
#main-footer.site-footer {
	margin-top: auto;
}

.site-main,
main.site-main {
	display: block;
}

.site-root,
#page-container.site-root {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
}

.site-root #et-main-area,
#page-container #et-main-area {
	flex: 1 1 auto;
}
`;

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

fs.writeFileSync(shellPath, SHELL_CSS);

const linkTag = '<link rel="stylesheet" id="site-shell-css" href="/assets/css/shell.css" />';
const linkSub = (prefix) =>
	`<link rel="stylesheet" id="site-shell-css" href="${prefix}assets/css/shell.css" />`;

function relPrefix(file) {
	const rel = path.relative(root, path.dirname(file));
	if (!rel || rel === '.') return '';
	return `${'../'.repeat(rel.split(path.sep).filter(Boolean).length)}`;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const prefix = relPrefix(file);
	const tag = prefix ? linkSub(prefix) : linkTag;
	let html = fs.readFileSync(file, 'utf8');
	if (html.includes('site-shell-css')) continue;
	const next = html.replace(/<link rel="stylesheet" id="site-layout-css"[^>]*\/>/, (m) => `${m}\n${tag}`);
	if (next !== html) {
		fs.writeFileSync(file, next);
		changed += 1;
	}
}
console.log('shell.css written;', changed, 'HTML files linked.');
