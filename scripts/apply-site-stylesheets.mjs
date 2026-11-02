/**
 * Vervang bronexport-site + critical-shared door site.css;
 * page-cache links → assets/css/pages/{slug}.css
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, 'assets', 'css', 'pages');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

/** CMS page-id → bestandsnaam zonder ext */
const PAGE_ID_TO_FILE = {
	10: 'home',
	15: 'shambhala-reiki',
	17: 'over-annemieke',
	19: 'ondersteunende-middelen',
	21: 'neem-contact-op',
	227: 'privacy',
	295: 'access-bars',
	493: 'tarieven',
	501: 'vlindermassage',
	506: 'magnesiumpakking',
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

function relPrefix(filePath) {
	const rel = path.relative(root, path.dirname(filePath));
	if (!rel || rel === '.') return '';
	return `${'../'.repeat(rel.split(path.sep).filter(Boolean).length)}`;
}

function ensurePageCssFiles() {
	fs.mkdirSync(pagesDir, { recursive: true });
	for (const slug of Object.values(PAGE_ID_TO_FILE)) {
		const dest = path.join(pagesDir, `${slug}.css`);
		if (!fs.existsSync(dest)) {
			console.warn('Missing page CSS (handmatig herstellen):', path.relative(root, dest));
		}
	}
}

function patchHtml(html, prefix) {
	let next = html;
	const siteHref = `${prefix}assets/css/site.css`;

	next = next.replace(
		/<link rel='stylesheet' id='bronexport-site-css' href='[^']*' media='all' \/>[\r\n]*/g,
		''
	);
	next = next.replace(/<link rel="stylesheet" href="[^"]*critical-shared\.css" \/>[\r\n]*/g, '');
	next = next.replace(/<link rel="stylesheet" href="[^"]*assets\/css\/site\.css" \/>[\r\n]*/g, '');

	if (!next.includes('assets/css/site.css')) {
		next = next.replace(
			/(<meta name="msapplication-TileImage"[^>]*\/>[\r\n]*)/i,
			`$1<link rel="stylesheet" href="${siteHref}" />\n`
		);
	}

	next = next.replace(
		/<link rel="stylesheet" id="bronexport-page-(\d+)-css" href="[^"]+" \/>/g,
		(_m, id) => {
			const slug = PAGE_ID_TO_FILE[id];
			if (!slug) return _m;
			return `<link rel="stylesheet" id="site-page-css" href="${prefix}assets/css/pages/${slug}.css" />`;
		}
	);

	return next;
}

ensurePageCssFiles();

let changed = 0;
for (const file of listHtmlFiles()) {
	const prefix = relPrefix(file);
	const before = fs.readFileSync(file, 'utf8');
	const after = patchHtml(before, prefix);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('HTML', path.relative(root, file));
	}
}

console.log(changed ? `Updated ${changed} HTML files.` : 'HTML stylesheets unchanged.');
