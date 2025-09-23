"use client";

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/app/lib/api';
import RequireAuth from '@/components/RequireAuth';
import dynamic from 'next/dynamic';

const CashflowChart = dynamic(() => import('@/components/charts/CashflowChart'), { ssr: false });

const fmt = (d: Date) => d.toISOString().slice(0, 10);

export default function Home() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const [from, setFrom] = useState(fmt(start));
  const [to, setTo] = useState(fmt(now));

  const { data: summary } = useQuery({
    queryKey: ['summary', from, to],
    queryFn: () => api.reports.summary({ from, to }),
  });

  const { data: cf } = useQuery({
    queryKey: ['cashflow-home', from, to],
    queryFn: () => api.reports.cashflow({ from, to, groupBy: 'DAY', fillEmpty: true }),
  });

  const series = useMemo(() => cf?.series ?? [], [cf]);

  return (
    <RequireAuth>
      <div className="p-4 grid gap-6">
        <div className="flex gap-3">
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border p-2" />
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border p-2" />
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-xl">{summary?.totals?.income ?? 0}</p>
          </div>
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Gastos</p>
            <p className="text-xl">{summary?.totals?.expense ?? 0}</p>
          </div>
          <div className="border rounded-xl p-4">
            <p className="text-sm text-gray-500">Neto</p>
            <p className="text-xl">{(summary?.totals?.income ?? 0) - (summary?.totals?.expense ?? 0)}</p>
          </div>
        </section>

        <section>
          <CashflowChart data={series} />
        </section>
      </div>
    </RequireAuth>
  );
}