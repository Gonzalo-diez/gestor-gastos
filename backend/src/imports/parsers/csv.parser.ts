import { parse } from 'csv-parse/sync';

export type ParsedRow = Record<string, any>;
export interface CsvParsedFile { rows: ParsedRow[]; columns: string[]; delimiter: string }

const guessDelimiter = (buf: Buffer) => {
  const s = buf.toString('utf8').split(/\r?\n/).slice(0, 5).join('\n');
  if ((s.match(/;/g) || []).length > (s.match(/,/g) || []).length) return ';';
  if (s.includes('\t')) return '\t';
  if (s.includes('|')) return '|';
  return ',';
};

export function parseCsv(buffer: Buffer, delimiter?: string): CsvParsedFile {
  const delim = delimiter || guessDelimiter(buffer);
  const records = parse(buffer, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    delimiter: delim,
    trim: true,
  }) as ParsedRow[];
  const columns = records[0] ? Object.keys(records[0]) : [];
  return { rows: records, columns, delimiter: delim };
}