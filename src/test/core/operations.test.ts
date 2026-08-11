import * as assert from 'assert';
import { applyOperation } from '../../core/operations';
import type { TableSnapshot } from '../../core/types';

function snapshot(): TableSnapshot {
  return {
    rows: [
      ['h1', 'h2', 'h3'],
      ['a', '10', 'x'],
      ['b', '', 'y'],
      ['c', '2', 'z'],
    ],
    alignments: ['left', 'center', 'right'],
    widths: [3, 4, 5],
    format: { leadingPipe: true, trailingPipe: true, padded: true, eol: '\n' },
  };
}

suite('Markdown table operations edge cases', () => {
  test('does not mutate the source snapshot', () => {
    const source = snapshot();
    const before = structuredClone(source);
    const updated = applyOperation(source, { type: 'setCells', changes: [{ row: 1, column: 0, value: 'changed' }] });
    assert.deepStrictEqual(source, before);
    assert.notStrictEqual(updated, source);
    assert.strictEqual(updated.rows[1][0], 'changed');
  });

  test('sets valid cells, flattens newlines, and ignores invalid coordinates', () => {
    const updated = applyOperation(snapshot(), {
      type: 'setCells',
      changes: [
        { row: 1, column: 0, value: 'a\nb\r\nc' },
        { row: -1, column: 0, value: 'ignored' },
        { row: 99, column: 99, value: 'ignored' },
      ],
    });
    assert.strictEqual(updated.rows[1][0], 'a b c');
    assert.strictEqual(updated.rows[0][0], 'h1');
  });

  test('moves a cell rectangle without losing overlapping values', () => {
    const updated = applyOperation(snapshot(), {
      type: 'moveCells',
      source: { top: 1, bottom: 2, left: 0, right: 1 },
      target: { row: 2, column: 1 },
    });
    assert.deepStrictEqual(updated.rows, [
      ['h1', 'h2', 'h3'],
      ['', '', 'x'],
      ['', 'a', '10'],
      ['c', 'b', ''],
    ]);
  });

  test('moves one selected cell with the same operation as a rectangular range', () => {
    const updated = applyOperation(snapshot(), {
      type: 'moveCells',
      source: { top: 1, bottom: 1, left: 0, right: 0 },
      target: { row: 2, column: 2 },
    });
    assert.strictEqual(updated.rows[1][0], '');
    assert.strictEqual(updated.rows[2][2], 'a');
  });

  test('rejects cell moves that would cross a table edge', () => {
    const source = snapshot();
    const updated = applyOperation(source, {
      type: 'moveCells',
      source: { top: 1, bottom: 2, left: 1, right: 2 },
      target: { row: 3, column: 2 },
    });
    assert.deepStrictEqual(updated, source);
  });

  test('keeps the header while inserting and deleting rows at bounded indexes', () => {
    const inserted = applyOperation(snapshot(), { type: 'insertRow', index: Number.NaN, count: Number.NaN });
    assert.strictEqual(inserted.rows.length, 5);
    assert.deepStrictEqual(inserted.rows.at(-1), ['', '', '']);

    const deleted = applyOperation(inserted, { type: 'deleteRows', indexes: [0, 1, 1, -1, 99] });
    assert.deepStrictEqual(deleted.rows[0], ['h1', 'h2', 'h3']);
    assert.strictEqual(deleted.rows.length, 4);
  });

  test('inserts non-finite column requests safely at the end', () => {
    const updated = applyOperation(snapshot(), { type: 'insertColumn', index: Number.POSITIVE_INFINITY, count: Number.NaN });
    assert.strictEqual(updated.widths.length, 4);
    assert.deepStrictEqual(updated.rows.map((row) => row.at(-1)), ['', '', '', '']);
    assert.strictEqual(updated.alignments.at(-1), 'none');
  });

  test('never deletes every column and keeps metadata synchronized', () => {
    const updated = applyOperation(snapshot(), { type: 'deleteColumns', indexes: [0, 1, 2, 2] });
    assert.deepStrictEqual(updated.rows.map((row) => row[0]), ['h3', 'x', 'y', 'z']);
    assert.deepStrictEqual(updated.widths, [5]);
    assert.deepStrictEqual(updated.alignments, ['right']);
  });

  test('moves row blocks without moving the header', () => {
    const updated = applyOperation(snapshot(), { type: 'moveRows', indexes: [1, 2], target: 4 });
    assert.deepStrictEqual(updated.rows.map((row) => row[0]), ['h1', 'c', 'a', 'b']);
  });

  test('moves columns with duplicate and unordered indexes', () => {
    const updated = applyOperation(snapshot(), { type: 'moveColumns', indexes: [2, 0, 2], target: 3 });
    assert.deepStrictEqual(updated.rows[0], ['h2', 'h1', 'h3']);
    assert.deepStrictEqual(updated.widths, [4, 3, 5]);
    assert.deepStrictEqual(updated.alignments, ['center', 'left', 'right']);
  });

  test('sets the alignment of every column in one operation', () => {
    const updated = applyOperation(snapshot(), { type: 'setAllAlignments', alignment: 'center' });
    assert.deepStrictEqual(updated.alignments, ['center', 'center', 'center']);
  });

  test('ignores non-finite widths and floors valid widths', () => {
    assert.deepStrictEqual(applyOperation(snapshot(), { type: 'setWidth', column: 0, width: Number.NaN }).widths, [3, 4, 5]);
    assert.deepStrictEqual(applyOperation(snapshot(), { type: 'setWidth', column: 0, width: Number.POSITIVE_INFINITY }).widths, [3, 4, 5]);
    assert.deepStrictEqual(applyOperation(snapshot(), { type: 'setWidth', column: 1, width: 8.9 }).widths, [3, 8, 5]);
  });

  test('auto-fits one or all columns using display width', () => {
    const source = snapshot();
    source.rows[2][0] = '全角';
    assert.deepStrictEqual(applyOperation(source, { type: 'autoFitColumn', column: 0 }).widths, [4, 4, 5]);
    assert.deepStrictEqual(applyOperation(source, { type: 'autoFit' }).widths, [4, 3, 3]);
  });

  test('sorts numerically in both directions and always leaves empty values last', () => {
    const ascending = applyOperation(snapshot(), { type: 'sort', column: 1, direction: 'ascending' });
    assert.deepStrictEqual(ascending.rows.slice(1).map((row) => row[1]), ['2', '10', '']);
    const descending = applyOperation(snapshot(), { type: 'sort', column: 1, direction: 'descending' });
    assert.deepStrictEqual(descending.rows.slice(1).map((row) => row[1]), ['10', '2', '']);
  });

  test('normalizes replacement snapshots with uneven rows and missing metadata', () => {
    const updated = applyOperation(snapshot(), {
      type: 'replace',
      snapshot: {
        rows: [['a'], ['b', 'c', 'd']],
        widths: [],
        alignments: [],
        format: snapshot().format,
      },
    });
    assert.deepStrictEqual(updated.rows, [['a', '', ''], ['b', 'c', 'd']]);
    assert.deepStrictEqual(updated.widths, [3, 3, 3]);
    assert.deepStrictEqual(updated.alignments, ['none', 'none', 'none']);
  });
});
