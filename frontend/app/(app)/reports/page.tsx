"use client";
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import RequireAuth from '@/components/RequireAuth';
import dynamic from 'next/dynamic';

const CashflowChart = dynamic(() => import('@/components/charts/CashflowChart'), { ssr: false });

export default function Reports() {
  const [from, setFrom] = useState('2025-08-01');
  const [to, setTo] = useState('2025-08-31');

  const { data: cf, isLoading, error } = useQuery({
    queryKey: ['cashflow', from, to],
    queryFn: () => api.reports.cashflow({ from, to, groupBy: 'DAY', fillEmpty: true }),
  });

  const series = useMemo(() => cf?.series ?? [], [cf]);

  return (
    <RequireAuth>
      <div className="p-4 grid gap-4">
        <div className="flex gap-2">
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border p-1" />
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border p-1" />
        </div>

        {error ? <p className="text-red-600 text-sm">Error al cargar</p>
               : isLoading ? <p>Cargando…</p>
               : <CashflowChart data={series} />}
      </div>
    </RequireAuth>
  );
}