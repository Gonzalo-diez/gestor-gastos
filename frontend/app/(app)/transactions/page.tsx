"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RequireAuth from '@/components/RequireAuth';
import { api } from '@/app/lib/api';

type TType = 'EXPENSE' | 'INCOME' | '';

const fmtMoney = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-AR');

export default function TransactionsPage() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(start.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<TType>('');
  const [search, setSearch] = useState('');

  const qc = useQueryClient();

  const { data: accounts = [] }   = useQuery({ queryKey: ['accounts'],   queryFn: api.accounts.list });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list });

const { data, isLoading } = useQuery({
  queryKey: ['transactions', from, to, accountId, categoryId, type, search],
  queryFn: () => api.transactions.list({ from, to, ...(accountId?{accountId}:{}) , ...(categoryId?{categoryId}:{}) , ...(type?{type}:{}) , ...(search?{q:search}:{}) }),
});

const txs = useMemo<any[]>(() => Array.isArray(data) ? data : (data?.items ?? []), [data]);

const totals = useMemo(() => {
  let income = 0, expense = 0;
  for (const t of txs) {
    const n = Number(t.amount ?? 0);
    if ((t.category?.type ?? '').toUpperCase() === 'INCOME') income += n;
    else expense += n;
  }
  return { income, expense, net: income - expense };
}, [txs]);

  function reset() { setAccountId(''); setCategoryId(''); setType(''); setSearch(''); }

  const accName = (id?: string) => accounts.find((a: any) => a.id === id)?.name ?? id ?? '';
  const catName = (id?: string) => categories.find((c: any) => c.id === id)?.name ?? id ?? '';

  // ---- Crear transacción ----
  const [tAcc, setTAcc] = useState('');
  const [tCat, setTCat] = useState('');
  const [tDate, setTDate] = useState(new Date().toISOString().slice(0,10));
  const [tAmount, setTAmount] = useState<number>(0);
  const [tNote, setTNote] = useState('');
  const mCreateTx = useMutation({
    mutationFn: () => api.transactions.create({
      accountId: tAcc, categoryId: tCat, date: tDate, amount: Number(tAmount), note: tNote || undefined,
    }),
    onSuccess: () => { setTAmount(0); setTNote(''); qc.invalidateQueries({ queryKey: ['transactions'] }); },
  });

  // ---- Editar / eliminar por fila ----
  const [rowEdit, setRowEdit] = useState<string|null>(null);
  const [rAmount, setRAmount] = useState<number>(0);
  const [rNote, setRNote] = useState('');
  const startRow = (t:any) => { setRowEdit(t.id); setRAmount(Number(t.amount ?? 0)); setRNote(t.note ?? ''); };
  const cancelRow = () => { setRowEdit(null); };

  const mUpdateTx = useMutation({
    mutationFn: () => api.transactions.update(rowEdit!, { amount: Number(rAmount), note: rNote }),
    onSuccess: () => { cancelRow(); qc.invalidateQueries({ queryKey: ['transactions'] }); },
  });
  const mDeleteTx = useMutation({
    mutationFn: (id:string) => api.transactions.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });

  return (
    <RequireAuth>
      <div className="p-4 grid gap-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Transacciones</h1>
          <Link href="/transactions/imports" className="underline">Importar</Link>
        </header>

        {/* Filtros */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="border p-2 rounded" />
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="border p-2 rounded" />
          <select value={accountId} onChange={e=>setAccountId(e.target.value)} className="border p-2 rounded">
            <option value="">Todas las cuentas</option>
            {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="border p-2 rounded">
            <option value="">Todas las categorías</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={type} onChange={e=>setType(e.target.value as TType)} className="border p-2 rounded">
            <option value="">Todos los tipos</option>
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
          </select>
          <div className="flex gap-2">
            <input placeholder="Buscar nota..." value={search} onChange={e=>setSearch(e.target.value)} className="border p-2 rounded w-full" />
            <button onClick={reset} className="border px-3 rounded">Limpiar</button>
          </div>
        </div>

        {/* Crear */}
        <div className="border rounded-xl p-4 grid gap-3 md:grid-cols-5">
          <select className="border p-2 rounded" value={tAcc} onChange={e=>setTAcc(e.target.value)}>
            <option value="">Cuenta</option>{accounts.map((a:any)=>(<option key={a.id} value={a.id}>{a.name}</option>))}
          </select>
          <select className="border p-2 rounded" value={tCat} onChange={e=>setTCat(e.target.value)}>
            <option value="">Categoría</option>{categories.map((c:any)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <input type="date" className="border p-2 rounded" value={tDate} onChange={e=>setTDate(e.target.value)}/>
          <input type="number" step="0.01" className="border p-2 rounded" placeholder="Monto" value={tAmount} onChange={e=>setTAmount(Number(e.target.value))}/>
          <div className="flex gap-2">
            <input className="border p-2 rounded w-full" placeholder="Nota" value={tNote} onChange={e=>setTNote(e.target.value)}/>
            <button
              className="border rounded px-4"
              onClick={()=> tAcc && tCat && tAmount !== 0 && mCreateTx.mutate()}
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Totales */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4"><p className="text-sm text-gray-500">Ingresos</p><p className="text-xl">{fmtMoney.format(totals.income)}</p></div>
          <div className="border rounded-xl p-4"><p className="text-sm text-gray-500">Gastos</p><p className="text-xl">{fmtMoney.format(totals.expense)}</p></div>
          <div className="border rounded-xl p-4"><p className="text-sm text-gray-500">Neto</p><p className="text-xl">{fmtMoney.format(totals.net)}</p></div>
        </section>

        {/* Tabla */}
        <section className="overflow-auto border rounded-xl">
          {isLoading ? (
            <div className="p-4">Cargando…</div>
          ) : (
            <table className="w-full text-sm rt-table">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Cuenta</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-left p-2">Nota</th>
                  <th className="text-right p-2">Monto</th>
                  <th className="text-right p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t: any) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-2" data-label="Fecha">{fmtDate(t.date)}</td>
                    <td className="p-2" data-label="Cuenta">{t.account?.name ?? accName(t.accountId)}</td>
                    <td className="p-2" data-label="Categoria">{t.category?.name ?? catName(t.categoryId)}</td>
                    <td className="p-2" data-label="Nota">
                      {rowEdit===t.id ? (
                        <input className="border p-1 rounded w-full" value={rNote} onChange={e=>setRNote(e.target.value)} />
                      ) : (t.note ?? '')}
                    </td>
                    <td className="p-2 text-right" data-label="Monto">
                      {rowEdit===t.id ? (
                        <input
                          type="number" step="0.01"
                          className="border p-1 rounded w-24 text-right"
                          value={rAmount} onChange={e=>setRAmount(Number(e.target.value))}
                        />
                      ) : fmtMoney.format(Number(t.amount ?? 0))}
                    </td>
                    <td className="p-2 text-right" data-label="Acciones">
                      {rowEdit===t.id ? (
                        <div className="flex justify-end gap-2">
                          <button className="border px-3 rounded" onClick={()=>mUpdateTx.mutate()}>Guardar</button>
                          <button className="border px-3 rounded" onClick={cancelRow}>Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button className="border px-3 rounded" onClick={()=>startRow(t)}>Editar</button>
                          <button
                            className="border px-3 rounded"
                            onClick={()=>{ if (confirm('¿Eliminar transacción?')) mDeleteTx.mutate(t.id); }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {txs.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">Sin transacciones</td></tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </RequireAuth>
  );
}