"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RequireAuth from '@/components/RequireAuth';
import { api } from '@/app/lib/api';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list });

  // crear
  const [nName, setNName] = useState('');
  const [nType, setNType] = useState<'INCOME'|'EXPENSE'>('EXPENSE');
  const mCreate = useMutation({
    mutationFn: () => api.categories.create({ name: nName.trim(), type: nType }),
    onSuccess: () => { setNName(''); qc.invalidateQueries({ queryKey: ['categories'] }); }
  });

  // editar
  const [edit, setEdit] = useState<string | null>(null);
  const [eName, setEName] = useState(''); const [eType, setEType] = useState<'INCOME'|'EXPENSE'>('EXPENSE');
  const start = (c:any)=>{ setEdit(c.id); setEName(c.name); setEType(c.type); };
  const cancel = ()=>{ setEdit(null); setEName(''); };
  const mUpdate = useMutation({
    mutationFn: () => api.categories.update(edit!, { name: eName.trim(), type: eType }),
    onSuccess: () => { cancel(); qc.invalidateQueries({ queryKey: ['categories'] }); }
  });

  const mDelete = useMutation({
    mutationFn: (id:string)=> api.categories.remove(id),
    onSuccess: ()=> qc.invalidateQueries({ queryKey: ['categories'] })
  });

  return (
    <RequireAuth>
      <div className="p-4 grid gap-6">
        <h1 className="text-2xl font-semibold">Categorías</h1>

        <div className="border rounded-xl p-4 grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <input className="border p-2 rounded" placeholder="Nombre" value={nName} onChange={e=>setNName(e.target.value)} />
          <select className="border p-2 rounded" value={nType} onChange={e=>setNType(e.target.value as any)}>
            <option value="EXPENSE">Gasto</option><option value="INCOME">Ingreso</option>
          </select>
          <button className="border rounded px-4" onClick={()=>nName.trim() && mCreate.mutate()}>Crear</button>
        </div>

        <div className="overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-gray-100"><tr><th className="p-2 text-left">Nombre</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-right">Acciones</th></tr></thead>
            <tbody>
              {list.map((c:any)=>(
                <tr key={c.id} className="border-t">
                  <td className="p-2">{edit===c.id ? <input className="border p-1 rounded w-full" value={eName} onChange={e=>setEName(e.target.value)} /> : c.name}</td>
                  <td className="p-2">{edit===c.id ? (
                    <select className="border p-1 rounded" value={eType} onChange={e=>setEType(e.target.value as any)}>
                      <option value="EXPENSE">Gasto</option><option value="INCOME">Ingreso</option>
                    </select>
                  ) : (c.type==='INCOME'?'Ingreso':'Gasto')}</td>
                  <td className="p-2">
                    {edit===c.id ? (
                      <div className="flex justify-end gap-2">
                        <button className="border px-3 rounded" onClick={()=>mUpdate.mutate()} disabled={!eName.trim()}>Guardar</button>
                        <button className="border px-3 rounded" onClick={cancel}>Cancelar</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button className="border px-3 rounded" onClick={()=>start(c)}>Editar</button>
                        <button className="border px-3 rounded" onClick={()=>{ if(confirm('¿Eliminar?')) mDelete.mutate(c.id); }}>Eliminar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {list.length===0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500">Sin categorías</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAuth>
  );
}