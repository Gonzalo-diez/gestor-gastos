import { test, expect } from '@playwright/test';
import { mockAuthed, mockMinimalData } from './mocks';

test('Accounts lista vacía se muestra', async ({ page }) => {
  await mockAuthed(page);
  await mockMinimalData(page); // devuelve []

  await page.goto('/accounts');
  await expect(page).toHaveURL(/\/accounts$/);

  // En vacío no hay filas
  await expect(page.locator('tbody tr')).toHaveCount(0);
});