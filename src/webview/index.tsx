import MarkdownIt from 'markdown-it';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useVirtualizer } from '@tanstack/react-virtual';
import { applyOperation, cloneSnapshot } from '../core/operations';
import type { Alignment, CellRangeBounds, TableOperation, TableSnapshot } from '../core/types';
import type { CellPosition, EditorState, ExtensionMessage, PersistedPanelState, WebviewMessage } from '../shared/protocol';
import { Icon } from './icons';
import type { IconName } from './icons';
import {
  characterWidth,
  axisSelectionRange,
  clampCell,
  columnName,
  columnPixelWidth,
  contiguous,
  estimatedBodyRowHeight,
  isCellSelected,
  nearestBoundedIndex,
  parseTsv,
  rangeSelectsWholeAxis,
  rangeBounds,
  usefulMove,
} from './gridModel';
import type { SelectionRange } from './gridModel';
import type { GridAxis } from './gridModel';
import { hasExceededDragThreshold, scrollPositionForPan, visibleCellAlignment } from './interaction';
import './styles.css';

interface VSCodeApi {
  postMessage(message: WebviewMessage): void;
  getState(): PersistedPanelState | undefined;
  setState(state: PersistedPanelState): void;
}

interface EditingCell {
  cell: CellPosition;
  value: string;
  original: string;
}

interface DropTarget {
  axis: 'column' | 'row';
  index: number;
  side: 'before' | 'after';
}

interface CellSelectionGesture {
  pointerId: number;
  startX: number;
  startY: number;
  anchor: CellPosition;
}

interface PanGesture {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
}

interface HeaderSelectionGesture {
  pointerId: number;
  axis: GridAxis;
  anchor: number;
  additive: boolean;
}

interface CellMoveGesture {
  pointerId: number;
  startX: number;
  startY: number;
  source: CellRangeBounds;
  target: { row: number; column: number };
}

type Dictionary = Record<string, string>;

declare function acquireVsCodeApi(): VSCodeApi;

const vscode = acquireVsCodeApi();
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: false });
const rowHeaderWidth = 48;
const columnHeaderHeight = 34;
const markdownHeaderMinimumHeight = 40;
const appendColumnWidth = 30;
const appendRowHeight = 28;
const selectionDragThreshold = 5;
const customClipboardType = 'application/x-markdown-grid-editor';

const dictionaries: Record<'en' | 'ja', Dictionary> = {
  en: {
    loading: 'Loading table…', undo: 'Undo', redo: 'Redo', copy: 'Copy', cut: 'Cut', clearCells: 'Delete cell contents',
    rowBefore: 'Row before', rowAfter: 'Row after',
    deleteRow: 'Delete row', columnBefore: 'Column before', columnAfter: 'Column after', deleteColumn: 'Delete column',
    autoFit: 'Auto fit widths', alignment: 'Alignment', none: 'None', left: 'Left', center: 'Center', right: 'Right',
    ascending: 'Sort ascending', descending: 'Sort descending', large: 'Large table: virtualization is enabled and no data is truncated.',
    disjointCopy: 'Copying disjoint ranges is not supported.', header: 'Header', empty: 'Empty table',
    disjointReorder: 'Disjoint rows or columns cannot be reordered.', moveRows: 'Move rows', moveColumns: 'Move columns',
    clipboardFailed: 'Could not access the clipboard.',
    appendRow: 'Add row at end', appendColumn: 'Add column at end',
    columnOptions: 'Column options', selectAll: 'Select entire table', moveSelection: 'Move selected cells',
    importTable: 'Import CSV or XLSX', exportTable: 'Export CSV or XLSX',
  },
  ja: {
    loading: 'テーブルを読み込んでいます…', undo: '元に戻す', redo: 'やり直す', copy: 'コピー', cut: '切り取り', clearCells: 'セル内容を削除',
    rowBefore: '前に行を追加', rowAfter: '後に行を追加',
    deleteRow: '行を削除', columnBefore: '前に列を追加', columnAfter: '後に列を追加', deleteColumn: '列を削除',
    autoFit: '横幅を整える', alignment: '配置', none: '指定なし', left: '左', center: '中央', right: '右',
    ascending: '昇順で並べ替え', descending: '降順で並べ替え', large: '大きなテーブルです。データを省略せず仮想化して表示しています。',
    disjointCopy: '不連続範囲はコピーできません。', header: 'ヘッダー', empty: '空のテーブル',
    disjointReorder: '不連続な行または列は並べ替えできません。', moveRows: '行を移動', moveColumns: '列を移動',
    clipboardFailed: 'クリップボードへアクセスできませんでした。',
    appendRow: '末尾に行を追加', appendColumn: '末尾に列を追加',
    columnOptions: '列の操作', selectAll: '表全体を選択', moveSelection: '選択セルを移動',
    importTable: 'CSV・XLSXをインポート', exportTable: 'CSV・XLSXへエクスポート',
  },
};

function closeColumnMenusOutside(target?: Node): void {
  document.querySelectorAll<HTMLDetailsElement>('.column-menu[open]').forEach((menu) => {
    if (!target || !menu.contains(target)) {
      menu.removeAttribute('open');
    }
  });
}

function sameCell(left: CellPosition, right: CellPosition): boolean {
  return left.row === right.row && left.column === right.column;
}

function dropSide(event: React.DragEvent<HTMLElement>, axis: DropTarget['axis']): DropTarget['side'] {
  const bounds = event.currentTarget.getBoundingClientRect();
  const before = axis === 'column'
    ? event.clientX < bounds.left + bounds.width / 2
    : event.clientY < bounds.top + bounds.height / 2;
  return before ? 'before' : 'after';
}

function dragPreview(event: React.DragEvent<HTMLElement>, label: string, count: number): void {
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', label);
  const preview = document.createElement('div');
  preview.className = 'drag-preview';
  preview.textContent = count > 1 ? `${label} × ${count}` : label;
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 20, 16);
  requestAnimationFrame(() => preview.remove());
}

function alignmentIcon(alignment: Alignment): IconName {
  const icons: Record<Alignment, IconName> = {
    none: 'alignNone',
    left: 'alignLeft',
    center: 'alignCenter',
    right: 'alignRight',
  };
  return icons[alignment];
}

