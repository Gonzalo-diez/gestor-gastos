import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('home sin violaciones críticas', async ({ page }) => {
  await page.goto('/');
  const res = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa']).analyze();
  expect(res.violations).toEqual([]);
});
