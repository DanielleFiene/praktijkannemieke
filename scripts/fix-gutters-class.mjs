/**
 * Corrigeert pb_gutter-vóór-gutters3 bug: class "s3" → "gutters" (HTML + layout.css + a11y).
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

function patchHtml(html) {
	return html
		.replace(/\bcover-bg s3\b/g, 'cover-bg gutters')
		.replace(/\bbuilder-inner s3\b/g, 'builder-inner gutters');
}

function patchCss(css) {
	return css.replace(/\.s3(?=[.{\s,:>#+~[])/g, '.gutters');
}

const cssFiles = [
	path.join(root, 'assets', 'css', 'layout.css'),
	path.join(root, 'assets', 'css', 'a11y.css'),
];

let n = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = patchHtml(before);
	if (after !== before) {
		fs.writeFileSync(file, after);
		n += 1;
		console.log('HTML', path.relative(root, file));
	}
}
for (const file of cssFiles) {
	if (!fs.existsSync(file)) continue;
	const before = fs.readFileSync(file, 'utf8');
	const after = patchCss(before);
	if (after !== before) {
		fs.writeFileSync(file, after);
		console.log('CSS', path.relative(root, file));
	}
}
console.log(n ? 'Gutters class fixed.' : 'No HTML changes; CSS may still have been updated.');
