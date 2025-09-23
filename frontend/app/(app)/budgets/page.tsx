"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RequireAuth from '@/components/RequireAuth';
import { api } from '@/app/lib/api';

export default function BudgetsPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0,7)); // YYYY-MM

  const { data: cats = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list });
  const { data: list = [] } = useQuery({ queryKey: ['budgets', period], queryFn: ()=>api.budgets.list({ period }) });

  // crear
  const [catId, setCatId] = useState(''); const [amount, setAmount] = useState<number>(0);
  const mCreate = useMutation({
    mutationFn: ()=> api.budgets.create({ categoryId: catId, period, amount: Number(amount) }),
    onSuccess: ()=> { setAmount(0); qc.invalidateQueries({ queryKey: ['budgets', period] }); }
  });

  // editar
  const [editId, setEditId] = useState<string|null>(null);
  const [eAmount, setEAmount] = useState<number>(0);
  const start = (b:any)=>{ setEditId(b.id); setEAmount(Number(b.amount)); };
  const cancel = ()=>{ setEditId(null); };
  const mUpdate = useMutation({
    mutationFn: ()=> api.budgets.update(editId!, { amount: Number(eAmount) }),
    onSuccess: ()=> { cancel(); qc.invalidateQueries({ queryKey: ['budgets', period] }); }
  });

  const mDelete = useMutation({
    mutationFn: (id:string)=> api.budgets.remove(id),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['budgets', period] })
  });

  return (
    <RequireAuth>
      <div className="p-4 grid gap-6">
        <h1 className="text-2xl font-semibold">Presupuestos</h1>

        <div className="flex gap-3 items-center">
          <label className="text-sm">Período</label>
          <input type="month" value={period} onChange={e=>setPeriod(e.target.value)} className="border p-2 rounded"/>
        </div>

        <div className="border rounded-xl p-4 grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <select className="border p-2 rounded" value={catId} onChange={e=>setCatId(e.target.value)}>
            <option value="">Seleccionar categoría</option>
            {cats.map((c:any)=><option key={c.id} value={c.id}>{c.name} — {c.type==='INCOME'?'Ingreso':'Gasto'}</option>)}
          </select>
          <input className="border p-2 rounded" type="number" step="0.01" placeholder="Monto" value={amount} onChange={e=>setAmount(Number(e.target.value))}/>
          <button className="border rounded px-4" onClick={()=>catId && amount>0 && mCreate.mutate()}>Crear</button>
        </div>

        <div className="overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100"><tr><th className="p-2 text-left">Categoría</th><th className="p-2 text-left">Período</th><th className="p-2 text-left">Monto</th><th className="p-2 text-right">Acciones</th></tr></thead>
            <tbody>
              {list.map((b:any)=>(
                <tr key={b.id} className="border-t">
                  <td className="p-2">{b.category?.name ?? ''}</td>
                  <td className="p-2">{b.period}</td>
                  <td className="p-2">
                    {editId===b.id ? (
                      <input className="border p-1 rounded" type="number" step="0.01" value={eAmount} onChange={e=>setEAmount(Number(e.target.value))}/>
                    ) : Number(b.amount)}
                  </td>
                  <td className="p-2">
                    {editId===b.id ? (
                      <div className="flex justify-end gap-2">
                        <button className="border px-3 rounded" onClick={()=>mUpdate.mutate()}>Guardar</button>
                        <button className="border px-3 rounded" onClick={cancel}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button className="border px-3 rounded" onClick={()=>start(b)}>Editar</button>
                        <button className="border px-3 rounded" onClick={()=>{ if(confirm('¿Eliminar?')) mDelete.mutate(b.id); }}>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {list.length===0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Sin presupuestos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAuth>
  );
}