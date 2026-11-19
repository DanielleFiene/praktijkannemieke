/**
 * Controle vóór Strato-deploy: geen staging noindex meer op pagina's.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git', 'scripts']);

function listHtmlFiles() {
	const files = [path.join(root, 'index.html'), path.join(root, '403.html'), path.join(root, '404.html')];
	for (const name of fs.readdirSync(root, { withFileTypes: true })) {
		if (!name.isDirectory() || SKIP_DIRS.has(name.name)) continue;
		const page = path.join(root, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

const errors = [];

for (const file of listHtmlFiles()) {
	const html = fs.readFileSync(file, 'utf8');
	const rel = path.relative(root, file).replace(/\\/g, '/');
	if (html.includes('STAGING_ROBOTS')) {
		errors.push(`${rel}: bevat nog STAGING_ROBOTS — run npm run strato:live-robots`);
	}
	const isErrorPage = rel === '403.html' || rel === '404.html';
	if (isErrorPage) {
		if (!/noindex/i.test(html)) {
			errors.push(`${rel}: verwacht noindex (geen indexatie)`);
		}
	} else if (/content="noindex/i.test(html)) {
		errors.push(`${rel}: nog noindex — niet geschikt voor productie-deploy`);
	}
}

for (const must of ['robots.txt', 'sitemap.xml', '.htaccess']) {
	if (!fs.existsSync(path.join(root, must))) {
		errors.push(`ontbrekend: ${must}`);
	}
}

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes('praktijkannemieke.nl/sitemap.xml')) {
	errors.push('robots.txt: sitemap-URL klopt niet');
}

if (errors.length) {
	console.error('Productie-check mislukt:\n' + errors.map((e) => `  - ${e}`).join('\n'));
	process.exit(1);
}
console.log('Productie-check OK (live robots, sitemap, .htaccess).');