import * as assert from 'assert';
import { findTableAtOffset, parseMarkdownTables } from '../../core/parser';

suite('Markdown table parser edge cases', () => {
  test('finds multiple tables with exact source ranges', () => {
    const source = [
      'before',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      'between',
      '',
      'x | y',
      '--- | ---',
      '3 | 4',
      'after',
    ].join('\n');
    const tables = parseMarkdownTables(source);
    assert.strictEqual(tables.length, 2);
    assert.strictEqual(source.slice(tables[0].startOffset, tables[0].endOffset), '| a | b |\n| --- | --- |\n| 1 | 2 |');
    assert.strictEqual(source.slice(tables[1].startOffset, tables[1].endOffset), 'x | y\n--- | ---\n3 | 4');
    assert.strictEqual(findTableAtOffset(source, source.indexOf('1'))?.startLine, 1);
    assert.strictEqual(findTableAtOffset(source, source.indexOf('between')), undefined);
  });

  test('accepts up to three leading spaces but rejects indented code', () => {
    const valid = '   | a | b |\n   | --- | --- |\n   | 1 | 2 |';
    assert.strictEqual(parseMarkdownTables(valid).length, 1);

    const indentedDelimiter = '| a | b |\n    | --- | --- |\n    | 1 | 2 |';
    assert.strictEqual(parseMarkdownTables(indentedDelimiter).length, 0);

    const indentedHeader = '\t| a | b |\n\t| --- | --- |';
    assert.strictEqual(parseMarkdownTables(indentedHeader).length, 0);
  });

  test('stops before an indented code row containing pipes', () => {
    const source = '| a | b |\n| --- | --- |\n| 1 | 2 |\n    | code | row |\nafter';
    const [table] = parseMarkdownTables(source);
    assert.deepStrictEqual(table.rows, [['a', 'b'], ['1', '2']]);
    assert.strictEqual(table.endLine, 2);
  });

  test('ignores tilde fences and unterminated backtick fences', () => {
    const source = [
      '~~~markdown',
      '| no | table |',
      '| --- | --- |',
      '~~~',
      '',
      '```markdown',
      '| still | fenced |',
      '| --- | --- |',
    ].join('\n');
    assert.deepStrictEqual(parseMarkdownTables(source), []);
  });

  test('keeps escaped pipes inside cells and reports source cell ranges', () => {
    const source = '| a\\|b | c |\n| --- | --- |\n| x | y |';
    const [table] = parseMarkdownTables(source);
    assert.deepStrictEqual(table.rows[0], ['a\\|b', 'c']);
    assert.strictEqual(source.slice(table.cellRanges[0][0].start, table.cellRanges[0][0].end), 'a\\|b');
    assert.strictEqual(source.slice(table.cellRanges[1][1].start, table.cellRanges[1][1].end), 'y');
  });

  test('rejects malformed delimiter rows', () => {
    assert.strictEqual(parseMarkdownTables('| a | b |\n| -- | --- |').length, 0);
    assert.strictEqual(parseMarkdownTables('| a | b |\n| ---x | --- |').length, 0);
    assert.strictEqual(parseMarkdownTables('| a | b |\nno delimiter').length, 0);
  });

  test('preserves CR-only line endings', () => {
    const [table] = parseMarkdownTables('| a |\r| --- |\r| b |');
    assert.strictEqual(table.format.eol, '\r');
    assert.deepStrictEqual(table.rows, [['a'], ['b']]);
  });
});
