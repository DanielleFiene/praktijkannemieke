import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const REPLACEMENTS = [
	[
		/assets\/images\/2023\/12\/Kennismakingsformulier-NEI-coaching-en-therapie\.docx/g,
		'assets/docs/Kennismakingsformulier-NEI-coaching-en-therapie.docx',
	],
	[
		/assets\/images\/2021\/06\/betalingsvoorwaarden_annemieke-10-2017\.pdf/g,
		'assets/docs/betalingsvoorwaarden_annemieke-10-2017.pdf',
	],
	[
		/assets\/images\/2024\/01\/Informatieverstrekking-WKKGZ-2024\.pdf/g,
		'assets/docs/Informatieverstrekking-WKKGZ-2024.pdf',
	],
];

function listSiteHtmlFiles() {
	const files = [path.join(root, 'index.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || name.name === 'node_modules' || name.name === 'tests') continue;
		const pageHtml = path.join(root, name.name, 'index.html');
		if (fs.existsSync(pageHtml)) files.push(pageHtml);
	}
	return files;
}

for (const file of listSiteHtmlFiles()) {
	let html = fs.readFileSync(file, 'utf8');
	let next = html;
	for (const [pattern, replacement] of REPLACEMENTS) {
		next = next.replace(pattern, replacement);
	}
	if (next !== html) {
		fs.writeFileSync(file, next);
		console.log('Doc links:', path.relative(root, file));
	}
}
