import { renderWithProviders } from '../utils/render';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import AccountsPage from '@/app/(app)/accounts/page';

beforeEach(() => nav.__nav.reset());

test('muestra "Sin cuentas" cuando API devuelve vacío', async () => {
  const { findAllByText } = renderWithProviders(<AccountsPage />);
  expect((await findAllByText(/sin cuentas/i)).length).toBeGreaterThan(0);
});

