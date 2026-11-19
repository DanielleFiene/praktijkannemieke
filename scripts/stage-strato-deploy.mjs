/**
 * Maak een schone uploadmap voor Strato (zonder tests, scripts, node_modules).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PAGE_SLUGS } from './site-url.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.deploy-staging');

const ROOT_FILES = [
	'.htaccess',
	'index.html',
	'403.html',
	'404.html',
	'robots.txt',
	'sitemap.xml',
	'llms.txt',
	'humans.txt',
	'site.webmanifest',
];

function rmDir(dir) {
	if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyRecursive(src, dest) {
	const stat = fs.statSync(src);
	if (stat.isDirectory()) {
		fs.mkdirSync(dest, { recursive: true });
		for (const ent of fs.readdirSync(src)) {
			copyRecursive(path.join(src, ent), path.join(dest, ent));
		}
		return;
	}
	fs.mkdirSync(path.dirname(dest), { recursive: true });
	fs.copyFileSync(src, dest);
}

function copyInto(src, destDir) {
	copyRecursive(src, path.join(destDir, path.basename(src)));
}

rmDir(out);
fs.mkdirSync(out, { recursive: true });

for (const file of ROOT_FILES) {
	const src = path.join(root, file);
	if (fs.existsSync(src)) copyInto(src, out);
}

copyInto(path.join(root, '.well-known'), out);
copyInto(path.join(root, 'assets'), out);

for (const slug of PAGE_SLUGS) {
	const src = path.join(root, slug);
	if (fs.existsSync(src)) copyInto(src, out);
}

// Bron-CSS niet nodig op productie
const sourcesCss = path.join(out, 'assets', 'css', '_sources');
if (fs.existsSync(sourcesCss)) fs.rmSync(sourcesCss, { recursive: true, force: true });

console.log('Staging:', path.relative(root, out));