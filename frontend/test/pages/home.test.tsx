import { renderWithProviders } from '../utils/render';
import { screen, waitFor } from '@testing-library/react';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import Home from '@/app/(app)/page';
import { server } from '../msw/server';
import { rest } from 'msw';

beforeEach(() => nav.__nav.reset());

// Mock de Recharts para evitar width/height=0
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  const RC = ({ children }: any) => <div style={{ width: 800, height: 300 }}>{children}</div>;
  return { ...actual, ResponsiveContainer: RC };
});

test('redirige a /auth/login si 401', async () => {
  server.use(rest.get('*/auth/me', (_req, res, ctx) => res(ctx.status(401), ctx.json({ msg: 'no' }))));
  renderWithProviders(<Home />);
  await waitFor(() => expect(nav.__nav.replace).toHaveBeenCalledWith('/auth/login'));
});

test('muestra resumen autenticado', async () => {
  server.use(rest.get('*/auth/me', (_r, res, ctx) => res(ctx.status(200), ctx.json({ user: { id: 1 } }))));
  renderWithProviders(<Home />);

  // Evitá el regex global que matchea múltiples nodos
  expect(await screen.findByText('Ingresos')).toBeInTheDocument();
  expect(await screen.findByText('Gastos')).toBeInTheDocument();
  expect(await screen.findByText('Neto')).toBeInTheDocument();
});
