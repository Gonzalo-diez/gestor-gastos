import dayjs from 'dayjs';
import customParse from 'dayjs/plugin/customParseFormat';
import { createHash } from 'crypto';
dayjs.extend(customParse);

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface ColumnMap {
  date: string;            // columna con fecha o literal "=2025-01-01"
  amount: string;          // columna con monto
  note?: string;           // columna nota
  category?: string;       // columna nombre categoría
  type?: string;           // columna tipo (INCOME/EXPENSE) o literal "=EXPENSE"
}

export interface MapOptions {
  defaults?: { type?: CategoryType };
}

export interface NormalizedRow {
  date?: Date;
  amount?: number;
  note?: string;
  categoryName?: string;
  categoryType?: CategoryType;
  dedupeHash?: string;
  error?: string;
  raw: Record<string, any>;
}

const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'YYYY/MM/DD'];

const val = (raw: any, key?: string) => {
  if (!key) return undefined;
  if (key.startsWith('=')) return key.slice(1); // literal
  return raw[key];
};

const parseAmount = (v: any): number | undefined => {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  // Elimina símbolos y espacios. Normaliza decimal.
  const cleaned = s.replace(/[^\d,.-]/g, '');
  // Si tiene ambos . y , asume el último como decimal
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) normalized = cleaned.replace(/\./g, '').replace(',', '.');
    else normalized = cleaned.replace(/,/g, '');
  } else if (lastComma > -1) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
};

const parseDate = (v: any): Date | undefined => {
  if (v instanceof Date && !isNaN(v.valueOf())) return v;
  const s = String(v ?? '').trim();
  for (const f of DATE_FORMATS) {
    const d = dayjs(s, f, true);
    if (d.isValid()) return d.toDate();
  }
  const d2 = dayjs(s);
  return d2.isValid() ? d2.toDate() : undefined;
};

export function mapRow(
  raw: Record<string, any>,
  map: ColumnMap,
  opts: MapOptions = {},
  userId?: string,
  accountId?: string,
): NormalizedRow {
  const dateStr = val(raw, map.date);
  const amtStr = val(raw, map.amount);
  const noteStr = val(raw, map.note);
  const catStr = val(raw, map.category);
  const typeStr = (val(raw, map.type) || opts.defaults?.type) as CategoryType | undefined;

  const date = parseDate(dateStr);
  const amount = parseAmount(amtStr);
  const categoryType = typeStr === 'INCOME' || typeStr === 'EXPENSE' ? typeStr : undefined;

  let error: string | undefined;
  if (!date) error = 'Fecha inválida';
  else if (amount === undefined) error = 'Monto inválido';

  const dedupe = !error && userId && accountId && date && typeof amount === 'number'
    ? createHash('sha256')
        .update([userId, accountId, date.toISOString(), amount.toString(), noteStr || ''].join('|'))
        .digest('hex')
    : undefined;

  return {
    raw,
    date,
    amount,
    note: typeof noteStr === 'string' ? noteStr : undefined,
    categoryName: typeof catStr === 'string' ? catStr : undefined,
    categoryType,
    dedupeHash: dedupe,
    error,
  };
}