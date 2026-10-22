// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForPageStable } = require('./helpers');

test.describe('mobiel menu', () => {
  test('menu opent en toont navigatie', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageStable(page);

    const menuToggle = page.locator('.mobile_menu_bar');
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    const mobileNav = page.locator('#mobile_menu, .et_mobile_menu');
    await expect(mobileNav.first()).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: /tarieven/i })).toBeVisible();
  });

  test('NEI THERAPIE in mobiel menu', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageStable(page);

    await page.locator('.mobile_menu_bar').click();
    const neiLink = page.locator('.et_mobile_menu a[href*="Nei"]');
    await neiLink.click({ noWaitAfter: true });
    await expect(page.locator('#Nei')).toBeVisible();
  });
});
