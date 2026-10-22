import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const REF = 'd2aa3af';

function listSiteHtmlFiles() {
	const files = [path.join(root, 'index.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const pageHtml = path.join(root, name.name, 'index.html');
		if (fs.existsSync(pageHtml)) files.push(pageHtml);
	}
	return files;
}

const YOAST_BLOCK_RE =
	/<!--\s*This site is optimized with the Yoast SEO plugin[\s\S]*?<!--\s*\/ Yoast SEO plugin\.\s*-->\s*/i;

function extractYoastInner(fromGit) {
	const block = fromGit.match(YOAST_BLOCK_RE);
	if (!block) return '';
	return block[0]
		.replace(/<!--\s*This site is optimized with the Yoast SEO plugin[^>]*-->\s*/i, '')
		.replace(/<!--\s*\/ Yoast SEO plugin\.\s*-->\s*/i, '');
}

for (const file of listSiteHtmlFiles()) {
	const rel = path.relative(root, file).replace(/\\/g, '/');
	let fromGit;
	try {
		fromGit = execSync(`git show ${REF}:${rel}`, { cwd: root, encoding: 'utf8' });
	} catch {
		continue;
	}
	const inner = extractYoastInner(fromGit);
	if (!inner.trim()) {
		console.warn('No Yoast inner in', rel);
		continue;
	}
	let html = fs.readFileSync(file, 'utf8');
	if (/<title>/i.test(html)) continue;

	const insertAfter =
		html.match(/<link rel="author" href="[^"]*humans\.txt"\s*\/>\s*/i) ||
		html.match(/<meta name="web_author"[^>]*>\s*/i);
	if (!insertAfter) continue;

	html = html.replace(insertAfter[0], `${insertAfter[0]}\n${inner}`);
	fs.writeFileSync(file, html);
	console.log('Restored head meta in', rel);
}
