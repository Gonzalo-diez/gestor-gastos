"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import RequireAuth from '@/components/RequireAuth';
import { api } from '@/app/lib/api';

type PreviewResp = {
  batchId: string;
  columns: string[];
  sample: Record<string, string>[];
  detected?: { delimiter?: string; worksheet?: string };
};

export default function ImportsPage() {
  const { data: accounts = [] } = useQuery({ queryKey: ['accounts'], queryFn: api.accounts.list });

  const [file, setFile] = useState<File | null>(null);
  const [accountId, setAccountId] = useState('');
  const [preview, setPreview] = useState<PreviewResp | null>(null);

  // mapeo de columnas del archivo -> campos internos
  const [mapDate, setMapDate] = useState<string>('Fecha');
  const [mapAmount, setMapAmount] = useState<string>('Monto');
  const [mapNote, setMapNote] = useState<string>('Detalle');
  const [mapCategory, setMapCategory] = useState<string>('Categoria');
  const [mapType, setMapType] = useState<string>('Tipo');

  const cols = preview?.columns ?? [];
  const canConfirm = !!preview && !!accountId;

  const guessed = useMemo(() => {
    // autoguess simple si las columnas no coinciden
    const norm = (s: string) => s.toLowerCase().trim();
    const by = (names: string[]) => cols.find(c => names.includes(norm(c)));
    return {
      date: by(['fecha','date']) ?? mapDate,
      amount: by(['monto','amount','importe']) ?? mapAmount,
      note: by(['detalle','nota','description','concepto']) ?? mapNote,
      category: by(['categoria','categoría','category']) ?? mapCategory,
      type: by(['tipo','type']) ?? mapType,
    };
  }, [cols, mapAmount, mapCategory, mapDate, mapNote, mapType]);

  async function doPreview() {
    if (!file) return;
    const r = await api.imports.preview(file);
    setPreview(r);
    // si detectamos columnas nuevas, aplicamos sugerencias
    if (r.columns?.length) {
      setMapDate(guessed.date);
      setMapAmount(guessed.amount);
      setMapNote(guessed.note);
      setMapCategory(guessed.category);
      setMapType(guessed.type);
    }
  }

  async function doConfirm() {
    if (!canConfirm || !preview) return;
    const columnMap = {
      date: mapDate,
      amount: mapAmount,
      note: mapNote,
      category: mapCategory,
      type: mapType,
    };
    const res = await api.imports.confirm({
      batchId: preview.batchId,
      accountId,
      columnMap,
      createMissingCategories: true,
    });
    alert(`Importadas: ${res.created}\nCon error: ${res.errors}`);
    setPreview(null);
    setFile(null);
  }

  return (
    <RequireAuth>
      <div className="p-4 grid gap-6">
        <h1 className="text-2xl font-semibold">Importar movimientos</h1>

        {/* Paso 1: elegir cuenta y archivo */}
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="border p-2 rounded"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
          >
            <option value="">Seleccioná una cuenta…</option>
            {accounts.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name} {a.currency?.code ? `(${a.currency.code})` : ''}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="border p-2 rounded"
          />

          <div className="flex gap-2">
            <button
              className="border rounded px-4"
              onClick={doPreview}
              disabled={!file}
            >
              Preview
            </button>
            <button
              className="border rounded px-4"
              onClick={doConfirm}
              disabled={!canConfirm}
            >
              Confirmar
            </button>
          </div>
        </div>

        {/* Paso 2: mapeo de columnas */}
        {preview && (
          <div className="grid gap-4">
            <h2 className="text-lg font-medium">Mapeo de columnas</h2>

            <div className="text-sm text-gray-600">
              Detectado: {preview.detected?.delimiter ? `delimiter "${preview.detected.delimiter}"` : ''}
              {preview.detected?.worksheet ? ` • hoja "${preview.detected.worksheet}"` : ''}
            </div>

            <div className="overflow-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>{cols.map(c => <th key={c} className="p-2 text-left">{c}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.sample.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-t">
                      {cols.map(c => <td key={c} className="p-2">{row[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

function SelectCol({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-gray-600">{label}</span>
      <select className="border p-2 rounded" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
