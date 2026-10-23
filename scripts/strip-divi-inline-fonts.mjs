/**
 * Verwijder zware Divi Open Sans inline-blok; gebruik assets/css/fonts.css.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const INLINE_OPEN_SANS = /<style id="et-divi-open-sans-inline-css">[\s\S]*?<\/style>\s*/i;

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const p = path.join(root, name.name, 'index.html');
		if (fs.existsSync(p)) files.push(p);
	}
	return files;
}

function relPrefix(filePath) {
	const rel = path.relative(root, path.dirname(filePath));
	if (!rel || rel === '.') return '';
	const depth = rel.split(path.sep).filter(Boolean).length;
	return '../'.repeat(depth);
}

for (const file of listHtmlFiles()) {
	const prefix = relPrefix(file);
	let html = fs.readFileSync(file, 'utf8');
	let next = html.replace(INLINE_OPEN_SANS, '');

	const fontsHref = `${prefix}assets/css/fonts.css`;
	const fontsTag = `<link rel="stylesheet" href="${fontsHref}" />\n`;
	if (!next.includes('assets/css/fonts.css')) {
		next = next.replace(
			/<link rel="stylesheet" href="[^"]*assets\/css\/a11y\.css" \/>\n/,
			`${fontsTag}<link rel="stylesheet" href="${prefix}assets/css/a11y.css" />\n`
		);
		if (!next.includes('assets/css/fonts.css')) {
			next = next.replace(
				/<link rel='stylesheet' id='divi-style-parent-css'/,
				`${fontsTag}<link rel='stylesheet' id='divi-style-parent-css'`
			);
		}
	}

	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Updated', path.relative(root, file));
	}
}
