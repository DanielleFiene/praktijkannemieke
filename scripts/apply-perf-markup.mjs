/**
 * Stap 7: LCP-vriendelijke markup (footer lazy, font preload).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

const FONT_PRELOADS = [
	'<link rel="preload" href="/assets/fonts/gstatic/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4uaVI.woff2" as="font" type="font/woff2" crossorigin />',
	'<link rel="preload" href="/assets/fonts/jennasue/jennasue-webfont.woff2" as="font" type="font/woff2" crossorigin />',
];

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function patchFooterImages(html) {
	return html.replace(/<img fetchpriority="high" decoding="async" ([^>]*class="footer-logo"[^>]*)>/g, (full, rest) => {
		if (/loading="/i.test(rest)) {
			return full.replace(/\sfetchpriority="high"/, '');
		}
		return `<img loading="lazy" decoding="async" ${rest}>`;
	});
}

function patchFontPreload(html) {
	if (html.includes('jennasue-webfont.woff2" as="font"')) return html;
	const anchor = '<link rel="stylesheet" href="/assets/css/fonts.css" />';
	if (!html.includes(anchor)) return html;
	return html.replace(anchor, `${anchor}\n${FONT_PRELOADS.join('\n')}`);
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const before = fs.readFileSync(file, 'utf8');
	let after = patchFooterImages(before);
	after = patchFontPreload(after);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
		console.log('perf', path.relative(root, file));
	}
}
console.log(changed ? `Done (${changed} files).` : 'Perf markup unchanged.');