function cellAlignmentClass(alignment: Alignment | undefined): string {
  return ` align-${visibleCellAlignment(alignment ?? 'none')}`;
}

function plainText(value: string): string {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = safeMarkdown(value);
  return wrapper.textContent ?? '';
}

function safeMarkdown(value: string, workspaceResourceBase?: string): string {
  const template = document.createElement('template');
  template.innerHTML = markdown.renderInline(value);
  const allowed = new Set(['STRONG', 'EM', 'S', 'CODE', 'A', 'IMG']);
  for (const element of Array.from(template.content.querySelectorAll('*'))) {
    if (!allowed.has(element.tagName)) {
      element.replaceWith(document.createTextNode(element.textContent ?? ''));
      continue;
    }
    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name);
    }
    if (element instanceof HTMLAnchorElement) {
      const href = markdownLink(value, element.textContent ?? '');
      if (href && /^https:\/\//iu.test(href)) {
        element.href = href;
        element.rel = 'noopener noreferrer';
      } else {
        element.replaceWith(document.createTextNode(element.textContent ?? ''));
      }
    }
    if (element instanceof HTMLImageElement) {
      const match = value.match(/!\[([^\]]*)\]\(([^)]+)\)/u);
      const source = match?.[2];
      const workspaceSource = source && workspaceResourceBase && !/^(?:[a-z]+:|\/|#)/iu.test(source)
        ? new URL(source, workspaceResourceBase).toString()
        : undefined;
      if (source && (/^https:\/\//iu.test(source) || workspaceSource)) {
        element.src = workspaceSource ?? source;
        element.alt = match?.[1] ?? '';
        element.loading = 'lazy';
      } else {
        element.replaceWith(document.createTextNode(match?.[1] ?? element.alt));
      }
    }
  }
  return template.innerHTML;
}

function markdownLink(value: string, label: string): string | undefined {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return value.match(new RegExp(`\\[${escaped}\\]\\(([^)]+)\\)`, 'u'))?.[1]
    ?? value.match(/https:\/\/[^\s)]+/u)?.[0];
}

function tsvFromRange(snapshot: TableSnapshot, range: SelectionRange, raw: boolean): string {
  const bounds = rangeBounds(range);
  return snapshot.rows.slice(bounds.top, bounds.bottom + 1)
    .map((row) => row.slice(bounds.left, bounds.right + 1).map((cell) => raw ? cell : plainText(cell)).join('\t'))
    .join('\n');
}

