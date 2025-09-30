import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';

type Range = { from?: string; to?: string };

export function useCashflow(range?: Range) {
  const params: Record<string, string> = {};
  if (range?.from) params.from = range.from;
  if (range?.to) params.to = range.to;

  return useQuery({
    queryKey: ['cashflow', range?.from ?? null, range?.to ?? null],
    queryFn: () => api.reports.cashflow(params), // nunca undefined
    staleTime: 60_000,
  });
}
