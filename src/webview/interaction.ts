import type { Alignment } from '../core/types';

interface Point {
  x: number;
  y: number;
}

interface ScrollPosition {
  left: number;
  top: number;
}

export interface GridMovement {
  row: number;
  column: number;
}

interface SelectionModifiers {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

type VisibleAlignment = Exclude<Alignment, 'none'>;

export function editCommitMovement(key: 'Enter' | 'Tab', shiftKey: boolean): GridMovement {
  if (key === 'Enter') {
    return { row: shiftKey ? -1 : 1, column: 0 };
  }
  return { row: 0, column: shiftKey ? -1 : 1 };
}

export function nextTabCell(
  cell: { row: number; column: number },
  rowCount: number,
  columnCount: number,
  shiftKey: boolean,
): { row: number; column: number } {
  const lastRow = Math.max(0, rowCount - 1);
  const lastColumn = Math.max(0, columnCount - 1);
  const current = {
    row: Math.min(Math.max(cell.row, 0), lastRow),
    column: Math.min(Math.max(cell.column, 0), lastColumn),
  };
  if (shiftKey) {
    return { row: current.row, column: Math.max(0, current.column - 1) };
  }
  if (current.column < lastColumn) {
    return { row: current.row, column: current.column + 1 };
  }
  if (current.row < lastRow) {
    return { row: current.row + 1, column: 0 };
  }
  return current;
}

export function shouldAutoEditCell(modifiers: SelectionModifiers, dragged: boolean): boolean {
  return !dragged && !modifiers.shiftKey && !modifiers.ctrlKey && !modifiers.metaKey;
}

export function visibleCellAlignment(alignment: Alignment): VisibleAlignment {
  return alignment === 'none' ? 'left' : alignment;
}

export function hasExceededDragThreshold(start: Point, current: Point, threshold: number): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold;
}

export function scrollPositionForPan(
  initial: ScrollPosition,
  start: Point,
  current: Point,
): ScrollPosition {
  return {
    left: initial.left - (current.x - start.x),
    top: initial.top - (current.y - start.y),
  };
}
