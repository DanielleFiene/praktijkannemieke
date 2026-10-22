// @ts-check
const { defineConfig } = require('@playwright/test');

const port = Number(process.env.PORT || 4173);
const basePath = (
  process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : '/praktijkannemieke'
).replace(/\/$/, '');
const origin = `http://127.0.0.1:${port}`;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 120_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
    },
  },
  use: {
    baseURL: `${origin}${basePath}/`,
    trace: 'on-first-retry',
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
  },
  webServer: {
    command: `node scripts/static-server.mjs`,
    env: { PORT: String(port), BASE_PATH: basePath },
    url: `${origin}${basePath}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'checks',
      testMatch:
        /links\.spec\.js|html-validate\.spec\.js|a11y\.spec\.js|external-requests\.spec\.js/,
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-375',
      testMatch: /visual\.spec\.js|navigation-mobile\.spec\.js/,
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'tablet-768',
      testMatch: /visual\.spec\.js/,
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'desktop-1440',
      testMatch: /visual\.spec\.js|navigation-desktop\.spec\.js/,
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});
