import { test, expect } from '@playwright/test';
import { mockAuthed, mockMinimalData } from './mocks';

test('home renderiza', async ({ page }) => {
  await mockAuthed(page);
  await mockMinimalData(page);
  await page.goto('/');
  // El menú muestra "Resumen", no "Inicio"
  await expect(page.getByRole('link', { name: 'Resumen' })).toBeVisible();
});