// @ts-check
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PAGES } = require('./pages');
const { waitForPageStable } = require('./helpers');

/** Alleen falen onder drempel met LIGHTHOUSE_STRICT=1 (geen site-aanpassingen voor scores). */
const minScore = Number(process.env.LIGHTHOUSE_MIN_SCORE || 95);
const strict = process.env.LIGHTHOUSE_STRICT === '1';
const runLighthouse = process.env.RUN_LIGHTHOUSE === '1' || process.env.RUN_LIGHTHOUSE === 'true';

const lighthouseBin = path.join(
	__dirname,
	'..',
	'node_modules',
	'lighthouse',
	'cli',
	'index.js'
);

function runLighthouseCli(url) {
	const outFile = path.join(os.tmpdir(), `lh-${process.pid}-${Date.now()}.json`);
	const args = [
		lighthouseBin,
		url,
		'--preset=desktop',
		'--output=json',
		`--output-path=${outFile}`,
		'--quiet',
		'--chrome-flags=--headless=new',
		'--only-categories=performance',
		'--only-categories=accessibility',
		'--only-categories=best-practices',
		'--only-categories=seo',
	];
	execFileSync(process.execPath, args, {
		stdio: ['ignore', 'pipe', 'pipe'],
		timeout: 120_000,
		env: { ...process.env, NODE_OPTIONS: '' },
	});
	const lhr = JSON.parse(fs.readFileSync(outFile, 'utf8'));
	fs.unlinkSync(outFile);
	return lhr;
}

test.describe('Lighthouse', () => {
	test.skip(!runLighthouse, 'Zet RUN_LIGHTHOUSE=1 voor Lighthouse-audits (traag)');

	for (const { slug, path: pagePath } of PAGES) {
		test(`${slug} audit`, async ({ page }) => {
			await page.goto(pagePath || './', { waitUntil: 'domcontentloaded' });
			await waitForPageStable(page);
			const url = page.url();

			const lhr = runLighthouseCli(url);
			expect(lhr.finalDisplayedUrl, 'Lighthouse URL').toBeTruthy();

			const scores = {};
			for (const key of ['performance', 'accessibility', 'best-practices', 'seo']) {
				const cat = lhr.categories[key];
				expect(cat, `category ${key}`).toBeTruthy();
				scores[key] = Math.round(cat.score * 100);
			}

			console.log(`${slug}: ${JSON.stringify(scores)}`);

			if (strict) {
				for (const [key, score] of Object.entries(scores)) {
					expect(score, `${slug} ${key}`).toBeGreaterThanOrEqual(minScore);
				}
			}
		});
	}
});
