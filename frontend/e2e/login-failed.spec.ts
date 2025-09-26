import { test, expect } from '@playwright/test';

test('login falla y permanece en /auth/login', async ({ page }) => {
  await page.route('**/auth/login', r => {
    if (r.request().method() !== 'POST') return r.continue();
    return r.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Credenciales inválidas' })
    });
  });

  await page.goto('/auth/login');
  await page.getByPlaceholder(/email/i).fill('bad@example.com');
  await page.getByPlaceholder(/password|contraseña/i).fill('wrong');

  const done = page.waitForResponse(res =>
    res.url().includes('/auth/login') && res.request().method() === 'POST'
  );
  await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();
  const resp = await done;
  expect(resp.status()).toBe(401);

  await expect(page).toHaveURL(/\/auth\/login$/);
  // Opcional y laxo si existe un alert
  await expect.soft(page.getByRole('alert')).toBeVisible({ timeout: 500 }).catch(() => {});
});