import type { TableOperation, TableSnapshot } from '../core/types';

export interface CellPosition {
  row: number;
  column: number;
}

export interface EditorState {
  uri: string;
  tableStartOffset: number;
  documentVersion: number;
  snapshot: TableSnapshot;
  selection?: CellPosition;
  language: 'en' | 'ja';
  oversized: boolean;
  startEditing?: boolean;
}

export type ExtensionMessage =
  | { type: 'load'; state: EditorState }
  | { type: 'selection'; selection: CellPosition }
  | { type: 'notice'; level: 'info' | 'warning' | 'error'; message: string };

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'operation'; documentVersion: number; operation: TableOperation; selection?: CellPosition }
  | { type: 'revealCell'; cell: CellPosition }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'openLink'; href: string };

export interface PersistedPanelState {
  uri: string;
  tableStartOffset: number;
}
