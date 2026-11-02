// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { PAGES } = require('./pages');

const siteRoot = path.resolve(__dirname, '..');

function pagePathToFile(pagePath) {
	if (!pagePath || pagePath === '/') return path.join(siteRoot, 'index.html');
	const segment = pagePath.replace(/^\/|\/$/g, '');
	return path.join(siteRoot, segment, 'index.html');
}

function countH1(html) {
	return (html.match(/<h1\b/gi) || []).length;
}

test.describe('heading-hiërarchie', () => {
	for (const { slug, path: pagePath } of PAGES) {
		test(`${slug}: precies één h1`, () => {
			const file = pagePathToFile(pagePath);
			const html = fs.readFileSync(file, 'utf8');
			expect(countH1(html), file).toBe(1);
		});
	}

	for (const name of ['403.html', '404.html']) {
		test(`${name}: precies één h1`, () => {
			const file = path.join(siteRoot, name);
			const html = fs.readFileSync(file, 'utf8');
			expect(countH1(html)).toBe(1);
		});
	}
});
