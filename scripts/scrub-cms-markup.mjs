/**
 * Hernoem CMS-export-markup (WordPress-idiomen) naar neutrale site-conventies.
 * Geen wijziging aan zichtbare teksten of bronexport-CSS-regels.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesDir = path.join(root, 'assets', 'css', 'pages');

const SKIP_PAGE_DIRS = new Set([
	'node_modules',
	'tests',
	'playwright-report',
	'test-results',
	'.git',
	'scripts',
	'assets',
]);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_PAGE_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function renameLegacyPageCssFiles() {
	if (!fs.existsSync(pagesDir)) return 0;
	let count = 0;
	for (const file of fs.readdirSync(pagesDir)) {
		const m = /^et-core-unified-deferred-(\d+)\.min\.css$/.exec(file);
		if (!m) continue;
		console.warn('Legacy page CSS in pages/ (hernoem handmatig naar slug.css):', file);
		count += 1;
	}
	return count;
}

function scrubExportArtifacts(html) {
	let next = html;

	next = next.replace(
		/\s*<meta name="twitter:label1" content="Geschatte leestijd" \/>\s*<meta name="twitter:data1" content="[^"]*" \/>/g,
		''
	);

	next = next.replace(/\s+data-content-guid="[^"]*"/g, '');
	next = next.replace(/\s+data-href="[^"]*"/g, '');

	next = next.replace(/\sclass="nonblock"/g, '');
	next = next.replace(/(\sclass="[^"]*)\snonblock(\s[^"]*")/g, '$1$2');
	next = next.replace(/(\sclass=")nonblock\s+/g, '$1');

	next = next.replace(/\s*shared_content\s*/g, ' ');
	next = next.replace(/class="\s+/g, 'class="');
	next = next.replace(/\s+"/g, '"');
	next = next.replace(/\sclass=""/g, '');

	next = next.replace(/\s+id="u[0-9]+(-[0-9]+)?"/g, '');
	next = next.replace(/<p><\/div>/g, '</div>');

	next = next.replace(/<p class="body"/g, '<p');

	return next;
}

function scrubHtml(html) {
	let next = html;

	next = next.replaceAll(/et-core-unified-deferred-(\d+)\.min\.css/g, 'page-$1.min.css');

	next = next.replace(/id="post-(\d+)"/g, 'id="page-$1"');
	next = next.replace(/class="post-(\d+) page type-page status-publish hentry"/g, 'class="page page--$1"');

	next = next.replaceAll('class="wp-image-409 alignnone size-full"', 'class="footer-logo"');
	next = next.replaceAll('class="wp-image-91 alignnone size-medium"', 'class="footer-vvnt-badge"');
	next = next.replace(
		/class="wp-image-\d+ alignnone size-full (ondersteunende-middelen-foto)"/g,
		'class="$1"'
	);

	next = scrubExportArtifacts(next);

	next = next.replace(/\smenu-item-type-(?:post_type|custom)\s/g, ' ');
	next = next.replace(/\smenu-item-object-(?:page|custom)\s/g, ' ');
	next = next.replace(/\smenu-item-home\s/g, ' ');
	next = next.replace(/class="\s+/g, 'class="');
	next = next.replace(/\s+"/g, '"');

	return next;
}

function scrubA11yCss(text) {
	let next = text;
	next = next.replace(/#post-/g, '#page-');
	next = next.replace(/:has\(#post-/g, ':has(#page-');
	next = next.replace(
		/#page-container a\[href="https:\/\/vvnt\.nl"\] img\.wp-image-91/g,
		'#page-container a[href="https://vvnt.nl"] img.footer-vvnt-badge'
	);
	next = next.replace(
		/main#hoofdinhoud \.et_pb_text_inner img\.alignnone,\s*\n\tmain#hoofdinhoud \.et_pb_text_inner img\.alignleft,\s*\n\tmain#hoofdinhoud \.et_pb_text_inner img\.alignright/g,
		'main#hoofdinhoud .et_pb_text_inner img'
	);
	return next;
}

function replaceInTree(dir, exts, transform) {
	for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, ent.name);
		if (ent.isDirectory()) {
			if (ent.name === 'node_modules' || ent.name === '.git') continue;
			replaceInTree(p, exts, transform);
			continue;
		}
		if (!exts.some((e) => ent.name.endsWith(e))) continue;
		const before = fs.readFileSync(p, 'utf8');
		const after = transform(before, p);
		if (after !== before) {
			fs.writeFileSync(p, after);
			console.log('updated', path.relative(root, p));
		}
	}
}

replaceInTree(path.join(root, 'assets', 'css', 'pages'), ['.css'], (text) =>
	text.replaceAll(/et-core-unified-deferred-(\d+)\.min\.css/g, 'page-$1.min.css')
);

renameLegacyPageCssFiles();

let htmlChanged = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	const after = scrubHtml(before);
	if (after !== before) {
		fs.writeFileSync(file, after);
		htmlChanged += 1;
		console.log('HTML', path.relative(root, file));
	}
}

const a11yPath = path.join(root, 'assets', 'css', 'a11y.css');
if (fs.existsSync(a11yPath)) {
	const before = fs.readFileSync(a11yPath, 'utf8');
	const after = scrubA11yCss(before);
	if (after !== before) {
		fs.writeFileSync(a11yPath, after);
		console.log('updated assets/css/a11y.css');
	}
}

replaceInTree(path.join(root, 'scripts'), ['.mjs'], (text) =>
	text.replaceAll(/et-core-unified-deferred-(\d+)\.min\.css/g, 'page-$1.min.css')
);

console.log(htmlChanged ? `Done (${htmlChanged} HTML files).` : 'HTML unchanged.');
