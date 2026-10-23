/**
 * Zet gedeelde et-critical-inline-css in assets/css/critical-shared.css;
 * per pagina blijft alleen de pagina-specifieke tail in <style id="page-critical-css">.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'assets', 'css', 'critical-shared.css');

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

const CRITICAL_RE =
	/<style id="et-critical-inline-css">([\s\S]*?)<\/style>/i;

function readCritical(html) {
	const m = html.match(CRITICAL_RE);
	return m ? m[1] : null;
}

function commonPrefix(strings) {
	if (!strings.length) return '';
	let prefix = strings[0];
	for (const s of strings.slice(1)) {
		let i = 0;
		const max = Math.min(prefix.length, s.length);
		while (i < max && prefix[i] === s[i]) i++;
		prefix = prefix.slice(0, i);
		if (!prefix) break;
	}
	return prefix;
}

function trimToRuleBoundary(css) {
	const lastBrace = css.lastIndexOf('}');
	return lastBrace >= 0 ? css.slice(0, lastBrace + 1) : css;
}

function relCssHref(file) {
	const rel = path.relative(root, path.dirname(file));
	if (!rel || rel === '.') return 'assets/css/critical-shared.css';
	const depth = rel.split(path.sep).filter(Boolean).length;
	return `${'../'.repeat(depth)}assets/css/critical-shared.css`;
}

const files = listHtmlFiles();
const criticals = [];
for (const file of files) {
	const html = fs.readFileSync(file, 'utf8');
	const css = readCritical(html);
	if (!css) {
		console.warn('No critical CSS:', path.relative(root, file));
		continue;
	}
	criticals.push({ file, css });
}

if (!criticals.length) {
	console.log('Nothing to split.');
	process.exit(0);
}

let shared = trimToRuleBoundary(commonPrefix(criticals.map((c) => c.css)));
if (shared.length < 500) {
	console.error('Shared prefix suspiciously short; abort.');
	process.exit(1);
}

fs.writeFileSync(outFile, `/* Gedeelde export-critical (bronexport); stap 5: later in site.css opnemen */\n${shared}\n`);
console.log('Wrote', path.relative(root, outFile), `(${shared.length} chars)`);

let changed = 0;
for (const { file, css } of criticals) {
	let pageCss = css.slice(shared.length).trim();
	const href = relCssHref(file);
	const link = `<link rel="stylesheet" href="${href}" />`;
	let replacement;
	if (pageCss) {
		replacement = `${link}\n<style id="page-critical-css">${pageCss}</style>`;
	} else {
		replacement = link;
	}

	const html = fs.readFileSync(file, 'utf8');
	const next = html.replace(CRITICAL_RE, replacement);
	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Updated', path.relative(root, file), pageCss ? `+${pageCss.length} page chars` : '(shared only)');
		changed++;
	}
}

console.log(changed ? `Done (${changed} HTML files).` : 'No HTML changes.');
