import { test, expect } from '@playwright/test';
import { mockLoginAPI, mockAuthed, mockMinimalData } from './mocks';

test('Login feliz y redirección a Home', async ({ page }) => {
  await mockLoginAPI(page);
  await mockAuthed(page);        // después del login, RequireAuth pedirá /auth/me
  await mockMinimalData(page);

  await page.goto('/auth/login');
  await page.getByPlaceholder(/email/i).fill('test@example.com');
  await page.getByPlaceholder(/password|contraseña/i).fill('secret');
  await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();

  await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
});