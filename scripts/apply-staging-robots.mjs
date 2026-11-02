/**
 * Testfase: noindex op alle pagina's (zoek op STAGING_ROBOTS om bij livegang te verwijderen).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);

const STAGING = `\t<meta name="robots" content="noindex, nofollow" data-staging="STAGING_ROBOTS" />`;
const LIVE =
	`\t<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`;

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

const mode = process.argv[2] === 'live' ? 'live' : 'staging';

function stripRobotsMeta(html) {
	return html.replace(/\s*<meta name=["']robots["'][^>]*\/>/gi, '');
}

function insertRobots(html, tag) {
	if (!html.includes('http-equiv="X-UA-Compatible"')) {
		return `${tag}\n${html}`;
	}
	return html.replace(/<meta http-equiv="X-UA-Compatible"[^>]*>/i, (m) => `${m}\n${tag}`);
}

function patch(html, is403) {
	let next = stripRobotsMeta(html);
	if (mode === 'live') {
		if (is403) {
			return insertRobots(next, '\t<meta name="robots" content="noindex, nofollow" />');
		}
		return insertRobots(next, LIVE);
	}
	return insertRobots(next, STAGING);
}

let changed = 0;
for (const file of listHtmlFiles()) {
	const is403 = file.endsWith('403.html');
	const before = fs.readFileSync(file, 'utf8');
	const after = patch(before, is403);
	if (after !== before) {
		fs.writeFileSync(file, after);
		changed += 1;
	}
}
console.log(mode === 'live' ? 'Live robots meta' : 'Staging noindex', changed, 'files');
