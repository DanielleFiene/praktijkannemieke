/**
 * Verwijdert Adobe Typekit (proxima-nova). Pas uit na lokale @font-face in assets/css/fonts.css
 * en groene visuele tests — zonder Typekit valt body terug op sans-serif.
 */
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

const TYPEKIT =
	/<link rel="stylesheet" href="https:\/\/use\.typekit\.net\/gfb8icv\.css">\s*/g;

for (const file of listSiteHtmlFiles()) {
	let html = fs.readFileSync(file, 'utf8');
	const next = html.replace(TYPEKIT, '');
	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Typekit removed:', path.relative(root, file));
	}
}
