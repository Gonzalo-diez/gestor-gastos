"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RequireAuth from '@/components/RequireAuth';
import { api } from '@/app/lib/api';

export default function AccountsPage() {
  const qc = useQueryClient();
  const { data: accounts = [] }   = useQuery({ queryKey: ['accounts'],   queryFn: api.accounts.list });
  const { data: currencies = [] } = useQuery({ queryKey: ['currencies'], queryFn: api.currencies.list });

  // crear
  const [nName, setNName] = useState('');
  const [nCcy, setNCcy]   = useState('ARS');
  const mCreate = useMutation({
    mutationFn: () => api.accounts.create({ name: nName, currencyCode: nCcy }),
    onSuccess: () => { setNName(''); qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });

  // editar
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName]   = useState('');
  const [eCcy, setECcy]     = useState('ARS');
  const startEdit = (a: any) => { setEditId(a.id); setEName(a.name); setECcy(a.currency?.code ?? a.currencyCode); };
  const cancelEdit = () => { setEditId(null); setEName(''); };
  const mUpdate = useMutation({
    mutationFn: () => api.accounts.update(editId!, { name: eName, currencyCode: eCcy }),
    onSuccess: () => { cancelEdit(); qc.invalidateQueries({ queryKey: ['accounts'] }); },
  });

  // eliminar
  const mDelete = useMutation({
    mutationFn: (id: string) => api.accounts.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  return (
    <RequireAuth>
      <div className="p-4 grid gap-6">
        <h1 className="text-2xl font-semibold">Cuentas</h1>

        {/* Crear */}
        <div className="border rounded-xl p-4 grid gap-3 sm:grid-cols-2 md:grid-cols-[1fr_200px_auto]">
          <input
            placeholder="Nombre de la cuenta"
            value={nName}
            onChange={e=>setNName(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <select value={nCcy} onChange={e=>setNCcy(e.target.value)} className="border p-2 rounded w-full">
            {currencies.map((c:any)=>(
              <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
            ))}
          </select>
          <button
            className="border rounded px-4 py-2 sm:col-span-2 md:col-span-1"
            onClick={()=>mCreate.mutate()}
            disabled={!nName || !nCcy}
          >
            Crear
          </button>
        </div>

        {/* Lista (móvil: tarjetas) */}
        <div className="grid gap-3 md:hidden">
          {accounts.map((a:any)=>(
            <div key={a.id} className="border rounded-xl p-3 grid gap-2">
              {editId === a.id ? (
                <>
                  <input className="border p-2 rounded w-full" value={eName} onChange={e=>setEName(e.target.value)} />
                  <select className="border p-2 rounded w-full" value={eCcy} onChange={e=>setECcy(e.target.value)}>
                    {currencies.map((c:any)=>(<option key={c.code} value={c.code}>{c.code} — {c.name}</option>))}
                  </select>
                  <div className="text-xs text-gray-600 break-all font-mono">ID: {a.id}</div>
                  <div className="flex gap-2 justify-end">
                    <button className="border px-3 py-1 rounded" onClick={()=>mUpdate.mutate()} disabled={!eName}>Guardar</button>
                    <button className="border px-3 py-1 rounded" onClick={cancelEdit}>Cancelar</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-sm text-gray-600">{a.currency?.code ?? a.currencyCode}</div>
                  <div className="text-xs text-gray-600 break-all font-mono">ID: {a.id}</div>
                  <div className="flex gap-2 justify-end">
                    <button className="border px-3 py-1 rounded" onClick={()=>startEdit(a)}>Editar</button>
                    <button
                      className="border px-3 py-1 rounded"
                      onClick={()=>{ if (confirm('¿Eliminar cuenta?')) mDelete.mutate(a.id); }}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {accounts.length===0 && <div className="text-center text-gray-500 py-6">Sin cuentas</div>}
        </div>

        {/* Lista (≥md: tabla) */}
        <div className="hidden md:block overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Moneda</th>
                <th className="text-left p-2">ID</th>
                <th className="text-right p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a:any)=>(
                <tr key={a.id} className="border-t">
                  <td className="p-2">
                    {editId === a.id ? (
                      <input className="border p-1 rounded w-full" value={eName} onChange={e=>setEName(e.target.value)} />
                    ) : a.name}
                  </td>
                  <td className="p-2">
                    {editId === a.id ? (
                      <select className="border p-1 rounded" value={eCcy} onChange={e=>setECcy(e.target.value)}>
                        {currencies.map((c:any)=>(<option key={c.code} value={c.code}>{c.code} — {c.name}</option>))}
                      </select>
                    ) : (a.currency?.code ?? a.currencyCode)}
                  </td>
                  <td className="p-2 font-mono text-xs break-all">{a.id}</td>
                  <td className="p-2">
                    {editId === a.id ? (
                      <div className="flex justify-end gap-2">
                        <button className="border px-3 rounded" onClick={()=>mUpdate.mutate()} disabled={!eName}>Guardar</button>
                        <button className="border px-3 rounded" onClick={cancelEdit}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button className="border px-3 rounded" onClick={()=>startEdit(a)}>Editar</button>
                        <button className="border px-3 rounded" onClick={()=>{ if (confirm('¿Eliminar cuenta?')) mDelete.mutate(a.id); }}>
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {accounts.length===0 && (
                <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sin cuentas</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAuth>
  );
}
