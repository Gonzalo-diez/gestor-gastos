import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Stub liviano
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <svg data-testid="chart">{children}</svg>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
}));

import CashflowChart from '@/components/charts/CashflowChart';

test('renderiza el gráfico', () => {
  render(<CashflowChart data={[{ period: '2025-01', income: 1, expense: 1, net: 0 }]} />);
  expect(screen.getByTestId('chart')).toBeInTheDocument();
});
