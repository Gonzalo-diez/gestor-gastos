import { render } from '@testing-library/react';
import * as nav from '../mocks/next-navigation';
jest.mock('next/navigation', () => ({ ...nav, usePathname: () => '/' }));

import AppShell from '@/components/AppShell';

test('tiene links de navegación visibles', () => {
  const { getAllByRole } = render(<AppShell><div>contenido</div></AppShell>);
  expect(getAllByRole('link', { name: /resumen/i }).length).toBeGreaterThan(0);
  expect(getAllByRole('link', { name: /transacciones/i })[0]).toBeInTheDocument();
  expect(getAllByRole('link', { name: /cuentas/i })[0]).toBeInTheDocument();
});
