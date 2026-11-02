/**
 * Vervang Divi/builder-classprefix et_pb_* door pb_* (HTML + CSS + JS), visueel ongewijzigd.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const REPLACEMENTS = [
	['et_pb_', 'pb_'],
	['et_pb', 'pb'],
	['et_builder_inner_content', 'builder-inner'],
	['et_menu_container', 'menu-container'],
	['et_section_regular', 'section-reg'],
	['et-l--post', 'builder-post'],
	['et-l ', 'builder '],
	['et-l"', 'builder"'],
	['et-l>', 'builder>'],
];

function walk(dir, acc = []) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		if (ent.name === 'node_modules' || ent.name === 'test-results' || ent.name === 'playwright-report' || ent.name === '.history')
			continue;
		const full = path.join(dir, ent.name);
		if (ent.isDirectory()) walk(full, acc);
		else acc.push(full);
	}
	return acc;
}

function shouldProcess(file) {
	const rel = path.relative(root, file).replace(/\\/g, '/');
	if (rel.startsWith('tests/visual.spec.js-snapshots/')) return false;
	const ext = path.extname(file).toLowerCase();
	if (!['.html', '.css', '.js', '.mjs'].includes(ext)) return false;
	if (rel.includes('node_modules')) return false;
	if (ext === '.mjs' && rel.startsWith('scripts/')) return false;
	return true;
}

function patch(content) {
	let next = content;
	for (const [from, to] of REPLACEMENTS) {
		next = next.split(from).join(to);
	}
	return next;
}

const files = walk(root).filter(shouldProcess);
let changed = 0;
for (const file of files) {
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log(path.relative(root, file));
	}
}
console.log(changed ? `Renamed (${changed} files).` : 'No et_pb renames needed.');
