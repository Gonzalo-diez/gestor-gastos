import { renderWithProviders } from '../utils/render';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import Register from '@/app/(public)/auth/register/page';

test('renderiza formulario de registro', () => {
  const { getByPlaceholderText, getByRole } = renderWithProviders(<Register />);
  expect(getByPlaceholderText(/email/i)).toBeInTheDocument();
  expect(getByPlaceholderText(/password|contraseña/i)).toBeInTheDocument();
  expect(getByRole('button', { name: /registrar|crear cuenta|sign up/i })).toBeInTheDocument();
});
