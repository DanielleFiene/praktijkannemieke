/**
 * AGENTS.md stap 5.2: layout-base uit bronexport → assets/css/layout.css (zelfde regels, eigen pad).
 * Bron: bronexport/themes/export-base/style-static.min.css
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'assets', 'css', 'bronexport', 'themes', 'export-base', 'style-static.min.css');
const out = path.join(root, 'assets', 'css', 'layout.css');

if (!fs.existsSync(src)) {
	console.error('Missing bronexport base CSS:', src);
	process.exit(1);
}

let css = fs.readFileSync(src, 'utf8');
css = css.replaceAll('url(core/', 'url(bronexport/themes/export-base/core/');
css = css.replaceAll('url(includes/', 'url(bronexport/themes/export-base/includes/');

const header = `/*
 * layout.css – site-brede layout (stap 5.2)
 * Afgeleid van bronexport style-static; geleidelijk vervangen door onderhoudbare regels.
 * Genereer opnieuw: npm run css:layout
 */

`;

fs.writeFileSync(out, header + css);
console.log('Wrote', path.relative(root, out), `(${(header.length + css.length).toLocaleString()} chars)`);
