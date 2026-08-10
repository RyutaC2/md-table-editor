import * as assert from 'assert';
import { applyOperation } from '../../core/operations';
import { parseMarkdownTables } from '../../core/parser';
import { createTableMarkdown, serializeTable } from '../../core/serializer';
import { displayWidth } from '../../core/width';

suite('Markdown table core', () => {
  test('parses table style, alignment, escapes and CRLF', () => {
    const source = 'before\r\n| name | value |\r\n| :--- | ---: |\r\n| A\\|B | 1 |\r\nafter';
    const [table] = parseMarkdownTables(source);
    assert.ok(table);
    assert.deepStrictEqual(table.rows, [['name', 'value'], ['A\\|B', '1']]);
    assert.deepStrictEqual(table.alignments, ['left', 'right']);
    assert.deepStrictEqual(table.widths, [3, 3]);
    assert.strictEqual(table.format.eol, '\r\n');
    assert.strictEqual(source.slice(table.startOffset, table.endOffset), '| name | value |\r\n| :--- | ---: |\r\n| A\\|B | 1 |');
  });

  test('ignores fenced code and normalizes uneven body rows lazily', () => {
    const source = '```md\n| no | table |\n| --- | --- |\n```\n\na|b\n---|---\n1|2|3';
    const [table] = parseMarkdownTables(source);
    assert.strictEqual(parseMarkdownTables(source).length, 1);
    assert.strictEqual(table.startLine, 5);
    assert.strictEqual(table.needsNormalization, true);
    assert.deepStrictEqual(table.rows[0], ['a', 'b', '']);
    assert.deepStrictEqual(table.rows[1], ['1', '2', '3']);
  });

  test('serializes without changing outer pipe style', () => {
    const [table] = parseMarkdownTables('a | b\n--- | :---:\nx | y');
    const output = serializeTable(table);
    assert.ok(!output.startsWith('|'));
    assert.ok(!output.split('\n')[0].endsWith('|'));
    assert.match(output.split('\n')[1], /:---:/u);
  });

  test('creates the requested blank table', () => {
    const value = createTableMarkdown(3, 3);
    assert.strictEqual(value.split('\n').length, 4);
    assert.deepStrictEqual(parseMarkdownTables(value)[0].rows, [
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ]);
  });

  test('applies numeric sorting with empty values last', () => {
    const [table] = parseMarkdownTables('| n |\n| --- |\n| 10 |\n| |\n| 2 |');
    const sorted = applyOperation(table, { type: 'sort', column: 0, direction: 'ascending' });
    assert.deepStrictEqual(sorted.rows.map((row) => row[0]), ['n', '2', '10', '']);
  });

  test('measures full-width text and emoji', () => {
    assert.strictEqual(displayWidth('abc'), 3);
    assert.strictEqual(displayWidth('表A'), 3);
    assert.strictEqual(displayWidth('😀'), 2);
  });
});
