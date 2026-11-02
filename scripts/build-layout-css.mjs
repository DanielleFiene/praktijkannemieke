/**
 * AGENTS.md stap 5.3: layout.css uit _sources; ETmodules lokaal in assets/fonts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'assets', 'css', '_sources', 'layout-export.min.css');
const out = path.join(root, 'assets', 'css', 'layout.css');

const PLACEHOLDER_IMG =
	'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")';

if (!fs.existsSync(src)) {
	console.error('Missing layout source:', src);
	process.exit(1);
}

let css = fs.readFileSync(src, 'utf8');
css = css.replace(/url\([^)]*\/modules\/all\/modules\.[^)]+\)/gi, 'url(../fonts/etmodules/modules.woff)');
css = css.replace(/url\((?:includes|core)\/[^)]+\)/gi, (match) => {
	if (match.includes('/modules/all/modules.')) {
		return 'url(../fonts/etmodules/modules.woff)';
	}
	return PLACEHOLDER_IMG;
});

const header = `/*
 * layout.css – site-brede layout (stap 5)
 * Bron: assets/css/_sources/layout-export.min.css
 * Genereer: npm run css:layout
 */

`;

fs.writeFileSync(out, header + css);
console.log('Wrote', path.relative(root, out), `(${(header.length + css.length).toLocaleString()} chars)`);
