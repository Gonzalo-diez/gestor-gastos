import { test, expect } from '@playwright/test';
import { mockAuthed, mockMinimalData } from './mocks';

test('Navegación básica a secciones', async ({ page }) => {
  await mockAuthed(page);
  await mockMinimalData(page);

  // Accounts
  await page.goto('/');
  await page.locator('a[href="/accounts"]').first().click();
  await expect(page).toHaveURL(/\/accounts$/);

  // Categories
  await page.goto('/');
  await page.locator('a[href="/categories"]').first().click();
  await expect(page).toHaveURL(/\/categories$/);

  // Budgets
  await page.goto('/');
  await page.locator('a[href="/budgets"]').first().click();
  await expect(page).toHaveURL(/\/budgets$/);

  // Transactions
  await page.goto('/');
  await page.locator('a[href="/transactions"]').first().click();
  await expect(page).toHaveURL(/\/transactions$/);
});
