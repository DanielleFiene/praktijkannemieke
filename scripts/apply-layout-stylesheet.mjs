/**
 * Vervang bronexport-base link door assets/css/layout.css
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

function relPrefix(filePath) {
	const rel = path.relative(root, path.dirname(filePath));
	if (!rel || rel === '.') return '';
	return `${'../'.repeat(rel.split(path.sep).filter(Boolean).length)}`;
}

function patchHtml(html, prefix) {
	const href = `${prefix}assets/css/layout.css`;
	return html.replace(
		/<link rel='stylesheet' id='bronexport-base-css' href='[^']*style-static\.min\.css' media='all' \/>/g,
		`<link rel="stylesheet" id="site-layout-css" href="${href}" />`
	);
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const prefix = relPrefix(file);
	const before = fs.readFileSync(file, 'utf8');
	const after = patchHtml(before, prefix);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('HTML', path.relative(root, file));
	}
}

console.log(changed ? `Updated ${changed} HTML files.` : 'Layout stylesheet links unchanged.');
