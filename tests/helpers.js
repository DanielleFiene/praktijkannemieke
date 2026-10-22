/**
 * Wacht tot de pagina stabiel is voor screenshots (fonts, lazy images).
 * @param {import('@playwright/test').Page} page
 */
async function waitForPageStable(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts?.ready);
  await page
    .waitForLoadState('networkidle', { timeout: 8000 })
    .catch(() => undefined);
  await page.waitForTimeout(600);
}

/**
 * @param {string} href
 * @param {string} baseURL
 * @returns {boolean}
 */
function isInternalHref(href, baseURL) {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  if (href.startsWith('javascript:')) return false;
  try {
    const url = new URL(href, baseURL);
    const base = new URL(baseURL);
    return url.origin === base.origin;
  } catch {
    return false;
  }
}

module.exports = { waitForPageStable, isInternalHref };
