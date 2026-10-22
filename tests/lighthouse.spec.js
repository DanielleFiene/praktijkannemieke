// @ts-check
const { test, expect } = require('@playwright/test');
const { playAudit } = require('playwright-lighthouse');
const { PAGES } = require('./pages');
const { waitForPageStable } = require('./helpers');

const minScore = Number(process.env.LIGHTHOUSE_MIN_SCORE || 90);
const runLighthouse = process.env.RUN_LIGHTHOUSE === '1' || process.env.RUN_LIGHTHOUSE === 'true';

test.describe('Lighthouse', () => {
  test.skip(!runLighthouse, 'Zet RUN_LIGHTHOUSE=1 voor Lighthouse-audits (traag)');

  test.use({
    channel: 'chrome',
    launchOptions: {
      args: ['--remote-debugging-port=9222'],
    },
  });

  for (const { slug, path } of PAGES) {
    test(`${slug} scores ≥ ${minScore}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await waitForPageStable(page);

      const audit = await playAudit({
        page,
        port: 9222,
        thresholds: {
          performance: minScore,
          accessibility: minScore,
          'best-practices': minScore,
          seo: minScore,
        },
      });

      expect(audit.lhr.finalDisplayedUrl).toBeTruthy();
    });
  }
});
