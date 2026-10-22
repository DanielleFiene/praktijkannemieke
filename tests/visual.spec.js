// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./pages');
const { waitForPageStable } = require('./helpers');

for (const { slug, path } of PAGES) {
  test(`visuele referentie: ${slug}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await waitForPageStable(page);
    await expect(page).toHaveScreenshot(`${slug}.png`, {
      fullPage: true,
    });
  });
}
