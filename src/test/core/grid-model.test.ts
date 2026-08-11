import * as assert from 'assert';
import type { TableSnapshot } from '../../core/types';
import { clampCell, columnName, contiguous, isCellSelected, parseTsv, rangeBounds, usefulMove } from '../../webview/gridModel';

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
    assert.strictEqual(isCellSelected(range, 2, 3), true);
    assert.strictEqual(isCellSelected(range, 0, 3), false);
  });

  test('formats spreadsheet column names beyond Z', () => {
    assert.strictEqual(columnName(0), 'A');
    assert.strictEqual(columnName(25), 'Z');
    assert.strictEqual(columnName(26), 'AA');
    assert.strictEqual(columnName(701), 'ZZ');
    assert.strictEqual(columnName(702), 'AAA');
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
});
