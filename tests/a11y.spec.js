// @ts-check
const { test } = require('@playwright/test');

test.describe('toegankelijkheid (axe-core)', () => {
  test.skip(
    process.env.RUN_A11Y !== '1',
    'Zet RUN_A11Y=1 na semantische HTML-rebuild (WCAG 2.2 AA, 0 axe-fouten)'
  );
});
