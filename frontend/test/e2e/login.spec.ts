import { test, expect } from '@playwright/test';

test('login UI feliz', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByPlaceholder(/email/i).fill('a@b.com');
  await page.getByPlaceholder(/password|contraseña/i).fill('x');
  await page.getByRole('button', { name: /entrar|ingresar|login/i }).click();
  await expect(page).toHaveURL(/^\/$/);
});