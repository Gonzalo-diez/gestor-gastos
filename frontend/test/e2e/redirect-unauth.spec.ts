import { test, expect } from '@playwright/test';

test('redirige a /auth/login sin sesión', async ({ page }) => {
  await page.goto('/transactions');
  await expect(page).toHaveURL(/\/auth\/login$/);
});