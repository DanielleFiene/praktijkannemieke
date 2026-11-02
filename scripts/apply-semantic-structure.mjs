/**
 * Semantische structuur: div.sec → section, decoratie aria-hidden, lege hero-body weg.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { slugFromHtmlPath } from './page-slugs.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git', 'ondersteunende-middelen-2']);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

function isSecDiv(attrs) {
	const m = attrs.match(/\bclass="([^"]*)"/);
	if (!m) return false;
	return m[1].split(/\s+/).includes('sec');
}

/** div.sec open → section; bijhorende </div> → </section>. */
export function upgradeSecSections(html) {
	const re = /<\/?(div|section)([^>]*)>/gi;
	const stack = [];
	let out = '';
	let last = 0;
	let m;
	while ((m = re.exec(html)) !== null) {
		out += html.slice(last, m.index);
		const raw = m[0];
		const tag = m[1].toLowerCase();
		const attrs = m[2];
		const closing = raw.startsWith('</');

		if (!closing && tag === 'div') {
			if (isSecDiv(attrs)) {
				stack.push('sec-section');
				out += `<section${attrs}>`;
			} else {
				stack.push('div');
				out += raw;
			}
		} else if (!closing && tag === 'section') {
			stack.push('section');
			out += raw;
		} else if (closing && tag === 'div') {
			const kind = stack.pop();
			if (kind === 'sec-section') out += '</section>';
			else if (kind === 'div') out += '</div>';
			else if (kind === undefined) out += '</div>';
			else throw new Error(`Unexpected </div> (stack ${kind})`);
		} else if (closing && tag === 'section') {
			const kind = stack.pop();
			if (kind !== 'section') throw new Error(`Unexpected </section> (stack ${kind})`);
			out += raw;
		}
		last = re.lastIndex;
	}
	out += html.slice(last);
	return out;
}

function addAriaHiddenDecor(html) {
	return html
		.replace(/<div class="hero-overlay">/g, '<div class="hero-overlay" aria-hidden="true">')
		.replace(/<div class="hero-scroll">/g, '<div class="hero-scroll" aria-hidden="true">')
		.replace(/<span class="logo-spacer"><\/span>/g, '<span class="logo-spacer" aria-hidden="true"></span>')
		.replace(/<div class="rule-internal"><\/div>/g, '<div class="rule-internal" aria-hidden="true"></div>');
}

function removeEmptyHeroBody(html) {
	return html.replace(/<div class="hero-body"><\/div>\s*/g, '');
}

function patch(html) {
	let next = html;
	next = removeEmptyHeroBody(next);
	next = addAriaHiddenDecor(next);
	next = upgradeSecSections(next);
	return next;
}

if (process.argv[1] && path.basename(process.argv[1]) === 'apply-semantic-structure.mjs') {
	let n = 0;
	for (const file of listHtmlFiles()) {
		const before = fs.readFileSync(file, 'utf8');
		const after = patch(before);
		if (after !== before) {
			fs.writeFileSync(file, after);
			console.log(path.relative(root, file));
			n += 1;
		}
	}
	console.log(n ? `Semantic structure (${n} files).` : 'No changes.');
}
