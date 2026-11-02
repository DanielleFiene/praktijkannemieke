/**
 * Eén h1 per pagina; hero/sectie-koppen worden h2 met dezelfde classes (opmaak via a11y.css).
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

function demoteHeroHeadings(html) {
	let next = html;
	next = next.replace(
		/<h1 class="et_pb_module_header([^"]*)">([\s\S]*?)<\/h1>/g,
		'<h2 class="et_pb_module_header$1">$2</h2>'
	);
	next = next.replace(
		/(<div class="et_pb_header_content_wrapper">)\s*<h1([^>]*)>([\s\S]*?)<\/h1>/g,
		'$1<h2$2>$3</h2>'
	);
	return next;
}

function keepFirstH1InMain(html) {
	const m = /(<main id="hoofdinhoud">)([\s\S]*?)(<\/main>)/i.exec(html);
	if (!m) return html;
	let main = m[2];
	let seen = false;
	main = main.replace(/<h1(\s[^>]*)?>([\s\S]*?)<\/h1>/gi, (full, attrs, inner) => {
		if (!seen) {
			seen = true;
			return full;
		}
		return `<h2${attrs || ''}>${inner}</h2>`;
	});
	return html.slice(0, m.index) + m[1] + main + m[3] + html.slice(m.index + m[0].length);
}

function fixFile(html, rel) {
	const norm = rel.replace(/\\/g, '/');
	if (norm === '403.html' || norm === '404.html') {
		return html;
	}
	if (norm.includes('privacyverklaring/')) {
		return keepFirstH1InMain(html);
	}
	let next = demoteHeroHeadings(html);
	next = keepFirstH1InMain(next);
	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const rel = path.relative(root, file);
	const before = fs.readFileSync(file, 'utf8');
	const after = fixFile(before, rel);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('Headings', rel);
	}
}
console.log(changed ? `Done (${changed} files).` : 'Headings unchanged.');
