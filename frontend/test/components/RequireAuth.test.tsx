import { renderWithProviders } from '../utils/render';
import { waitFor } from '@testing-library/react';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);
import { rest } from 'msw';
import { server } from '../msw/server';
import RequireAuth from '@/components/RequireAuth';

beforeEach(() => nav.__nav.reset());

test('redirige si no hay sesión', async () => {
  server.use(rest.get('*/auth/me', (_req, res, ctx) => res(ctx.status(401), ctx.json({ msg: 'no' }))));
  renderWithProviders(<RequireAuth><div>Privado</div></RequireAuth>);
  await waitFor(() => expect(nav.__nav.replace).toHaveBeenCalledWith('/auth/login'));
});

test('renderiza children si hay sesión', async () => {
  server.use(rest.get('*/auth/me', (_req, res, ctx) => res(ctx.status(200), ctx.json({ user: { id: 1 } }))));
  const { findByText } = renderWithProviders(<RequireAuth><div>Privado</div></RequireAuth>);
  expect(await findByText('Privado')).toBeInTheDocument();
});
