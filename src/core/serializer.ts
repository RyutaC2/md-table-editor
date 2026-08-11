import type { Alignment, TableSnapshot } from './types';
import { displayWidth, padToDisplayWidth } from './width';

export function escapeCell(value: string): string {
  const singleLine = value.replace(/\r\n|\r|\n/gu, ' ');
  let escaped = '';
  for (let index = 0; index < singleLine.length; index += 1) {
    if (singleLine[index] === '|') {
      let slashes = 0;
      for (let cursor = index - 1; cursor >= 0 && singleLine[cursor] === '\\'; cursor -= 1) {
        slashes += 1;
      }
      if (slashes % 2 === 0) {
        escaped += '\\';
      }
    }
    escaped += singleLine[index];
  }
  return escaped;
}

function delimiter(width: number, alignment: Alignment): string {
  const hyphens = '-'.repeat(Math.max(3, Math.floor(width)));
  if (alignment === 'center') {
    return `:${hyphens}:`;
  }
  if (alignment === 'left') {
    return `:${hyphens}`;
  }
  if (alignment === 'right') {
    return `${hyphens}:`;
  }
  return hyphens;
}

function renderRow(cells: string[], widths: number[], leading: boolean, trailing: boolean, padded: boolean): string {
  const rendered = widths.map((width, index) => {
    const value = escapeCell(cells[index] ?? '');
    return padded ? ` ${padToDisplayWidth(value, width)} ` : value;
  }).join('|');
  return `${leading ? '|' : ''}${rendered}${trailing ? '|' : ''}`;
}

export function serializeTable(snapshot: TableSnapshot): string {
  const columnCount = snapshot.rows.reduce((maximum, row) => Math.max(maximum, row.length), Math.max(1, snapshot.widths.length));
  const rows = snapshot.rows.length > 0 ? snapshot.rows : [Array.from({ length: columnCount }, () => '')];
  const widths = Array.from({ length: columnCount }, (_, index) => Math.max(3, snapshot.widths[index] ?? 3));
  const alignments = Array.from({ length: columnCount }, (_, index) => snapshot.alignments[index] ?? 'none');
  const delimiterCells = widths.map((width, index) => delimiter(width, alignments[index]));
  const output = [
    renderRow(rows[0], widths, snapshot.format.leadingPipe, snapshot.format.trailingPipe, snapshot.format.padded),
    renderRow(delimiterCells, delimiterCells.map(displayWidth), snapshot.format.leadingPipe, snapshot.format.trailingPipe, snapshot.format.padded),
    ...rows.slice(1).map((row) => renderRow(row, widths, snapshot.format.leadingPipe, snapshot.format.trailingPipe, snapshot.format.padded)),
  ];
  return output.join(snapshot.format.eol);
}

export function createTableMarkdown(columns: number, visibleRows: number, eol: '\n' | '\r\n' | '\r' = '\n'): string {
  const columnCount = Math.min(8, Math.max(1, Math.floor(columns)));
  const rowCount = Math.min(8, Math.max(1, Math.floor(visibleRows)));
  return serializeTable({
    rows: Array.from({ length: rowCount }, () => Array.from({ length: columnCount }, () => '')),
    alignments: Array.from({ length: columnCount }, () => 'none' as const),
    widths: Array.from({ length: columnCount }, () => 3),
    format: { leadingPipe: true, trailingPipe: true, padded: true, eol },
  });
}
