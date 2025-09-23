import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/render';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import Login from '@/app/(public)/auth/login/page';
import { server } from '../msw/server';
import { rest } from 'msw';

beforeEach(() => nav.__nav.reset());

test('renderiza y hace submit', async () => {
  server.use(rest.post('*/auth/login', (_req, res, ctx) => res(ctx.status(200), ctx.json({ access: 'x' }))));

  const { getByPlaceholderText, getByRole } = renderWithProviders(<Login />);
  fireEvent.change(getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } });
  fireEvent.change(getByPlaceholderText(/password|contraseña/i), { target: { value: 'x' } });
  fireEvent.click(getByRole('button', { name: /entrar|ingresar|login/i }));

  await waitFor(() => expect(nav.__nav.push).toHaveBeenCalledWith('/'));
});
