/**
 * Verwijder blokcomments uit handmatige CSS (niet layout-export.min).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
	path.join(root, 'assets/css/a11y.css'),
	path.join(root, 'assets/css/shell.css'),
	path.join(root, 'assets/css/site.css'),
];

function stripComments(css) {
	return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

for (const file of TARGETS) {
	if (!fs.existsSync(file)) continue;
	const before = fs.readFileSync(file, 'utf8');
	let after = stripComments(before);
	after = after.replace(/\n{3,}/g, '\n\n').trim() + '\n';
	if (after !== before) {
		fs.writeFileSync(file, after);
		console.log('Comments stripped', path.relative(root, file));
	}
}
