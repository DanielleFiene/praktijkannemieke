import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function listSiteHtmlFiles() {
	const files = [path.join(root, 'index.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const pageHtml = path.join(root, name.name, 'index.html');
		if (fs.existsSync(pageHtml)) files.push(pageHtml);
	}
	return files;
}

function relPrefix(filePath) {
	const rel = path.relative(root, path.dirname(filePath));
	if (!rel || rel === '.') return '';
	const depth = rel.split(path.sep).filter(Boolean).length;
	return depth ? '../'.repeat(depth) : '';
}

const TYPEKIT =
	/<link rel="stylesheet" href="https:\/\/use\.typekit\.net\/gfb8icv\.css">\s*/g;

for (const file of listSiteHtmlFiles()) {
	const prefix = relPrefix(file);
	let html = fs.readFileSync(file, 'utf8');
	let next = html.replace(TYPEKIT, '');

	const fontsHref = `${prefix}assets/css/fonts.css`;
	const fontsTag = `<link rel="stylesheet" href="${fontsHref}" />\n`;
	if (!next.includes('assets/css/fonts.css')) {
		next = next.replace(
			/<link rel="stylesheet" href="[^"]*assets\/css\/a11y\.css" \/>\n/,
			`${fontsTag}<link rel="stylesheet" href="${prefix}assets/css/a11y.css" />\n`
		);
	}

	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Updated', path.relative(root, file));
	}
}

console.log('Lokale fonts gekoppeld, Typekit verwijderd.');
