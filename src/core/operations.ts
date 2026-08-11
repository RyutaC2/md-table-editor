import type { Alignment, TableOperation, TableSnapshot } from './types';
import { displayWidth } from './width';

export function cloneSnapshot(snapshot: TableSnapshot): TableSnapshot {
  return {
    rows: snapshot.rows.map((row) => [...row]),
    alignments: [...snapshot.alignments],
    widths: [...snapshot.widths],
    format: { ...snapshot.format },
  };
}

function normalize(snapshot: TableSnapshot): TableSnapshot {
  const columnCount = snapshot.rows.reduce((maximum, row) => Math.max(maximum, row.length), Math.max(1, snapshot.widths.length));
  if (snapshot.rows.length === 0) {
    snapshot.rows.push(Array.from({ length: columnCount }, () => ''));
  }
  snapshot.rows.forEach((row) => {
    while (row.length < columnCount) {
      row.push('');
    }
    row.length = columnCount;
  });
  while (snapshot.widths.length < columnCount) {
    snapshot.widths.push(3);
  }
  while (snapshot.alignments.length < columnCount) {
    snapshot.alignments.push('none');
  }
  snapshot.widths.length = columnCount;
  snapshot.alignments.length = columnCount;
  return snapshot;
}

function orderedIndexes(indexes: number[], limit: number): number[] {
  return [...new Set(indexes.filter((index) => Number.isInteger(index) && index >= 0 && index < limit))].sort((a, b) => a - b);
}

function moveItems<T>(items: T[], indexes: number[], target: number): T[] {
  const selected = orderedIndexes(indexes, items.length);
  if (selected.length === 0) {
    return items;
  }
  const selectedSet = new Set(selected);
  const moved = selected.map((index) => items[index]);
  const remaining = items.filter((_, index) => !selectedSet.has(index));
  const safeTarget = Number.isFinite(target) ? Math.floor(target) : items.length;
  const removedBeforeTarget = selected.filter((index) => index < safeTarget).length;
  const insertion = Math.max(0, Math.min(remaining.length, safeTarget - removedBeforeTarget));
  remaining.splice(insertion, 0, ...moved);
  return remaining;
}

function finiteInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function maximumColumnWidth(snapshot: TableSnapshot, column: number): number {
  return snapshot.rows.reduce((maximum, row) => Math.max(maximum, displayWidth(row[column] ?? '')), 3);
}

function plainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[*_~`]/gu, '')
    .replace(/\\\|/gu, '|')
    .trim();
}

function sortRows(snapshot: TableSnapshot, column: number, direction: 'ascending' | 'descending'): void {
  if (column < 0 || column >= snapshot.widths.length || snapshot.rows.length <= 2) {
    return;
  }
  const body = snapshot.rows.slice(1).map((row, index) => ({ row, index, value: plainText(row[column] ?? '') }));
  const nonEmpty = body.filter(({ value }) => value !== '');
  const numeric = nonEmpty.length > 0 && nonEmpty.every(({ value }) => Number.isFinite(Number(value)));
  const collator = new Intl.Collator(undefined, { numeric: false, sensitivity: 'base' });
  body.sort((left, right) => {
    if (left.value === '' || right.value === '') {
      return left.value === right.value ? left.index - right.index : left.value === '' ? 1 : -1;
    }
    const compared = numeric
      ? Number(left.value) - Number(right.value)
      : collator.compare(left.value, right.value);
    return (direction === 'ascending' ? compared : -compared) || left.index - right.index;
  });
  snapshot.rows.splice(1, snapshot.rows.length - 1, ...body.map(({ row }) => row));
}

export function applyOperation(current: TableSnapshot, operation: TableOperation): TableSnapshot {
  if (operation.type === 'replace') {
    return normalize(cloneSnapshot(operation.snapshot));
  }
  const snapshot = normalize(cloneSnapshot(current));
  const columns = snapshot.widths.length;

  switch (operation.type) {
    case 'setCells':
      for (const change of operation.changes) {
        if (change.row >= 0 && change.row < snapshot.rows.length && change.column >= 0 && change.column < columns) {
          snapshot.rows[change.row][change.column] = change.value.replace(/\r\n|\r|\n/gu, ' ');
        }
      }
      break;
    case 'insertRow': {
      const count = Math.max(1, finiteInteger(operation.count ?? 1, 1));
      const index = Math.max(1, Math.min(snapshot.rows.length, finiteInteger(operation.index, snapshot.rows.length)));
      snapshot.rows.splice(index, 0, ...Array.from({ length: count }, () => Array.from({ length: columns }, () => '')));
      break;
    }
    case 'deleteRows': {
      const indexes = orderedIndexes(operation.indexes, snapshot.rows.length).filter((index) => index !== 0);
      for (const index of indexes.reverse()) {
        snapshot.rows.splice(index, 1);
      }
      break;
    }
    case 'moveRows': {
      const indexes = operation.indexes.filter((index) => index > 0);
      const header = snapshot.rows[0];
      snapshot.rows = [header, ...moveItems(snapshot.rows.slice(1), indexes.map((index) => index - 1), operation.target - 1)];
      break;
    }
    case 'insertColumn': {
      const count = Math.max(1, finiteInteger(operation.count ?? 1, 1));
      const index = Math.max(0, Math.min(columns, finiteInteger(operation.index, columns)));
      snapshot.rows.forEach((row) => row.splice(index, 0, ...Array.from({ length: count }, () => '')));
      snapshot.widths.splice(index, 0, ...Array.from({ length: count }, () => 3));
      snapshot.alignments.splice(index, 0, ...Array.from({ length: count }, () => 'none' as Alignment));
      break;
    }
    case 'deleteColumns': {
      const indexes = orderedIndexes(operation.indexes, columns);
      if (indexes.length >= columns) {
        indexes.pop();
      }
      for (const index of indexes.reverse()) {
        snapshot.rows.forEach((row) => row.splice(index, 1));
        snapshot.widths.splice(index, 1);
        snapshot.alignments.splice(index, 1);
      }
      break;
    }
    case 'moveColumns':
      snapshot.rows = snapshot.rows.map((row) => moveItems(row, operation.indexes, operation.target));
      snapshot.widths = moveItems(snapshot.widths, operation.indexes, operation.target);
      snapshot.alignments = moveItems(snapshot.alignments, operation.indexes, operation.target);
      break;
    case 'setAlignment':
      if (operation.column >= 0 && operation.column < columns) {
        snapshot.alignments[operation.column] = operation.alignment;
      }
      break;
    case 'setWidth':
      if (operation.column >= 0 && operation.column < columns && Number.isFinite(operation.width)) {
        snapshot.widths[operation.column] = Math.max(3, Math.floor(operation.width));
      }
      break;
    case 'autoFitColumn':
      if (operation.column >= 0 && operation.column < columns) {
        snapshot.widths[operation.column] = maximumColumnWidth(snapshot, operation.column);
      }
      break;
    case 'autoFit':
      snapshot.widths = snapshot.widths.map((_, column) => maximumColumnWidth(snapshot, column));
      break;
    case 'sort':
      sortRows(snapshot, operation.column, operation.direction);
      break;
  }
  return normalize(snapshot);
}
