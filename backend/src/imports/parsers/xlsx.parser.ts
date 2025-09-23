import * as XLSX from 'xlsx';

export type ParsedRow = Record<string, any>;
export interface XlsxParsedFile { rows: ParsedRow[]; columns: string[]; worksheet: string }

export function parseXlsx(buffer: Buffer, worksheet?: string): XlsxParsedFile {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = worksheet || wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: null });
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  return { rows, columns, worksheet: sheetName };
}