import type { TableSnapshot } from '../core/types';
import type { CellPosition } from '../shared/protocol';

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export function clampCell(cell: CellPosition, snapshot: TableSnapshot): CellPosition {
  return {
    row: Math.max(0, Math.min(snapshot.rows.length - 1, cell.row)),
    column: Math.max(0, Math.min(snapshot.widths.length - 1, cell.column)),
  };
}

export function rangeBounds(range: SelectionRange): { top: number; bottom: number; left: number; right: number } {
  return {
    top: Math.min(range.start.row, range.end.row),
    bottom: Math.max(range.start.row, range.end.row),
    left: Math.min(range.start.column, range.end.column),
    right: Math.max(range.start.column, range.end.column),
  };
}

export function isCellSelected(range: SelectionRange, row: number, column: number): boolean {
  const bounds = rangeBounds(range);
  return row >= bounds.top && row <= bounds.bottom && column >= bounds.left && column <= bounds.right;
}

export function columnName(index: number): string {
  let value = index + 1;
  let name = '';
  while (value > 0) {
    value -= 1;
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26);
  }
  return name;
}

export function contiguous(indexes: number[]): boolean {
  const sorted = [...indexes].sort((left, right) => left - right);
  return sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1);
}

export function usefulMove(indexes: number[], target: number): boolean {
  if (indexes.length === 0) {
    return false;
  }
  const first = Math.min(...indexes);
  const last = Math.max(...indexes);
  return target < first || target > last + 1;
}

export function parseTsv(value: string): string[][] {
  const normalized = value.replace(/\r\n|\r/gu, '\n').replace(/\n$/u, '');
  return normalized.split('\n').map((row) => row.split('\t').map((cell) => cell.replace(/\n/gu, ' ')));
}
