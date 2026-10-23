/**
 * Verwijs naar WebP waar varianten bestaan (na optimize-lighthouse-images).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const REPLACEMENTS = [
	['NEI-biotensor-1.jpg', 'NEI-biotensor-1.webp'],
	['home-annemieke.jpg', 'home-annemieke.webp'],
	['illustratie-1_poster_.png', 'illustratie-1_poster_.webp'],
	['logo_vvnt_lid_van.jpg', 'logo_vvnt_lid_van.webp'],
];

function walk(dir, files = []) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (ent.name === 'node_modules' || ent.name === '.git') continue;
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) walk(p, files);
		else if (/\.(html|css)$/i.test(ent.name)) files.push(p);
	}
	return files;
}

const targets = [
	path.join(root, 'index.html'),
	path.join(root, '403.html'),
	path.join(root, '404.html'),
	...walk(root).filter((f) => f.includes(`${path.sep}assets${path.sep}`) || f.endsWith('.html')),
];

const seen = new Set();
for (const file of targets) {
	if (seen.has(file)) continue;
	seen.add(file);
	let text = fs.readFileSync(file, 'utf8');
	let next = text;
	for (const [from, to] of REPLACEMENTS) {
		next = next.replaceAll(from, to);
	}
	if (next !== text) {
		fs.writeFileSync(file, next);
		console.log('Updated', path.relative(root, file));
	}
}
