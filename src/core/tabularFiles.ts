import { read, utils, write } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { TableFormat, TableSnapshot } from './types';

export type TabularFileType = 'csv' | 'xlsx';

export function readTabularWorkbook(data: Uint8Array, type: TabularFileType): WorkBook {
  return read(data, {
    type: 'array',
    raw: false,
    cellDates: false,
    dense: true,
    ...(type === 'csv' ? { codepage: 65001 } : {}),
  });
}

export function workbookRows(workbook: WorkBook, sheetName: string): string[][] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return [['']];
  }
  const rows = utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: true,
  });
  return rows.length > 0
    ? rows.map((row) => row.map((cell) => cell === null || cell === undefined ? '' : String(cell)))
    : [['']];
}

export function snapshotFromTabularRows(rows: string[][], format: TableFormat): TableSnapshot {
  const columnCount = Math.max(1, ...rows.map((row) => row.length));
  const normalizedRows = (rows.length > 0 ? rows : [['']]).map((row) => Array.from(
    { length: columnCount },
    (_, column) => (row[column] ?? '').replace(/\r\n|\r|\n/gu, ' '),
  ));
  return {
    rows: normalizedRows,
    alignments: Array.from({ length: columnCount }, () => 'none'),
    widths: Array.from({ length: columnCount }, () => 3),
    format: { ...format },
  };
}

export function writeTabularFile(snapshot: TableSnapshot, type: TabularFileType): Uint8Array {
  const sheet = utils.aoa_to_sheet(snapshot.rows);
  if (type === 'csv') {
    return new TextEncoder().encode(`\uFEFF${utils.sheet_to_csv(sheet)}`);
  }
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, 'Table');
  const output: unknown = write(workbook, { type: 'array', bookType: 'xlsx', compression: true });
  if (!(output instanceof ArrayBuffer)) {
    throw new TypeError('XLSX writer did not return an ArrayBuffer');
  }
  return new Uint8Array(output);
}
