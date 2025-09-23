import { renderWithProviders } from '../utils/render';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => nav);

import CategoriesPage from '@/app/(app)/categories/page';
const API = process.env.NEXT_PUBLIC_API_URL ?? '';

test('renderiza categorías', async () => {
  const { findByRole } = renderWithProviders(<CategoriesPage />);
  expect(await findByRole('heading', { name: /categorías/i })).toBeInTheDocument();
});