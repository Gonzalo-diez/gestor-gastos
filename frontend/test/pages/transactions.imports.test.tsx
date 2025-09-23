import { renderWithProviders } from '../utils/render';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import ImportsPage from '@/app/(app)/transactions/imports/page';

test('renderiza importador', async () => {
  const { findByText } = renderWithProviders(<ImportsPage />);
  expect(await findByText(/importar|archivo|csv/i)).toBeInTheDocument();
});

