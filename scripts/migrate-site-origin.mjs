/**
 * Vervang https://www.praktijkannemieke.nl door apex (canonical/JSON-LD/sitemap/llms).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FROM = 'https://www.praktijkannemieke.nl';
const TO = 'https://praktijkannemieke.nl';

const FILES = [
	'.well-known/security.txt',
	'robots.txt',
	'sitemap.xml',
	'llms.txt',
	'scripts/apply-seo-static.mjs',
	'scripts/fix-json-ld-urls.mjs',
	'scripts/scrub-bronexport-remnants.mjs',
];

function walkHtml(dir, out = []) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (ent.name === 'node_modules' || ent.name === 'tests' || ent.name === '.history') continue;
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) walkHtml(p, out);
		else if (ent.name.endsWith('.html')) out.push(p);
	}
	return out;
}

let changed = 0;
for (const rel of FILES) {
	const file = path.join(root, rel);
	if (!fs.existsSync(file)) continue;
	const before = fs.readFileSync(file, 'utf8');
	const after = before.replaceAll(FROM, TO);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log(rel);
	}
}
for (const file of walkHtml(root)) {
	const before = fs.readFileSync(file, 'utf8');
	if (!before.includes(FROM)) continue;
	fs.writeFileSync(file, before.replaceAll(FROM, TO));
	changed += 1;
	console.log(path.relative(root, file));
}
console.log(changed ? `Origin migrated (${changed} files). Run npm run seo:static.` : 'Origin already apex.');
