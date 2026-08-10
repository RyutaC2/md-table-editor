export type Alignment = 'none' | 'left' | 'center' | 'right';

export interface OffsetRange {
  start: number;
  end: number;
}

export interface TableFormat {
  leadingPipe: boolean;
  trailingPipe: boolean;
  padded: boolean;
  eol: '\n' | '\r\n' | '\r';
}

export interface TableSnapshot {
  rows: string[][];
  alignments: Alignment[];
  widths: number[];
  format: TableFormat;
}

export interface MarkdownTable extends TableSnapshot {
  startOffset: number;
  endOffset: number;
  startLine: number;
  endLine: number;
  cellRanges: OffsetRange[][];
  originalColumnCounts: number[];
  needsNormalization: boolean;
}

export type TableOperation =
  | { type: 'replace'; snapshot: TableSnapshot }
  | { type: 'setCells'; changes: Array<{ row: number; column: number; value: string }> }
  | { type: 'insertRow'; index: number; count?: number }
  | { type: 'deleteRows'; indexes: number[] }
  | { type: 'moveRows'; indexes: number[]; target: number }
  | { type: 'insertColumn'; index: number; count?: number }
  | { type: 'deleteColumns'; indexes: number[] }
  | { type: 'moveColumns'; indexes: number[]; target: number }
  | { type: 'setAlignment'; column: number; alignment: Alignment }
  | { type: 'setWidth'; column: number; width: number }
  | { type: 'autoFit' }
  | { type: 'sort'; column: number; direction: 'ascending' | 'descending' };
