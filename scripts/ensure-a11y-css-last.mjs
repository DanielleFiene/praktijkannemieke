/**
 * Laadt a11y.css ná Divi deferred CSS (sync), zodat overrides niet worden overschreven.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '404.html'), path.join(root, '403.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

const A11Y_RE = /<link rel="stylesheet" href="([^"]*a11y\.css)"\s*\/?>\s*/i;
const DEFERRED_PRELOAD_RE =
	/<link rel="preload" as="style" id="(et-core-unified-deferred[^"]+)" href="([^"]+)" onload="this\.onload=null;this\.rel='stylesheet';"\s*\/?>/i;

let updated = 0;
for (const file of listHtmlFiles()) {
	let html = fs.readFileSync(file, 'utf8');
	const a11yMatch = html.match(A11Y_RE);
	const deferredMatch = html.match(DEFERRED_PRELOAD_RE);
	if (!a11yMatch || !deferredMatch) continue;

	const a11yHref = a11yMatch[1];
	html = html.replace(A11Y_RE, '');
	if (html.includes(`href="${a11yHref}"`)) continue;

	const replacement = `<link rel="stylesheet" id="${deferredMatch[1]}" href="${deferredMatch[2]}" />\n<link rel="stylesheet" href="${a11yHref}" />`;
	html = html.replace(DEFERRED_PRELOAD_RE, replacement);
	fs.writeFileSync(file, html);
	updated += 1;
	console.log('CSS-volgorde:', path.relative(root, file));
}

console.log(updated ? `Klaar (${updated} bestanden).` : 'Geen wijziging nodig.');
