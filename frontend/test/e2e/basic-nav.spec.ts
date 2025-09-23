import { test, expect } from '@playwright/test';

test('navegación básica', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /accounts|cuentas/i }).click();
  await expect(page).toHaveURL(/\/accounts$/);
  await expect(page.getByText(/sin cuentas|agregar cuenta/i)).toBeVisible();
});
