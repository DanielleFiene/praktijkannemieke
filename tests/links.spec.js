// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./pages');
const { waitForPageStable, isInternalHref } = require('./helpers');

test.describe('interne links', () => {
  for (const { slug, path } of PAGES) {
    test(`geen kapotte links op ${slug}`, async ({ page, baseURL }) => {
      const failures = [];
      const seen = new Set();

      page.on('response', (response) => {
        const url = response.url();
        if (!isInternalHref(url, baseURL)) return;
        if (response.status() >= 400) {
          failures.push(`${response.status()} ${url}`);
        }
      });

      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await waitForPageStable(page);

      const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
        anchors.map((a) => a.getAttribute('href')).filter(Boolean)
      );

      for (const href of hrefs) {
        if (!isInternalHref(href, baseURL)) continue;
        const resolved = new URL(href, baseURL).href;
        if (seen.has(resolved)) continue;
        seen.add(resolved);

        const response = await page.request.get(resolved);
        if (response.status() >= 400) {
          failures.push(`${response.status()} ${resolved} (vanaf ${path}, href=${href})`);
        }
      }

      expect(failures, `Kapotte interne links op ${path}`).toEqual([]);
    });
  }
});
