/**
 * Herstel lege hero-body (layout-export) en header-container class.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git', 'ondersteunende-middelen-2']);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP.has(name.name)) continue;
		const p = path.join(root, name.name, 'index.html');
		if (fs.existsSync(p)) files.push(p);
	}
	return files;
}

function restoreHeroBody(html) {
	// Lege hero-body direct na hero-title (export-layout).
	return html.replace(
		/(<h2 class="hero-title">[\s\S]*?<\/h2>)(\r?\n\s*)(<\/div>)/g,
		(match, h2, ws, close, offset, whole) => {
			const before = whole.slice(Math.max(0, offset - 400), offset);
			if (!before.includes('header-content') || before.includes('hero-body')) return match;
			const after = whole.slice(offset, offset + 200);
			if (after.includes('hero-body')) return match;
			return `${h2}${ws}<div class="hero-body"></div>${ws}${close}`;
		}
	);
}

function fixHeaderContainer(html) {
	return html.replace(
		/<div class="container header-inner"\s+class="clearfix">/g,
		'<div class="container clearfix header-inner">'
	);
}

function fixCriticalCss(html) {
	return html.replace(/div\.sec\.sec-home-hero-a,div\.sec\.sec-home-hero-b/g, 'section.sec.sec-home-hero-a,section.sec.sec-home-hero-b');
}

for (const file of listHtmlFiles()) {
	let next = fs.readFileSync(file, 'utf8');
	next = fixHeaderContainer(next);
	next = restoreHeroBody(next);
	if (path.relative(root, file) === 'index.html') next = fixCriticalCss(next);
	if (next !== fs.readFileSync(file, 'utf8')) {
		fs.writeFileSync(file, next);
		console.log(path.relative(root, file));
	}
}
