import { request, type FullConfig } from '@playwright/test';
import { writeFile } from 'fs/promises';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL as string || 'http://localhost:3000';
  const ctx = await request.newContext({ baseURL });
  const r = await ctx.post('/auth/login', { data: { email: 'a@b.com', password: 'x' } });
  if (!r.ok()) throw new Error('login failed');
  await writeFile('storageState.auth.json', JSON.stringify(await ctx.storageState()));
}