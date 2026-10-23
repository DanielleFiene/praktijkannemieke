/**
 * Verwijder zichtbare CMS-export-resten uit HTML en normaliseer bronexport-paden/ids.
 * Terminologie: bronexport (geen merknamen in ids/paden).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function listHtmlFiles() {
	const files = [path.join(root, 'index.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const p = path.join(root, name.name, 'index.html');
		if (fs.existsSync(p)) files.push(p);
	}
	for (const name of ['403.html', '404.html']) {
		const p = path.join(root, name);
		if (fs.existsSync(p)) files.push(p);
	}
	return files;
}

const SEARCH_ACTION_JSON =
	/,"potentialAction":\[\{"@type":"SearchAction","target":\{"@type":"EntryPoint","urlTemplate":"https:\\\/\\\/www\.praktijkannemieke\.nl\\\/?s=\{search_term_string\}"\},"query-input":\{"@type":"PropertyValueSpecification","valueRequired":true,"valueName":"search_term_string"\}\}\]/g;

function scrubHtml(html) {
	let next = html;

	next = next.replaceAll('assets/css/divi/', 'assets/css/bronexport/');
	next = next.replaceAll('../assets/css/divi/', '../assets/css/bronexport/');
	next = next.replaceAll('/themes/Divi/', '/themes/export-base/');
	next = next.replaceAll('/themes/Divi_child/', '/themes/export-site/');
	next = next.replaceAll('/et-cache/', '/page-cache/');

	next = next.replaceAll("id='divi-style-parent-css'", "id='bronexport-base-css'");
	next = next.replaceAll("id='divi-style-css'", "id='bronexport-site-css'");
	next = next.replaceAll(/id="et-core-unified-deferred-(\d+)-cached-inline-styles"/g, 'id="bronexport-page-$1-css"');

	next = next.replace(/\bet_divi_theme\b\s*/g, '');
	next = next.replace(SEARCH_ACTION_JSON, '');

	next = next.replace(
		/<meta content="Divi Child[^"]*" name="generator"\s*\/>\s*/gi,
		''
	);

	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = scrubHtml(before);
	if (after !== before) {
		fs.writeFileSync(file, after);
		console.log('Scrubbed', path.relative(root, file));
		changed++;
	}
}
console.log(changed ? `Done (${changed} files).` : 'No HTML changes.');
