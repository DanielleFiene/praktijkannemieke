/**
 * Hero JPG → WebP in CSS alleen als .webp bestaat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const HERO_JPG = [
	'AccessBars-bewerkt.jpg',
	'contact-Annemieke.jpg',
	'over-Annemieke-bewerkt.jpg',
	'annemieke-shabhala-u120922-fr.jpg',
	'ondersteunendemiddelen-u121594-fr.jpg',
	'Magnesiumpakking_PraktijkAnnemieke.jpg',
	'Vlindermassage_PraktijkAnnemieke.jpg',
];

function webpExists(jpgName) {
	const rel = jpgName.replace(/\.jpe?g$/i, '.webp');
	for (const sub of ['2021/07', '2021/06', '2025/10']) {
		const p = path.join(root, 'assets/images', sub, rel);
		if (fs.existsSync(p)) return true;
	}
	for (const ent of fs.readdirSync(path.join(root, 'assets/images'), { withFileTypes: true, recursive: true })) {
		if (ent.isFile() && ent.name === rel) return true;
	}
	return fs.existsSync(path.join(root, 'assets/images', rel));
}

function walkCss(dir, out = []) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (ent.name === '_sources' || ent.name === 'node_modules') continue;
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) walkCss(p, out);
		else if (ent.name.endsWith('.css')) out.push(p);
	}
	return out;
}

let changed = 0;
for (const file of walkCss(path.join(root, 'assets/css'))) {
	let text = fs.readFileSync(file, 'utf8');
	let next = text;
	for (const jpg of HERO_JPG) {
		const webp = jpg.replace(/\.jpe?g$/i, '.webp');
		if (webpExists(jpg)) next = next.replaceAll(jpg, webp);
		else next = next.replaceAll(webp, jpg);
	}
	if (next !== text) {
		fs.writeFileSync(file, next);
		changed++;
		console.log(path.relative(root, file));
	}
}
console.log(changed ? 'Hero WebP in CSS klaar.' : 'CSS ongewijzigd.');