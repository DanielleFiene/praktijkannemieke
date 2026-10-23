// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForPageStable } = require('./helpers');

test.describe('anchor-links', () => {
  test('NEI THERAPIE scrollt naar #Nei op home', async ({ page }) => {
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    await waitForPageStable(page);

    const neiLink = page.locator('a[href="#Nei"]').last();
    await neiLink.scrollIntoViewIfNeeded();
    await neiLink.click({ noWaitAfter: true });
    await expect(page.locator('#Nei')).toBeVisible();
  });

  test('NEI THERAPIE vanaf subpagina naar home #Nei', async ({ page }) => {
    await page.goto('tarieven/', { waitUntil: 'domcontentloaded' });
    await waitForPageStable(page);

    const neiLink = page.locator('a[href="../index.html#Nei"]').last();
    await neiLink.scrollIntoViewIfNeeded();
    await neiLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/#Nei$/);
    await expect(page.locator('#Nei')).toBeVisible();
  });

  test('Ervaringen op over-annemieke', async ({ page }) => {
    await page.goto('over-annemieke/', { waitUntil: 'domcontentloaded' });
    await waitForPageStable(page);

    const link = page.locator('a[href*="Ervaringen"]').first();
    await link.click({ noWaitAfter: true });
    await expect(page.locator('#Ervaringen')).toBeVisible();
  });
});
