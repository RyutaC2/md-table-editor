import * as assert from 'assert';
import {
  readTabularWorkbook,
  snapshotFromTabularRows,
  workbookRows,
  writeTabularFile,
} from '../../core/tabularFiles';
import type { TableSnapshot } from '../../core/types';

const source: TableSnapshot = {
  rows: [['Name', 'Note'], ['alpha', 'comma, quote "'], ['日本語', 'line break']],
  alignments: ['left', 'center'],
  widths: [8, 14],
  format: { leadingPipe: true, trailingPipe: true, padded: true, eol: '\n' },
};

suite('CSV and XLSX table files', () => {
  for (const type of ['csv', 'xlsx'] as const) {
    test(`round-trips a complete table through ${type.toUpperCase()}`, () => {
      const data = writeTabularFile(source, type);
      const workbook = readTabularWorkbook(data, type);
      assert.ok(workbook.SheetNames.length >= 1);
      assert.deepStrictEqual(workbookRows(workbook, workbook.SheetNames[0]), source.rows);
    });
  }

  test('normalizes uneven imported rows and flattens line breaks for Markdown', () => {
    const snapshot = snapshotFromTabularRows([['a'], ['b', 'line\nbreak']], source.format);
    assert.deepStrictEqual(snapshot.rows, [['a', ''], ['b', 'line break']]);
    assert.deepStrictEqual(snapshot.alignments, ['none', 'none']);
    assert.deepStrictEqual(snapshot.widths, [3, 3]);
    assert.deepStrictEqual(snapshot.format, source.format);
  });
});
