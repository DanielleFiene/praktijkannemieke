/**
 * Verwijder kapotte @font-face uit layout.css (gif-placeholder) zonder rebuild.
 * Laat grid-tokens (col-half) intact.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'assets', 'css', 'layout.css');

let css = fs.readFileSync(file, 'utf8');
const before = css.length;
const colHalfBefore = (css.match(/col-half/g) || []).length;

css = css.replace(/@font-face\{font-family:FontAwesome[^}]+\}/gi, '');
css = css.replace(/@font-face\{[^}]*data:image\/gif[^}]+\}/gi, '');

const colHalfAfter = (css.match(/col-half/g) || []).length;
if (colHalfBefore !== colHalfAfter) {
	console.error('Aborted: col-half count changed', colHalfBefore, colHalfAfter);
	process.exit(1);
}

fs.writeFileSync(file, css);
const remaining = (css.match(/@font-face\{[^}]*data:image\/gif/gi) || []).length;
console.log(
	`layout.css: -${before - css.length} bytes, col-half ${colHalfAfter}, gif @font-face ${remaining}`,
);