function TableEditor({ initial }: { initial: EditorState }): React.JSX.Element {
  const [state, setState] = useState(initial);
  const [snapshot, setSnapshot] = useState(() => cloneSnapshot(initial.snapshot));
  const [primary, setPrimary] = useState<CellPosition>(initial.selection ?? { row: 0, column: 0 });
  const [anchor, setAnchor] = useState(primary);
  const [ranges, setRanges] = useState<SelectionRange[]>([{ start: primary, end: primary }]);
  const [editing, setEditing] = useState<EditingCell>();
  const [isPanning, setIsPanning] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [draggedRows, setDraggedRows] = useState<number[]>([]);
  const [draggedColumns, setDraggedColumns] = useState<number[]>([]);
  const [dropTarget, setDropTarget] = useState<DropTarget>();
  const [cellMoveTarget, setCellMoveTarget] = useState<{ row: number; column: number }>();
  const [scrollPosition, setScrollPosition] = useState({ left: 0, top: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellSelectionGestureRef = useRef<CellSelectionGesture | undefined>(undefined);
  const headerSelectionGestureRef = useRef<HeaderSelectionGesture | undefined>(undefined);
  const cellMoveGestureRef = useRef<CellMoveGesture | undefined>(undefined);
  const panGestureRef = useRef<PanGesture | undefined>(undefined);
  const snapshotRef = useRef(snapshot);
  const primaryRef = useRef(primary);
  snapshotRef.current = snapshot;
  primaryRef.current = primary;
  const text = dictionaries[state.language];
  const editingSession = editing ? `${editing.cell.row}:${editing.cell.column}` : undefined;
  const headerRowHeight = estimatedBodyRowHeight(snapshot.rows[0] ?? [], snapshot.widths, markdownHeaderMinimumHeight);
  const bodyOffset = columnHeaderHeight + headerRowHeight;

  const positionColumnMenu = useCallback((details: HTMLDetailsElement): void => {
    if (!details.open) {
      return;
    }
    document.querySelectorAll<HTMLDetailsElement>('.column-menu[open]').forEach((menu) => {
      if (menu !== details) {
        menu.removeAttribute('open');
      }
    });
    const items = details.querySelector<HTMLElement>('.column-menu-items');
    if (!items) {
      return;
    }
    items.style.removeProperty('transform');
    requestAnimationFrame(() => {
      const viewport = scrollRef.current?.getBoundingClientRect();
      const menuBounds = items?.getBoundingClientRect();
      if (!viewport || !menuBounds || !details.open) {
        return;
      }
      const inset = 8;
      const leftEdge = viewport.left + inset;
      const rightEdge = viewport.right - inset;
      const shift = menuBounds.left < leftEdge
        ? leftEdge - menuBounds.left
        : menuBounds.right > rightEdge
          ? rightEdge - menuBounds.right
          : 0;
      if (shift !== 0) {
        items.style.transform = `translateX(${shift}px)`;
      }
    });
  }, []);

  const columnVirtualizer = useVirtualizer({
    count: snapshot.widths.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => columnPixelWidth(snapshot.widths[index]),
    horizontal: true,
    overscan: 4,
  });
  const rowVirtualizer = useVirtualizer({
    count: Math.max(0, snapshot.rows.length - 1),
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => estimatedBodyRowHeight(snapshot.rows[index + 1] ?? [], snapshot.widths),
    overscan: 8,
  });

  const sendOperation = useCallback((operation: TableOperation, nextSelection = primary, optimisticSnapshot?: TableSnapshot) => {
    setSnapshot((current) => {
      const next = optimisticSnapshot ?? applyOperation(current, operation);
      snapshotRef.current = next;
      return next;
    });
    vscode.postMessage({ type: 'operation', documentVersion: state.documentVersion, operation, selection: nextSelection });
  }, [primary, state.documentVersion]);

  const chooseCell = useCallback((cell: CellPosition, event?: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean }) => {
    const next = clampCell(cell, snapshot);
    setPrimary(next);
    if (event?.shiftKey) {
      setRanges((current) => [...current.slice(0, -1), { start: anchor, end: next }]);
    } else if (event?.ctrlKey || event?.metaKey) {
      setAnchor(next);
      setRanges((current) => [...current, { start: next, end: next }]);
    } else {
      setAnchor(next);
      setRanges([{ start: next, end: next }]);
    }
    vscode.postMessage({ type: 'revealCell', cell: next });
  }, [anchor, snapshot]);

  const startCellSelection = useCallback((cell: CellPosition, event: React.PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    const next = clampCell(cell, snapshot);
    cellSelectionGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      anchor: event.shiftKey ? anchor : next,
    };
    chooseCell(next, event);
  }, [anchor, chooseCell, snapshot]);

  const extendCellSelection = useCallback((cell: CellPosition, event: React.PointerEvent): void => {
    const gesture = cellSelectionGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || (event.buttons & 1) === 0) {
      return;
    }
    if (!hasExceededDragThreshold(
      { x: gesture.startX, y: gesture.startY },
      { x: event.clientX, y: event.clientY },
      selectionDragThreshold,
    )) {
      return;
    }
    const next = clampCell(cell, snapshot);
    setPrimary(next);
    setRanges((current) => [...current.slice(0, -1), { start: gesture.anchor, end: next }]);
    vscode.postMessage({ type: 'revealCell', cell: next });
  }, [snapshot]);

  const beginEdit = useCallback((cell: CellPosition, replace?: string) => {
    const original = snapshot.rows[cell.row]?.[cell.column] ?? '';
    setEditing({ cell, value: replace ?? original, original });
    setPrimary(cell);
    setRanges([{ start: cell, end: cell }]);
  }, [snapshot]);
  const beginEditRef = useRef(beginEdit);
  beginEditRef.current = beginEdit;

  const commitEdit = useCallback((move?: number) => {
    if (!editing) {
      return;
    }
    if (editing.value !== editing.original) {
      sendOperation({ type: 'setCells', changes: [{ ...editing.cell, value: editing.value }] }, editing.cell);
    }
    const next = move === undefined ? editing.cell : clampCell({ row: editing.cell.row, column: editing.cell.column + move }, snapshot);
    setEditing(undefined);
    chooseCell(next);
    requestAnimationFrame(() => gridRef.current?.focus());
  }, [chooseCell, editing, sendOperation, snapshot]);

  const replaceSelection = useCallback((value: string) => {
    const changes: Array<{ row: number; column: number; value: string }> = [];
    for (let row = 0; row < snapshot.rows.length; row += 1) {
      for (let column = 0; column < snapshot.widths.length; column += 1) {
        if (ranges.some((range) => isCellSelected(range, row, column))) {
          changes.push({ row, column, value });
        }
      }
    }
    if (changes.length > 0) {
      sendOperation({ type: 'setCells', changes });
    }
  }, [ranges, sendOperation, snapshot]);

  const copySelection = useCallback(async (cut: boolean): Promise<void> => {
    if (ranges.length !== 1) {
      setNotice(text.disjointCopy);
      return;
    }

    const plain = tsvFromRange(snapshot, ranges[0], false);
    const raw = tsvFromRange(snapshot, ranges[0], true);
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API is unavailable');
      }
      if (typeof ClipboardItem === 'function' && typeof navigator.clipboard.write === 'function') {
        try {
          await navigator.clipboard.write([new ClipboardItem({
            'text/plain': new Blob([plain], { type: 'text/plain' }),
            [customClipboardType]: new Blob([raw], { type: customClipboardType }),
          })]);
        } catch {
          await navigator.clipboard.writeText(plain);
        }
      } else {
        await navigator.clipboard.writeText(plain);
      }
      if (cut) {
        replaceSelection('');
      }
      requestAnimationFrame(() => gridRef.current?.focus());
    } catch {
      setNotice(text.clipboardFailed);
    }
  }, [ranges, replaceSelection, snapshot, text.clipboardFailed, text.disjointCopy]);

  const movePrimary = useCallback((rowDelta: number, columnDelta: number, extend: boolean) => {
    const next = clampCell({ row: primary.row + rowDelta, column: primary.column + columnDelta }, snapshot);
    chooseCell(next, { shiftKey: extend });
    rowVirtualizer.scrollToIndex(Math.max(0, next.row - 1));
    columnVirtualizer.scrollToIndex(next.column);
  }, [chooseCell, columnVirtualizer, primary, rowVirtualizer, snapshot]);

  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (editing) {
      return;
    }
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      vscode.postMessage({ type: event.shiftKey ? 'redo' : 'undo' });
      return;
    }
    if (modifier && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      vscode.postMessage({ type: 'redo' });
      return;
    }
    if (modifier && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      const end = { row: snapshot.rows.length - 1, column: snapshot.widths.length - 1 };
      setRanges([{ start: { row: 0, column: 0 }, end }]);
      setPrimary({ row: 0, column: 0 });
      return;
    }
    const movement: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    if (movement[event.key]) {
      event.preventDefault();
      movePrimary(movement[event.key][0], movement[event.key][1], event.shiftKey);
    } else if (event.key === 'Enter' || event.key === 'F2') {
      event.preventDefault();
      beginEdit(primary);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      replaceSelection('');
    } else if (event.key.length === 1 && !modifier && !event.altKey) {
      event.preventDefault();
      beginEdit(primary, event.key);
    }
  };

  const copy = (event: React.ClipboardEvent<HTMLDivElement>, cut: boolean): void => {
    if (editing) {
      return;
    }
    event.preventDefault();
    if (ranges.length !== 1) {
      setNotice(text.disjointCopy);
      return;
    }
    event.clipboardData.setData('text/plain', tsvFromRange(snapshot, ranges[0], false));
    try {
      event.clipboardData.setData(customClipboardType, tsvFromRange(snapshot, ranges[0], true));
    } catch {
      // Some Webview browser implementations reject custom clipboard types.
    }
    if (cut) {
      replaceSelection('');
    }
  };

  const paste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    if (editing) {
      return;
    }
    event.preventDefault();
    const raw = event.clipboardData.getData(customClipboardType) || event.clipboardData.getData('text/plain');
    if (!raw) {
      return;
    }
    const values = parseTsv(raw);
    const next = cloneSnapshot(snapshot);
    const requiredRows = primary.row + values.length;
    const requiredColumns = primary.column + Math.max(...values.map((row) => row.length));
    while (next.rows.length < requiredRows) {
      next.rows.push(Array.from({ length: next.widths.length }, () => ''));
    }
    while (next.widths.length < requiredColumns) {
      next.widths.push(3);
      next.alignments.push('none');
      next.rows.forEach((row) => row.push(''));
    }
    values.forEach((row, rowOffset) => row.forEach((value, columnOffset) => {
      next.rows[primary.row + rowOffset][primary.column + columnOffset] = value.replace(/\r\n|\r|\n/gu, ' ');
    }));
    const end = { row: requiredRows - 1, column: requiredColumns - 1 };
    setRanges([{ start: primary, end }]);
    sendOperation({ type: 'replace', snapshot: next }, primary, next);
  };

  const perform = (operation: TableOperation, selection = primary): void => {
    const optimisticSnapshot = applyOperation(snapshot, operation);
    const nextSelection = clampCell(selection, optimisticSnapshot);
    setPrimary(nextSelection);
    setAnchor(nextSelection);
    setRanges([{ start: nextSelection, end: nextSelection }]);
    sendOperation(operation, nextSelection, optimisticSnapshot);
  };

  const selectedRows = useMemo(() => {
    const indexes = new Set<number>();
    ranges.forEach((range) => {
      const bounds = rangeBounds(range);
      for (let row = bounds.top; row <= bounds.bottom; row += 1) indexes.add(row);
    });
    return [...indexes];
  }, [ranges]);
  const selectedColumns = useMemo(() => {
    const indexes = new Set<number>();
    ranges.forEach((range) => {
      const bounds = rangeBounds(range);
      for (let column = bounds.left; column <= bounds.right; column += 1) indexes.add(column);
    });
    return [...indexes];
  }, [ranges]);

  const wholeAxisSelected = useCallback((axis: GridAxis, index: number): boolean => ranges.some((range) => (
    rangeSelectsWholeAxis(range, axis, index, snapshot.rows.length, snapshot.widths.length)
  )), [ranges, snapshot.rows.length, snapshot.widths.length]);

  const startHeaderSelection = useCallback((axis: GridAxis, index: number, event: React.PointerEvent): void => {
    if (event.button !== 0 || wholeAxisSelected(axis, index)) {
      return;
    }
    const additive = event.ctrlKey || event.metaKey;
    const axisAnchor = event.shiftKey ? (axis === 'row' ? anchor.row : anchor.column) : index;
    const range = axisSelectionRange(axis, axisAnchor, index, snapshot.rows.length, snapshot.widths.length);
    const next = axis === 'row' ? range.start : { row: 0, column: index };
    headerSelectionGestureRef.current = { pointerId: event.pointerId, axis, anchor: axisAnchor, additive };
    setPrimary(next);
    setAnchor(next);
    setRanges((current) => additive ? [...current, range] : [range]);
    vscode.postMessage({ type: 'revealCell', cell: next });
  }, [anchor, snapshot.rows.length, snapshot.widths.length, wholeAxisSelected]);

  const extendHeaderSelection = useCallback((axis: GridAxis, index: number, event: React.PointerEvent): void => {
    const gesture = headerSelectionGestureRef.current;
    if (!gesture || gesture.axis !== axis || gesture.pointerId !== event.pointerId || (event.buttons & 1) === 0) {
      return;
    }
    const range = axisSelectionRange(axis, gesture.anchor, index, snapshot.rows.length, snapshot.widths.length);
    const next = axis === 'row' ? { row: index, column: 0 } : { row: 0, column: index };
    setPrimary(next);
    setRanges((current) => gesture.additive ? [...current.slice(0, -1), range] : [range]);
    vscode.postMessage({ type: 'revealCell', cell: next });
  }, [snapshot.rows.length, snapshot.widths.length]);

  useEffect(() => {
    const receive = (event: MessageEvent<ExtensionMessage>): void => {
      const incoming = event.data;
      if (incoming.type === 'load') {
        const nextSnapshot = cloneSnapshot(incoming.state.snapshot);
        setState(incoming.state);
        setSnapshot(nextSnapshot);
        snapshotRef.current = nextSnapshot;
        vscode.setState({ uri: incoming.state.uri, tableStartOffset: incoming.state.tableStartOffset });
        const cell = clampCell(incoming.state.selection ?? primaryRef.current, incoming.state.snapshot);
        primaryRef.current = cell;
        setPrimary(cell);
        setAnchor(cell);
        setRanges([{ start: cell, end: cell }]);
        if (incoming.state.startEditing) {
          requestAnimationFrame(() => beginEditRef.current({ row: 0, column: 0 }));
        }
      } else if (incoming.type === 'selection') {
        const cell = clampCell(incoming.selection, snapshotRef.current);
        primaryRef.current = cell;
        setPrimary(cell);
        setAnchor(cell);
        setRanges([{ start: cell, end: cell }]);
      } else {
        setNotice(incoming.message);
      }
    };
    window.addEventListener('message', receive);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (editingSession !== undefined && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingSession]);

  useEffect(() => {
    rowVirtualizer.measure();
    columnVirtualizer.measure();
  }, [snapshot, rowVirtualizer, columnVirtualizer]);

  useEffect(() => {
    const endCellSelection = (): void => {
      cellSelectionGestureRef.current = undefined;
      headerSelectionGestureRef.current = undefined;
    };
    window.addEventListener('pointerup', endCellSelection);
    window.addEventListener('pointercancel', endCellSelection);
    return () => {
      window.removeEventListener('pointerup', endCellSelection);
      window.removeEventListener('pointercancel', endCellSelection);
    };
  }, []);

  useEffect(() => {
    const pointerDown = (event: PointerEvent): void => {
      closeColumnMenusOutside(event.target instanceof Node ? event.target : undefined);
    };
    document.addEventListener('pointerdown', pointerDown, true);
    return () => document.removeEventListener('pointerdown', pointerDown, true);
  }, []);

  const resizeColumn = (column: number, event: React.PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const start = event.clientX;
    const initial = snapshot.widths[column];
    let preview = initial;
    const root = document.documentElement;
    root.classList.add('column-resizing');
    const move = (moveEvent: PointerEvent): void => {
      const width = Math.max(3, Math.round(initial + (moveEvent.clientX - start) / characterWidth));
      if (width !== preview) {
        preview = width;
        setSnapshot((current) => applyOperation(current, { type: 'setWidth', column, width }));
      }
    };
    const cleanup = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', up);
      root.classList.remove('column-resizing');
    };
    const up = (): void => {
      cleanup();
      if (preview !== initial) {
        sendOperation({ type: 'setWidth', column, width: preview }, primary);
      }
    };
    const cancel = (): void => {
      cleanup();
      setSnapshot((current) => applyOperation(current, { type: 'setWidth', column, width: initial }));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', up);
  };

  const reorderClass = (axis: DropTarget['axis'], index: number): string => {
    const dragged = axis === 'column' ? draggedColumns : draggedRows;
    const source = dragged.includes(index) ? ' drag-source' : '';
    if (dropTarget?.axis !== axis || dropTarget.index !== index) {
      return source;
    }
    return `${source} drop-${axis}-${dropTarget.side}`;
  };

  const clearReorder = (): void => {
    setDraggedColumns([]);
    setDraggedRows([]);
    setDropTarget(undefined);
  };

  const updateDropTarget = (event: React.DragEvent<HTMLElement>, axis: DropTarget['axis'], index: number): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget({ axis, index, side: dropSide(event, axis) });
  };

  const completeDrop = (event: React.DragEvent<HTMLElement>, axis: DropTarget['axis'], index: number): void => {
    event.preventDefault();
    const indexes = axis === 'column' ? draggedColumns : draggedRows;
    const target = index + (dropSide(event, axis) === 'after' ? 1 : 0);
    if (usefulMove(indexes, target)) {
      if (axis === 'column') {
        perform({ type: 'moveColumns', indexes, target }, { row: primary.row, column: index });
      } else {
        perform({ type: 'moveRows', indexes, target }, { row: index, column: primary.column });
      }
    }
    clearReorder();
  };

  const virtualColumns = columnVirtualizer.getVirtualItems();
  const virtualRows = rowVirtualizer.getVirtualItems();
  const tableWidth = columnVirtualizer.getTotalSize();
  const tableBodyHeight = rowVirtualizer.getTotalSize();
  const canvasWidth = rowHeaderWidth + tableWidth + appendColumnWidth;
  const canvasHeight = bodyOffset + tableBodyHeight + appendRowHeight;

  const selectedCellBounds = useMemo<CellRangeBounds | undefined>(() => {
    if (ranges.length !== 1) {
      return undefined;
    }
    const bounds = rangeBounds(ranges[0]);
    return (bounds.bottom - bounds.top + 1) * (bounds.right - bounds.left + 1) > 1 ? bounds : undefined;
  }, [ranges]);
  const columnStarts = useMemo(() => {
    const starts = [0];
    snapshot.widths.forEach((width) => starts.push(starts.at(-1)! + columnPixelWidth(width)));
    return starts;
  }, [snapshot.widths]);
  const rowStarts = useMemo(() => {
    const starts = [columnHeaderHeight, bodyOffset];
    for (let row = 1; row < snapshot.rows.length; row += 1) {
      starts.push(starts.at(-1)! + estimatedBodyRowHeight(snapshot.rows[row] ?? [], snapshot.widths));
    }
    return starts;
  }, [bodyOffset, snapshot.rows, snapshot.widths]);
  const frameBounds = selectedCellBounds && {
    top: cellMoveTarget?.row ?? selectedCellBounds.top,
    left: cellMoveTarget?.column ?? selectedCellBounds.left,
    height: selectedCellBounds.bottom - selectedCellBounds.top + 1,
    width: selectedCellBounds.right - selectedCellBounds.left + 1,
  };
  const selectionFrame = frameBounds && {
    left: rowHeaderWidth + columnStarts[frameBounds.left],
    top: rowStarts[frameBounds.top],
    width: columnStarts[frameBounds.left + frameBounds.width] - columnStarts[frameBounds.left],
    height: rowStarts[frameBounds.top + frameBounds.height] - rowStarts[frameBounds.top],
  };

  const startCellMove = (event: React.PointerEvent<HTMLSpanElement>): void => {
    if (event.button !== 0 || !selectedCellBounds) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const target = { row: selectedCellBounds.top, column: selectedCellBounds.left };
    cellMoveGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      source: selectedCellBounds,
      target,
    };
    setCellMoveTarget(target);
  };

  const previewCellMove = (event: React.PointerEvent<HTMLSpanElement>): void => {
    const gesture = cellMoveGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    const height = gesture.source.bottom - gesture.source.top + 1;
    const width = gesture.source.right - gesture.source.left + 1;
    const target = {
      row: nearestBoundedIndex(
        rowStarts,
        rowStarts[gesture.source.top] + event.clientY - gesture.startY,
        snapshot.rows.length - height,
      ),
      column: nearestBoundedIndex(
        columnStarts,
        columnStarts[gesture.source.left] + event.clientX - gesture.startX,
        snapshot.widths.length - width,
      ),
    };
    gesture.target = target;
    setCellMoveTarget(target);
  };

  const endCellMove = (event: React.PointerEvent<HTMLSpanElement>, commit: boolean): void => {
    const gesture = cellMoveGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    cellMoveGestureRef.current = undefined;
    setCellMoveTarget(undefined);
    if (!commit || (gesture.target.row === gesture.source.top && gesture.target.column === gesture.source.left)) {
      return;
    }
    const operation: TableOperation = { type: 'moveCells', source: gesture.source, target: gesture.target };
    const optimisticSnapshot = applyOperation(snapshot, operation);
    const primaryOffset = {
      row: Math.max(0, Math.min(gesture.source.bottom - gesture.source.top, primary.row - gesture.source.top)),
      column: Math.max(0, Math.min(gesture.source.right - gesture.source.left, primary.column - gesture.source.left)),
    };
    const nextPrimary = { row: gesture.target.row + primaryOffset.row, column: gesture.target.column + primaryOffset.column };
    const nextEnd = {
      row: gesture.target.row + gesture.source.bottom - gesture.source.top,
      column: gesture.target.column + gesture.source.right - gesture.source.left,
    };
    setPrimary(nextPrimary);
    setAnchor({ row: gesture.target.row, column: gesture.target.column });
    setRanges([{ start: { row: gesture.target.row, column: gesture.target.column }, end: nextEnd }]);
    sendOperation(operation, nextPrimary, optimisticSnapshot);
    requestAnimationFrame(() => gridRef.current?.focus());
  };

  const startPan = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (event.button !== 1) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    setIsPanning(true);
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>): void => {
    const gesture = panGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    const position = scrollPositionForPan(
      { left: gesture.scrollLeft, top: gesture.scrollTop },
      { x: gesture.startX, y: gesture.startY },
      { x: event.clientX, y: event.clientY },
    );
    event.currentTarget.scrollLeft = position.left;
    event.currentTarget.scrollTop = position.top;
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>): void => {
    const gesture = panGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    panGestureRef.current = undefined;
    setIsPanning(false);
  };

  return (
    <main className="app">
      <nav className="toolbar" aria-label="Table operations">
        <div className="toolbar-group toolbar-history" aria-label="History">
          <ToolbarButton icon="undo" label={text.undo} onClick={() => vscode.postMessage({ type: 'undo' })} />
          <ToolbarButton icon="redo" label={text.redo} onClick={() => vscode.postMessage({ type: 'redo' })} />
          <ToolbarButton icon="autoFit" label={text.autoFit} onClick={() => perform({ type: 'autoFit' })} />
          <ToolbarButton icon="download" label={text.importTable} onClick={() => vscode.postMessage({ type: 'importTable' })} />
          <ToolbarButton icon="upload" label={text.exportTable} onClick={() => vscode.postMessage({ type: 'exportTable' })} />
        </div>
        <div className="toolbar-group toolbar-clipboard" aria-label="Clipboard">
          <ToolbarButton icon="content_copy" label={text.copy} onClick={() => void copySelection(false)} />
          <ToolbarButton icon="content_cut" label={text.cut} onClick={() => void copySelection(true)} />
          <ToolbarButton
            danger
            icon="delete"
            label={text.clearCells}
            onClick={() => {
              replaceSelection('');
              requestAnimationFrame(() => gridRef.current?.focus());
            }}
          />
        </div>
        <div className="toolbar-group toolbar-rows" aria-label="Rows">
          <ToolbarButton icon="add_row_above" label={text.rowBefore} onClick={() => perform({ type: 'insertRow', index: Math.max(1, primary.row) }, { row: Math.max(1, primary.row), column: primary.column })} />
          <ToolbarButton icon="add_row_below" label={text.rowAfter} onClick={() => perform({ type: 'insertRow', index: Math.max(1, primary.row + 1) }, { row: Math.max(1, primary.row + 1), column: primary.column })} />
          <ToolbarButton danger icon="table_rows" label={text.deleteRow} disabled={selectedRows.every((row) => row === 0)} onClick={() => perform({ type: 'deleteRows', indexes: selectedRows }, { row: Math.max(0, primary.row - 1), column: primary.column })} />
        </div>
        <div className="toolbar-group toolbar-columns" aria-label="Columns">
          <ToolbarButton icon="add_column_left" label={text.columnBefore} onClick={() => perform({ type: 'insertColumn', index: primary.column }, primary)} />
          <ToolbarButton icon="add_column_right" label={text.columnAfter} onClick={() => perform({ type: 'insertColumn', index: primary.column + 1 }, { row: primary.row, column: primary.column + 1 })} />
          <ToolbarButton danger icon="view_column" label={text.deleteColumn} disabled={snapshot.widths.length <= 1} onClick={() => perform({ type: 'deleteColumns', indexes: selectedColumns }, { row: primary.row, column: Math.max(0, primary.column - 1) })} />
        </div>
      </nav>
      {state.oversized && <div className="banner" role="status">{text.large}</div>}
      {notice && <button type="button" className="notice" onClick={() => setNotice(undefined)}>{notice}</button>}
      <div
        ref={gridRef}
        className="grid-focus"
        role="grid"
        aria-rowcount={snapshot.rows.length}
        aria-colcount={snapshot.widths.length}
        tabIndex={0}
        onKeyDown={keyDown}
        onCopy={(event) => copy(event, false)}
        onCut={(event) => copy(event, true)}
        onPaste={paste}
      >
        <div
          ref={scrollRef}
          className={`grid-scroll${isPanning ? ' panning' : ''}`}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          onAuxClick={(event) => {
            if (event.button === 1) {
              event.preventDefault();
            }
          }}
          onScroll={(event) => {
            closeColumnMenusOutside();
            setScrollPosition({ left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop });
          }}
        >
          <div className="grid-canvas" style={{ width: canvasWidth, height: canvasHeight }}>
            <button
              type="button"
              className="corner"
              aria-label={text.selectAll}
              title={text.selectAll}
              style={{ left: scrollPosition.left, top: scrollPosition.top }}
              onClick={() => {
                const start = { row: 0, column: 0 };
                const end = { row: snapshot.rows.length - 1, column: snapshot.widths.length - 1 };
                setPrimary(start); setAnchor(start); setRanges([{ start, end }]);
                vscode.postMessage({ type: 'revealCell', cell: start });
              }}
            />
            <div
              className="header-row-heading"
              role="rowheader"
              style={{ left: scrollPosition.left, top: scrollPosition.top + columnHeaderHeight, height: headerRowHeight }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                const start = { row: 0, column: 0 };
                const end = { row: 0, column: snapshot.widths.length - 1 };
                setPrimary(start); setAnchor(start); setRanges([{ start, end }]);
              }}
            >0</div>
            {virtualColumns.map((virtualColumn) => {
              const column = virtualColumn.index;
              const width = virtualColumn.size;
              const canReorder = wholeAxisSelected('column', column) && contiguous(selectedColumns);
              const headerSelected = ranges.some((range) => isCellSelected(range, 0, column));
              return (
                <React.Fragment key={virtualColumn.key}>
                  <div
                    className={`column-heading${reorderClass('column', column)}`}
                    role="columnheader"
                    draggable={canReorder}
                    onDragStart={(event) => {
                      if (!canReorder || headerSelectionGestureRef.current) {
                        event.preventDefault(); return;
                      }
                      const indexes = selectedColumns.includes(column) ? selectedColumns : [column];
                      if (!contiguous(indexes)) {
                        event.preventDefault(); setNotice(text.disjointReorder); return;
                      }
                      dragPreview(event, `${text.moveColumns}: ${indexes.map(columnName).join(', ')}`, indexes.length);
                      setDraggedColumns(indexes);
                    }}
                    onDragOver={(event) => updateDropTarget(event, 'column', column)}
                    onDrop={(event) => completeDrop(event, 'column', column)}
                    onDragEnd={clearReorder}
                    onPointerDown={(event) => startHeaderSelection('column', column, event)}
                    onPointerEnter={(event) => extendHeaderSelection('column', column, event)}
                    style={{ left: rowHeaderWidth + virtualColumn.start, top: scrollPosition.top, width }}
                  >
                    <span>{columnName(column)}</span>
                    <details
                      className="column-menu"
                      draggable={false}
                      onToggle={(event) => positionColumnMenu(event.currentTarget)}
                      onDragStart={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <summary
                        aria-label={`${text.columnOptions} ${columnName(column)}`}
                        title={`${text.columnOptions} ${columnName(column)}`}
                      ><Icon name="more_horiz" size={20} /></summary>
                      <div className="column-menu-items">
                        {(['none', 'left', 'center', 'right'] as Alignment[]).map((alignment) => (
                          <button
                            key={alignment}
                            type="button"
                            className="column-menu-item"
                            aria-pressed={snapshot.alignments[column] === alignment}
                            onClick={(event) => {
                              event.currentTarget.closest('details')?.removeAttribute('open');
                              perform({ type: 'setAlignment', column, alignment }, primary);
                            }}
                          >
                            <Icon name={alignmentIcon(alignment)} />
                            <span>{text[alignment]}</span>
                            {snapshot.alignments[column] === alignment && <Icon name="check" size={16} />}
                          </button>
                        ))}
                        <div className="column-menu-separator" />
                        <button
                          type="button"
                          className="column-menu-item"
                          onClick={(event) => {
                            event.currentTarget.closest('details')?.removeAttribute('open');
                            perform({ type: 'sort', column, direction: 'ascending' }, primary);
                          }}
                        ><Icon name="sortAscending" /><span>{text.ascending}</span></button>
                        <button
                          type="button"
                          className="column-menu-item"
                          onClick={(event) => {
                            event.currentTarget.closest('details')?.removeAttribute('open');
                            perform({ type: 'sort', column, direction: 'descending' }, primary);
                          }}
                        ><Icon name="sortDescending" /><span>{text.descending}</span></button>
                      </div>
                    </details>
                    <span
                      className="resize-handle"
                      draggable={false}
                      title={text.autoFit}
                      onPointerDown={(event) => resizeColumn(column, event)}
                      onDoubleClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        perform({ type: 'autoFitColumn', column }, primary);
                      }}
                    />
                  </div>
                  <div
                    className={`cell header-cell${cellAlignmentClass(snapshot.alignments[column])}${reorderClass('column', column)} ${headerSelected ? 'selected' : ''}${cellMoveTarget && headerSelected ? ' cell-move-source' : ''} ${sameCell(primary, { row: 0, column }) ? 'primary' : ''}`}
                    role="columnheader"
                    aria-label={`${text.header} ${columnName(column)}`}
                    style={{ left: rowHeaderWidth + virtualColumn.start, top: scrollPosition.top + columnHeaderHeight, width, height: headerRowHeight }}
                    onPointerDown={(event) => startCellSelection({ row: 0, column }, event)}
                    onPointerEnter={(event) => extendCellSelection({ row: 0, column }, event)}
                    onDoubleClick={() => beginEdit({ row: 0, column })}
                    onDragOver={(event) => draggedColumns.length > 0 && updateDropTarget(event, 'column', column)}
                    onDrop={(event) => draggedColumns.length > 0 && completeDrop(event, 'column', column)}
                  >
                    {editing && sameCell(editing.cell, { row: 0, column })
                      ? <CellInput ref={inputRef} editing={editing} setEditing={setEditing} commit={commitEdit} />
                      : <MarkdownCell value={snapshot.rows[0]?.[column] ?? ''} workspaceResourceBase={state.workspaceResourceBase} />}
                  </div>
                </React.Fragment>
              );
            })}
            {virtualRows.map((virtualRow) => {
              const row = virtualRow.index + 1;
              const top = bodyOffset + virtualRow.start;
              const canReorder = wholeAxisSelected('row', row) && contiguous(selectedRows.filter((index) => index > 0));
              return (
                <React.Fragment key={virtualRow.key}>
                  <div
                    className={`row-heading${reorderClass('row', row)}`}
                    role="rowheader"
                    draggable={canReorder}
                    style={{ left: scrollPosition.left, top, height: virtualRow.size }}
                    onDragStart={(event) => {
                      if (!canReorder || headerSelectionGestureRef.current) {
                        event.preventDefault(); return;
                      }
                      const indexes = selectedRows.includes(row) ? selectedRows.filter((index) => index > 0) : [row];
                      if (!contiguous(indexes)) {
                        event.preventDefault(); setNotice(text.disjointReorder); return;
                      }
                      dragPreview(event, `${text.moveRows}: ${indexes.join(', ')}`, indexes.length);
                      setDraggedRows(indexes);
                    }}
                    onDragOver={(event) => updateDropTarget(event, 'row', row)}
                    onDrop={(event) => completeDrop(event, 'row', row)}
                    onDragEnd={clearReorder}
                    onPointerDown={(event) => startHeaderSelection('row', row, event)}
                    onPointerEnter={(event) => extendHeaderSelection('row', row, event)}
                  >{row}</div>
                  {virtualColumns.map((virtualColumn) => {
                    const column = virtualColumn.index;
                    const cell = { row, column };
                    const isEditing = editing && sameCell(editing.cell, cell);
                    const cellSelected = ranges.some((range) => isCellSelected(range, row, column));
                    return (
                      <div
                        key={`${row}:${column}`}
                        className={`cell body-cell${cellAlignmentClass(snapshot.alignments[column])}${reorderClass('row', row)}${reorderClass('column', column)} ${cellSelected ? 'selected' : ''}${cellMoveTarget && cellSelected ? ' cell-move-source' : ''} ${sameCell(primary, cell) ? 'primary' : ''}`}
                        role="gridcell"
                        aria-rowindex={row + 1}
                        aria-colindex={column + 1}
                        style={{ left: rowHeaderWidth + virtualColumn.start, top, width: virtualColumn.size, height: virtualRow.size }}
                        onPointerDown={(event) => startCellSelection(cell, event)}
                        onPointerEnter={(event) => extendCellSelection(cell, event)}
                        onDoubleClick={() => beginEdit(cell)}
                        onDragOver={(event) => {
                          if (draggedColumns.length > 0) {
                            updateDropTarget(event, 'column', column);
                          } else if (draggedRows.length > 0) {
                            updateDropTarget(event, 'row', row);
                          }
                        }}
                        onDrop={(event) => {
                          if (draggedColumns.length > 0) {
                            completeDrop(event, 'column', column);
                          } else if (draggedRows.length > 0) {
                            completeDrop(event, 'row', row);
                          }
                        }}
                      >
                        {isEditing
                          ? <CellInput ref={inputRef} editing={editing} setEditing={setEditing} commit={commitEdit} />
                          : <MarkdownCell value={snapshot.rows[row]?.[column] ?? ''} workspaceResourceBase={state.workspaceResourceBase} />}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
            {selectionFrame && (
              <div
                className={`selection-frame${cellMoveTarget ? ' moving' : ''}`}
                style={selectionFrame}
              >
                {(['top', 'right', 'bottom', 'left'] as const).map((edge) => (
                  <span
                    key={edge}
                    className={`selection-frame-edge selection-frame-${edge}`}
                    aria-hidden="true"
                    title={text.moveSelection}
                    onPointerDown={startCellMove}
                    onPointerMove={previewCellMove}
                    onPointerUp={(event) => endCellMove(event, true)}
                    onPointerCancel={(event) => endCellMove(event, false)}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              className="append-button append-column-button"
              style={{ left: rowHeaderWidth + tableWidth, top: 0, width: appendColumnWidth, height: bodyOffset + tableBodyHeight }}
              title={text.appendColumn}
              aria-label={text.appendColumn}
              onClick={() => {
                const column = snapshot.widths.length;
                perform({ type: 'insertColumn', index: column }, { row: primary.row, column });
                requestAnimationFrame(() => {
                  columnVirtualizer.measure();
                  columnVirtualizer.scrollToIndex(column, { align: 'end' });
                  gridRef.current?.focus();
                });
              }}
            >
              <span className="append-column-button-icon" style={{ top: scrollPosition.top + 17 }}><Icon name="add" /></span>
            </button>
            <button
              type="button"
              className="append-button append-row-button"
              style={{ left: 0, top: bodyOffset + tableBodyHeight, width: rowHeaderWidth + tableWidth, height: appendRowHeight }}
              title={text.appendRow}
              aria-label={text.appendRow}
              onClick={() => {
                const row = snapshot.rows.length;
                perform({ type: 'insertRow', index: row }, { row, column: primary.column });
                requestAnimationFrame(() => {
                  rowVirtualizer.measure();
                  rowVirtualizer.scrollToIndex(row - 1, { align: 'end' });
                  gridRef.current?.focus();
                });
              }}
            >
              <span className="append-row-button-icon" style={{ left: scrollPosition.left + 15 }}><Icon name="add" /></span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ToolbarButton({
  danger = false,
  disabled = false,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={`toolbar-button${danger ? ' toolbar-button-danger' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} />
      <span className="toolbar-button-label">{label}</span>
    </button>
  );
}

const CellInput = React.forwardRef<HTMLInputElement, {
  editing: EditingCell;
  setEditing: React.Dispatch<React.SetStateAction<EditingCell | undefined>>;
  commit: (move?: number) => void;
}>(({ editing, setEditing, commit }, ref) => {
  const cancelled = useRef(false);
  return <input
    ref={ref}
    className="cell-input"
    value={editing.value}
    aria-label="Edit cell"
    onChange={(event) => setEditing({ ...editing, value: event.target.value.replace(/\r\n|\r|\n/gu, ' ') })}
    onBlur={() => { if (!cancelled.current) commit(); }}
    onKeyDown={(event) => {
      if (event.nativeEvent.isComposing) {
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault(); commit();
      } else if (event.key === 'Tab') {
        event.preventDefault(); commit(event.shiftKey ? -1 : 1);
      } else if (event.key === 'Escape') {
        event.preventDefault(); cancelled.current = true; setEditing(undefined);
      }
    }}
  />;
});
CellInput.displayName = 'CellInput';

function MarkdownCell({ value, workspaceResourceBase }: { value: string; workspaceResourceBase?: string }): React.JSX.Element {
  const html = useMemo(() => safeMarkdown(value, workspaceResourceBase), [value, workspaceResourceBase]);
  return (
    <span
      className="markdown-cell"
      draggable={false}
      dangerouslySetInnerHTML={{ __html: html }}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        const target = event.target;
        if ((event.ctrlKey || event.metaKey) && target instanceof HTMLAnchorElement && /^https:\/\//iu.test(target.href)) {
          event.preventDefault();
          event.stopPropagation();
          vscode.postMessage({ type: 'openLink', href: target.href });
        } else if (target instanceof HTMLAnchorElement) {
          event.preventDefault();
        }
      }}
    />
  );
}

function Root(): React.JSX.Element {
  const [state, setState] = useState<EditorState>();
  useEffect(() => {
    const receive = (event: MessageEvent<ExtensionMessage>): void => {
      if (event.data.type === 'load') {
        setState(event.data.state);
      }
    };
    window.addEventListener('message', receive);
    vscode.postMessage({ type: 'ready' });
    return () => window.removeEventListener('message', receive);
  }, []);
  if (!state) {
    return <main className="loading" aria-live="polite">Loading table…</main>;
  }
  return <TableEditor key={`${state.uri}:${state.tableStartOffset}`} initial={state} />;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<Root />);
}
