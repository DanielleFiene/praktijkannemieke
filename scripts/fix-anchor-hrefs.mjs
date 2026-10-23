import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

function walk(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules' || entry.name === '.git') continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full);
		else if (entry.name.endsWith('.html')) fixFile(full);
	}
}

function fixFile(filePath) {
	let html = fs.readFileSync(filePath, 'utf8');
	const before = html;
	html = html.replaceAll('..#Nei#Nei', '../index.html#Nei');
	html = html.replaceAll('#Nei#Nei', '#Nei');
	html = html.replaceAll('#Ervaringen#Ervaringen', '#Ervaringen');
	html = html.replaceAll('./#Ervaringen', '#Ervaringen');
	if (html !== before) {
		fs.writeFileSync(filePath, html);
		console.log('updated', path.relative(root, filePath));
	}
}

walk(root);
