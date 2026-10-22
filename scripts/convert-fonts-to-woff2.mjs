import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ttf2woff2 from 'ttf2woff2';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function convertDir(dir) {
	for (const name of fs.readdirSync(dir)) {
		const full = path.join(dir, name);
		if (fs.statSync(full).isDirectory()) {
			convertDir(full);
			continue;
		}
		if (!name.endsWith('.ttf')) continue;
		const out = full.replace(/\.ttf$/i, '.woff2');
		const input = fs.readFileSync(full);
		fs.writeFileSync(out, ttf2woff2(input));
		console.log('woff2:', path.relative(root, out));
	}
}

convertDir(path.join(root, 'assets/fonts/proxima-nova'));
