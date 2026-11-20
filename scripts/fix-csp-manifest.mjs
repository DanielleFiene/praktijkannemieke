/**
 * CSP meta zonder frame-ancestors; manifest zonder foutieve trailing slash.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

function listHtml() {
	const out = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
		if (!ent.isDirectory() || SKIP.has(ent.name)) continue;
		const p = path.join(root, ent.name, 'index.html');
		if (fs.existsSync(p)) out.push(p);
	}
	return out;
}

let n = 0;
for (const file of listHtml()) {
	let html = fs.readFileSync(file, 'utf8');
	const before = html;
	html = html.replace(/frame-ancestors 'none';\s*/g, '');
	html = html.replace(/href="\/site\.webmanifest\/"/g, 'href="/site.webmanifest"');
	if (html !== before) {
		fs.writeFileSync(file, html);
		n++;
		console.log(path.relative(root, file));
	}
}
console.log(n ? `Fixed ${n} HTML file(s).` : 'CSP/manifest already OK.');