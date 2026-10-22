// @ts-check
const { test, expect } = require('@playwright/test');
const { PAGES } = require('./pages');
const { waitForPageStable } = require('./helpers');

const strict =
  process.env.STRICT_EXTERNAL === '1' || process.env.STRICT_EXTERNAL === 'true';

test.describe('externe requests', () => {
  test.skip(
    !strict,
    'STRICT_EXTERNAL niet gezet – baseline WordPress-export laadt nog Typekit/Google Fonts'
  );

  for (const { slug, path } of PAGES) {
    test(`alleen lokale resources op ${slug}`, async ({ page, baseURL }) => {
      const external = [];
      const baseOrigin = new URL(baseURL).origin;

      page.on('request', (request) => {
        const url = request.url();
        if (url.startsWith('data:') || url.startsWith('blob:')) return;
        try {
          const origin = new URL(url).origin;
          if (origin !== baseOrigin) {
            external.push(url);
          }
        } catch {
          /* ignore */
        }
      });

      await page.goto(path, { waitUntil: 'load' });
      await waitForPageStable(page);

      expect(external, `Externe requests op ${path}`).toEqual([]);
    });
  }
});
