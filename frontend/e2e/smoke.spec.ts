import { test, expect } from '@playwright/test';
import { mockAuthed, mockMinimalData } from './mocks';

test('Home renderiza con sesión', async ({ page }) => {
  await mockAuthed(page);
  await mockMinimalData(page);
  await page.goto('/');
  await expect(page).toHaveURL('http://localhost:3000/');
  // Ajustá a tu UI real:
  await expect(page.getByRole('link', { name: /accounts|cuentas/i })).toBeVisible();
});