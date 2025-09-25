import { test, expect } from '@playwright/test';
import { mockUnAuthed } from './mocks';

test('Protegidas redirigen a /auth/login sin sesión', async ({ page }) => {
  await mockUnAuthed(page);
  for (const path of ['/accounts', '/categories', '/budgets', '/transactions']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login$/);
  }
});