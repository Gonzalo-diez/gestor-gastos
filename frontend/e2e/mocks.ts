import { Page } from '@playwright/test';

export async function mockAuthed(page: Page) {
  await page.route('**/auth/me', r =>
    r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ user: { id: '1', email: 'test@example.com' } })
    })
  );
}

export async function mockUnAuthed(page: Page) {
  await page.route('**/auth/me', r => r.fulfill({ status: 401, body: '' }));
}

export async function mockMinimalData(page: Page) {
  await page.route('**/accounts**', r => r.fulfill({ status: 200, contentType:'application/json', body: '[]' }));
  await page.route('**/categories**', r => r.fulfill({ status: 200, contentType:'application/json', body: '[]' }));
  await page.route('**/budgets**', r => r.fulfill({ status: 200, contentType:'application/json', body: '[]' }));
  await page.route('**/transactions**', r => r.fulfill({ status: 200, contentType:'application/json', body: '[]' }));
}

export async function mockLoginAPI(page: Page) {
  // Ajustá si el frontend pega a otra ruta
  await page.route('**/auth/login', r => {
    if (r.request().method() !== 'POST') return r.continue();
    return r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ access: 'tok', refresh: 'ref' })
    });
  });
}