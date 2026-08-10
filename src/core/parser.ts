import type { Alignment, MarkdownTable, OffsetRange } from './types';

interface SourceLine {
  text: string;
  start: number;
  end: number;
  eol: '' | '\n' | '\r\n' | '\r';
}

interface ParsedRow {
  cells: string[];
  ranges: OffsetRange[];
  leadingPipe: boolean;
  trailingPipe: boolean;
  padded: boolean;
}

function sourceLines(source: string): SourceLine[] {
  const lines: SourceLine[] = [];
  let start = 0;
  const pattern = /\r\n|\n|\r/g;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    lines.push({
      text: source.slice(start, match.index),
      start,
      end: match.index,
      eol: match[0] as '\n' | '\r\n' | '\r',
    });
    start = match.index + match[0].length;
  }
  if (start <= source.length) {
    lines.push({ text: source.slice(start), start, end: source.length, eol: '' });
  }
  return lines;
}

function escapedAt(value: string, index: number): boolean {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && value[cursor] === '\\'; cursor -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}

function unescapedPipeIndexes(value: string): number[] {
  const indexes: number[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '|' && !escapedAt(value, index)) {
      indexes.push(index);
    }
  }
  return indexes;
}

function parseRow(line: SourceLine): ParsedRow | undefined {
  const pipes = unescapedPipeIndexes(line.text);
  if (pipes.length === 0) {
    return undefined;
  }

  const firstContent = line.text.search(/\S/u);
  const lastContent = line.text.search(/\S\s*$/u);
  const leadingPipe = firstContent >= 0 && line.text[firstContent] === '|';
  const trailingPipe = lastContent >= 0 && line.text[lastContent] === '|' && !escapedAt(line.text, lastContent);
  const contentStart = leadingPipe ? firstContent + 1 : 0;
  const contentEnd = trailingPipe ? lastContent : line.text.length;
  const separators = pipes.filter((index) => index >= contentStart && index < contentEnd);
  const boundaries = [contentStart, ...separators, contentEnd];
  const cells: string[] = [];
  const ranges: OffsetRange[] = [];
  let padded = true;

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const rawStart = boundaries[index] + (index === 0 ? 0 : 1);
    const rawEnd = boundaries[index + 1];
    const raw = line.text.slice(rawStart, rawEnd);
    const left = raw.match(/^\s*/u)?.[0].length ?? 0;
    const right = raw.match(/\s*$/u)?.[0].length ?? 0;
    const valueEnd = Math.max(rawStart + left, rawEnd - right);
    cells.push(raw.trim());
    ranges.push({ start: line.start + rawStart + left, end: line.start + valueEnd });
    padded = padded && left > 0 && right > 0;
  }

  return { cells, ranges, leadingPipe, trailingPipe, padded };
}

function parseDelimiter(cells: string[]): { alignments: Alignment[]; widths: number[] } | undefined {
  const alignments: Alignment[] = [];
  const widths: number[] = [];
  for (const cell of cells) {
    const value = cell.trim();
    if (!/^:?-{3,}:?$/u.test(value)) {
      return undefined;
    }
    const left = value.startsWith(':');
    const right = value.endsWith(':');
    alignments.push(left && right ? 'center' : left ? 'left' : right ? 'right' : 'none');
    widths.push((value.match(/-/gu) ?? []).length);
  }
  return { alignments, widths };
}

function fencedLines(lines: SourceLine[]): boolean[] {
  const result = Array.from({ length: lines.length }, () => false);
  let fence: { character: '`' | '~'; length: number } | undefined;
  lines.forEach((line, index) => {
    const match = line.text.match(/^ {0,3}(`{3,}|~{3,})/u);
    if (!fence && match) {
      const marker = match[1];
      fence = { character: marker[0] as '`' | '~', length: marker.length };
      result[index] = true;
      return;
    }
    if (fence) {
      result[index] = true;
      const close = line.text.match(/^ {0,3}(`+|~+)\s*$/u)?.[1];
      if (close && close[0] === fence.character && close.length >= fence.length) {
        fence = undefined;
      }
    }
  });
  return result;
}

function padRows(rows: string[][], ranges: OffsetRange[][], count: number): void {
  rows.forEach((row, rowIndex) => {
    const fallback = ranges[rowIndex].at(-1)?.end ?? 0;
    while (row.length < count) {
      row.push('');
      ranges[rowIndex].push({ start: fallback, end: fallback });
    }
  });
}

export function parseMarkdownTables(source: string): MarkdownTable[] {
  const lines = sourceLines(source);
  const fenced = fencedLines(lines);
  const tables: MarkdownTable[] = [];

  for (let lineIndex = 0; lineIndex < lines.length - 1; lineIndex += 1) {
    if (fenced[lineIndex] || fenced[lineIndex + 1] || /^ {4}/u.test(lines[lineIndex].text)) {
      continue;
    }
    const header = parseRow(lines[lineIndex]);
    const delimiterRow = parseRow(lines[lineIndex + 1]);
    if (!header || !delimiterRow || header.cells.length !== delimiterRow.cells.length) {
      continue;
    }
    const delimiter = parseDelimiter(delimiterRow.cells);
    if (!delimiter) {
      continue;
    }

    const rows = [header.cells];
    const ranges = [header.ranges];
    const originalColumnCounts = [header.cells.length];
    let endLine = lineIndex + 1;
    for (let bodyLine = lineIndex + 2; bodyLine < lines.length; bodyLine += 1) {
      if (fenced[bodyLine] || lines[bodyLine].text.trim() === '') {
        break;
      }
      const body = parseRow(lines[bodyLine]);
      if (!body) {
        break;
      }
      rows.push(body.cells);
      ranges.push(body.ranges);
      originalColumnCounts.push(body.cells.length);
      endLine = bodyLine;
    }

    const columnCount = Math.max(delimiter.widths.length, ...rows.map((row) => row.length));
    const needsNormalization = originalColumnCounts.some((count) => count !== columnCount)
      || delimiter.widths.length !== columnCount;
    padRows(rows, ranges, columnCount);
    while (delimiter.alignments.length < columnCount) {
      delimiter.alignments.push('none');
      delimiter.widths.push(3);
    }

    tables.push({
      rows,
      alignments: delimiter.alignments,
      widths: delimiter.widths,
      format: {
        leadingPipe: header.leadingPipe,
        trailingPipe: header.trailingPipe,
        padded: header.padded,
        eol: lines[lineIndex].eol || '\n',
      },
      startOffset: lines[lineIndex].start,
      endOffset: lines[endLine].end,
      startLine: lineIndex,
      endLine,
      cellRanges: ranges,
      originalColumnCounts,
      needsNormalization,
    });
    lineIndex = endLine;
  }
  return tables;
}

export function findTableAtOffset(source: string, offset: number): MarkdownTable | undefined {
  return parseMarkdownTables(source).find((table) => offset >= table.startOffset && offset <= table.endOffset);
}
