import * as assert from 'assert';
import type { TableSnapshot } from '../../core/types';
import {
  axisSelectionRange,
  boundedIndexAtOffset,
  cellReference,
  clampCell,
  columnName,
  columnPixelWidth,
  contiguous,
  continuousSelectionBounds,
  estimatedBodyRowHeight,
  estimatedWrappedLines,
  isCellSelected,
  nearestBoundedIndex,
  parseTsv,
  rangeBounds,
  rangeSelectsWholeAxis,
  usefulMove,
} from '../../webview/gridModel';

const snapshot: TableSnapshot = {
  rows: [['a', 'b', 'c'], ['1', '2', '3']],
  alignments: ['none', 'none', 'none'],
  widths: [3, 3, 3],
  format: { leadingPipe: true, trailingPipe: true, padded: true, eol: '\n' },
};

suite('Grid model', () => {
  test('clamps cells to valid table coordinates', () => {
    assert.deepStrictEqual(clampCell({ row: -2, column: 99 }, snapshot), { row: 0, column: 2 });
    assert.deepStrictEqual(clampCell({ row: 1, column: 1 }, snapshot), { row: 1, column: 1 });
  });

  test('normalizes reverse selection ranges and detects membership', () => {
    const range = { start: { row: 4, column: 5 }, end: { row: 1, column: 2 } };
    assert.deepStrictEqual(rangeBounds(range), { top: 1, bottom: 4, left: 2, right: 5 });
    assert.deepStrictEqual(continuousSelectionBounds([{ start: { row: 2, column: 3 }, end: { row: 2, column: 3 } }]), {
      top: 2, bottom: 2, left: 3, right: 3,
    });
    assert.strictEqual(continuousSelectionBounds([range, range]), undefined);
    assert.strictEqual(isCellSelected(range, 2, 3), true);
    assert.strictEqual(isCellSelected(range, 0, 3), false);
  });

  test('formats spreadsheet column names beyond Z', () => {
    assert.strictEqual(columnName(0), 'A');
    assert.strictEqual(columnName(25), 'Z');
    assert.strictEqual(columnName(26), 'AA');
    assert.strictEqual(columnName(701), 'ZZ');
    assert.strictEqual(columnName(702), 'AAA');
    assert.strictEqual(cellReference({ row: 0, column: 0 }), 'A0');
    assert.strictEqual(cellReference({ row: 12, column: 26 }), 'AA12');
  });

  test('detects contiguous selections and useful drop positions', () => {
    assert.strictEqual(contiguous([4, 2, 3]), true);
    assert.strictEqual(contiguous([2, 4]), false);
    assert.strictEqual(usefulMove([2, 3], 2), false);
    assert.strictEqual(usefulMove([2, 3], 4), false);
    assert.strictEqual(usefulMove([2, 3], 5), true);
    assert.strictEqual(usefulMove([], 1), false);
  });

  test('parses TSV with Windows and classic Mac line endings', () => {
    assert.deepStrictEqual(parseTsv('a\tb\r\nc\td\r'), [['a', 'b'], ['c', 'd']]);
    assert.deepStrictEqual(parseTsv('a\t\n\t'), [['a', ''], ['', '']]);
  });

  test('uses the effective minimum column width when estimating wrapped lines', () => {
    assert.strictEqual(columnPixelWidth(3), 96);
    assert.strictEqual(columnPixelWidth(20), 180);
    assert.strictEqual(estimatedWrappedLines('123456789', 3), 1);
    assert.strictEqual(estimatedWrappedLines('1234567890', 3), 2);
    assert.strictEqual(estimatedWrappedLines('1234567890123456789012345', 3), 3);
  });

  test('sizes a body row from the tallest cell without excessive minimum-width wrapping', () => {
    assert.strictEqual(estimatedBodyRowHeight(['short', '1234567890'], [3, 3]), 55);
    assert.strictEqual(estimatedBodyRowHeight(['1234567890123456789012345', 'short'], [3, 20]), 73);
    assert.strictEqual(estimatedBodyRowHeight(['', ''], [3, 3]), 38);
    assert.strictEqual(estimatedBodyRowHeight([''], [3], 40), 40);
  });

  test('estimates wrapping from rendered Markdown text instead of hidden link destinations', () => {
    assert.strictEqual(estimatedWrappedLines('[short](https://example.com/a/very/long/path/that/is/not/rendered)', 3), 1);
    assert.strictEqual(estimatedBodyRowHeight(['[short](https://example.com/a/very/long/path/that/is/not/rendered)'], [3]), 38);
  });

  test('scales grid geometry without changing wrapping capacity', () => {
    assert.strictEqual(columnPixelWidth(3, 0.5), 48);
    assert.strictEqual(columnPixelWidth(20, 2), 360);
    assert.strictEqual(estimatedBodyRowHeight(['1234567890'], [3], 38, 0.5), 28);
    assert.strictEqual(estimatedBodyRowHeight(['1234567890'], [3], 38, 2), 109);
  });

  test('builds row and column header ranges on one fixed axis', () => {
    assert.deepStrictEqual(axisSelectionRange('row', 3, 1, 5, 4), {
      start: { row: 3, column: 0 }, end: { row: 1, column: 3 },
    });
    assert.deepStrictEqual(axisSelectionRange('column', 2, 0, 5, 4), {
      start: { row: 0, column: 2 }, end: { row: 4, column: 0 },
    });
  });

  test('requires a complete row or column before enabling a second-drag reorder', () => {
    const wholeRow = axisSelectionRange('row', 1, 3, 5, 4);
    const wholeColumn = axisSelectionRange('column', 1, 2, 5, 4);
    assert.strictEqual(rangeSelectsWholeAxis(wholeRow, 'row', 2, 5, 4), true);
    assert.strictEqual(rangeSelectsWholeAxis(wholeRow, 'column', 1, 5, 4), false);
    assert.strictEqual(rangeSelectsWholeAxis(wholeColumn, 'column', 2, 5, 4), true);
  });

  test('finds the nearest valid cell start without crossing the table edge', () => {
    const starts = [0, 80, 200, 260];
    assert.strictEqual(nearestBoundedIndex(starts, 190, 2), 2);
    assert.strictEqual(nearestBoundedIndex(starts, 500, 2), 2);
    assert.strictEqual(nearestBoundedIndex(starts, -100, 2), 0);
  });

  test('keeps a header selection on the cell under an out-of-header pointer', () => {
    const starts = [34, 78, 116, 174];
    assert.strictEqual(boundedIndexAtOffset(starts, 20, 1, 2), 1);
    assert.strictEqual(boundedIndexAtOffset(starts, 115, 1, 2), 1);
    assert.strictEqual(boundedIndexAtOffset(starts, 116, 1, 2), 2);
    assert.strictEqual(boundedIndexAtOffset(starts, 500, 1, 2), 2);
  });
});
