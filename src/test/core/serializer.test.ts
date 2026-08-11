import * as assert from 'assert';
import { parseMarkdownTables } from '../../core/parser';
import { createTableMarkdown, escapeCell, serializeTable } from '../../core/serializer';
import type { TableSnapshot } from '../../core/types';

function snapshot(overrides: Partial<TableSnapshot> = {}): TableSnapshot {
  return {
    rows: [['a', 'b'], ['1', '2']],
    alignments: ['none', 'none'],
    widths: [3, 3],
    format: { leadingPipe: true, trailingPipe: true, padded: true, eol: '\n' },
    ...overrides,
  };
}

suite('Markdown table serializer edge cases', () => {
  test('serializes all alignment delimiters', () => {
    const value = serializeTable(snapshot({
      rows: [['left', 'center', 'right', 'none']],
      alignments: ['left', 'center', 'right', 'none'],
      widths: [3, 3, 3, 3],
    }));
    assert.strictEqual(value.split('\n')[1], '| :--- | :---: | ---: | --- |');
  });

  test('preserves unpadded rows without outer pipes and CRLF', () => {
    const value = serializeTable(snapshot({
      format: { leadingPipe: false, trailingPipe: false, padded: false, eol: '\r\n' },
      alignments: ['none', 'center'],
    }));
    assert.strictEqual(value, 'a|b\r\n---|:---:\r\n1|2');
  });

  test('escapes unescaped pipes and flattens line breaks', () => {
    assert.strictEqual(escapeCell('a|b\nc\\|d\r\ne'), 'a\\|b c\\|d e');
  });

  test('normalizes missing width and alignment metadata during serialization', () => {
    const value = serializeTable(snapshot({
      rows: [['a', 'b', 'c']],
      widths: [3],
      alignments: [],
    }));
    const [parsed] = parseMarkdownTables(value);
    assert.deepStrictEqual(parsed.rows, [['a', 'b', 'c']]);
    assert.deepStrictEqual(parsed.widths, [3, 3, 3]);
    assert.deepStrictEqual(parsed.alignments, ['none', 'none', 'none']);
  });

  test('clamps generated table dimensions and uses the requested EOL', () => {
    const smallest = parseMarkdownTables(createTableMarkdown(0, 0, '\r\n'))[0];
    assert.strictEqual(smallest.rows.length, 1);
    assert.strictEqual(smallest.widths.length, 1);
    assert.strictEqual(smallest.format.eol, '\r\n');

    const largest = parseMarkdownTables(createTableMarkdown(99, 99))[0];
    assert.strictEqual(largest.rows.length, 8);
    assert.strictEqual(largest.widths.length, 8);
  });

  test('round-trips supported formatting and cell content', () => {
    const original = 'name | value\n:--- | ---:\nA\\|B | **bold**';
    const parsed = parseMarkdownTables(original)[0];
    const reparsed = parseMarkdownTables(serializeTable(parsed))[0];
    assert.deepStrictEqual(reparsed.rows, parsed.rows);
    assert.deepStrictEqual(reparsed.alignments, parsed.alignments);
    assert.deepStrictEqual(reparsed.widths, parsed.widths);
    assert.deepStrictEqual(reparsed.format, parsed.format);
  });
});
