import { renderWithProviders } from '../utils/render';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import TransactionsPage from '@/app/(app)/transactions/page';

test('renderiza transacciones', async () => {
  const { findByText } = renderWithProviders(<TransactionsPage />);
  expect(await findByText(/transaccion|transacciones|monto|filtrar/i)).toBeInTheDocument();
});
