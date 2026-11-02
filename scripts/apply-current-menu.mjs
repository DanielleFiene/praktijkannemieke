/**
 * Zet current-menu-item op het li dat bij de pagina hoort (na normalize-page-markup).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugFromHtmlPath } from './page-slugs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

const SLUG_TO_MENU = {
	home: 'menu-item--home',
	'shambhala-reiki': 'menu-item--shambhala-reiki',
	'access-bars': 'menu-item--access-bars',
	'vlindermassage': 'menu-item--vlindermassage',
	'magnesiumpakking': 'menu-item--magnesiumpakking',
	'ondersteunende-middelen': 'menu-item--ondersteunende-middelen',
	tarieven: 'menu-item--tarieven',
	'over-annemieke': 'menu-item--over-annemieke',
	'neem-contact-op': 'menu-item--contact',
	privacyverklaring: null,
};

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function patch(html, file) {
	const slug = slugFromHtmlPath(file, root);
	const menuClass = SLUG_TO_MENU[slug];
	if (!menuClass) {
		return html.replace(/\scurrent-menu-item/g, '').replace(/\smenu-item--current/g, '');
	}
	let next = html.replace(/\scurrent-menu-item/g, '').replace(/\smenu-item--current/g, '');
	const re = new RegExp(`(<li class="[^"]*\\b${menuClass}\\b[^"]*")`, 'g');
	next = next.replace(re, (match) =>
		match.includes('current-menu-item')
			? match
			: match.replace(/"$/, ' current-menu-item menu-item--current"')
	);
	return next;
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before, file);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
	}
}
console.log(changed ? `Current menu (${changed} files).` : 'Current menu unchanged.');
