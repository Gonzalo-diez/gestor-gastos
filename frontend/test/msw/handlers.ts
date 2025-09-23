import { rest } from 'msw';

export const handlers = [
  rest.get('*/auth/me', (_req, res, ctx) => res(ctx.status(200), ctx.json({ user: { id: 1, email: 't@e.com' } }))),

  // nuevos
  rest.post('*/auth/refresh', (_req, res, ctx) => res(ctx.status(200), ctx.json({ access: 't' }))),
  rest.get('*/transactions',   (_req, res, ctx) => res(ctx.status(200), ctx.json([]))),
  rest.get('*/currencies',     (_req, res, ctx) => res(ctx.status(200), ctx.json([]))),
  rest.get('*/reports/cashflow',(_req, res, ctx) => res(ctx.status(200), ctx.json({ data: [] }))),

  rest.get('*/accounts',   (_req, res, ctx) => res(ctx.json([]))),
  rest.get('*/categories', (_req, res, ctx) => res(ctx.json([]))),
  rest.get('*/reports/summary', (_req, res, ctx) =>
    res(ctx.json({ totals: { income: 1000, expense: 400 } })),
  ),
];
