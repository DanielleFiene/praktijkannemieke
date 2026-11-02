// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const siteRoot = path.resolve(__dirname, '..');

function listHtmlFiles() {
	const skip = new Set(['node_modules', 'tests', 'playwright-report', 'test-results', '.git']);
	const files = [path.join(siteRoot, 'index.html'), path.join(siteRoot, '403.html'), path.join(siteRoot, '404.html')];
	for (const name of fs.readdirSync(siteRoot, { withFileTypes: true })) {
		if (!name.isDirectory() || skip.has(name.name)) continue;
		const page = path.join(siteRoot, name.name, 'index.html');
		if (fs.existsSync(page)) files.push(page);
	}
	return files;
}

test('article: slug-class geen page--123', () => {
	for (const file of listHtmlFiles()) {
		const html = fs.readFileSync(file, 'utf8');
		expect(html, path.relative(siteRoot, file)).not.toMatch(/class="page page--\d+"/);
		expect(html, path.relative(siteRoot, file)).not.toMatch(/<article id="page-\d+"/);
		expect(html, path.relative(siteRoot, file)).toMatch(/<article class="page page--[\w-]+">/);
	}
});
