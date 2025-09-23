import { request, expect, test } from '@playwright/test';

test('login state', async ({}) => {
  const ctx = await request.newContext({ baseURL: process.env.NEXT_PUBLIC_API_URL });
  const r = await ctx.post('/auth/login', { data: { email: 'a@b.com', password: 'x' } });
  expect(r.ok()).toBeTruthy();
});
