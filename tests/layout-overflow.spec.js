// @ts-check
const { test, expect } = require('@playwright/test');
const { waitForPageStable } = require('./helpers');

const VIEWPORTS = [
	{ name: 'iphone-16-portrait', width: 393, height: 852 },
	{ name: 'iphone-16-landscape', width: 852, height: 393 },
	{ name: 'iphone-se-landscape', width: 667, height: 375 },
	{ name: 'ipad-portrait', width: 768, height: 1024 },
	{ name: 'ipad-landscape', width: 1024, height: 768 },
	{ name: 'hamburger-1200', width: 1200, height: 800 },
];

const PATHS = ['./', './access-bars/', './tarieven/'];

async function horizontalOverflowPx(page) {
	return page.evaluate(() => {
		const el = document.documentElement;
		return Math.max(0, Math.max(el.scrollWidth, document.body.scrollWidth) - el.clientWidth);
	});
}

for (const vp of VIEWPORTS) {
	test.describe(`geen horizontale overflow (${vp.name})`, () => {
		test.use({ viewport: { width: vp.width, height: vp.height } });

		for (const path of PATHS) {
			test(`${path} menu dicht`, async ({ page }) => {
				await page.goto(path, { waitUntil: 'domcontentloaded' });
				await waitForPageStable(page);
				expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1);
			});

			test(`${path} mobiel menu open`, async ({ page }) => {
				await page.goto(path, { waitUntil: 'domcontentloaded' });
				await waitForPageStable(page);
				const toggle = page.locator('.mobile_menu_bar');
				if (await toggle.isVisible()) {
					await toggle.click();
					await page.waitForTimeout(350);
				}
				expect(await horizontalOverflowPx(page)).toBeLessThanOrEqual(1);
			});
		}
	});
}
