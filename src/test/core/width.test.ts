import * as assert from 'assert';
import { displayWidth, padToDisplayWidth } from '../../core/width';

suite('Unicode display width edge cases', () => {
  test('counts printable ASCII through the narrow fast path', () => {
    assert.strictEqual(displayWidth('Markdown 123 | ---'), 18);
    assert.strictEqual(displayWidth(''), 0);
  });

  test('counts combining sequences as one cell', () => {
    assert.strictEqual(displayWidth('e\u0301'), 1);
    assert.strictEqual(displayWidth('\u0301'), 0);
  });

  test('counts emoji grapheme clusters, flags, and keycaps as two cells', () => {
    assert.strictEqual(displayWidth('👨‍👩‍👧‍👦'), 2);
    assert.strictEqual(displayWidth('🇯🇵'), 2);
    assert.strictEqual(displayWidth('1️⃣'), 2);
  });

  test('counts mixed narrow and wide text', () => {
    assert.strictEqual(displayWidth('A表😀B'), 6);
  });

  test('pads according to display width without truncating', () => {
    assert.strictEqual(padToDisplayWidth('表', 4), '表  ');
    assert.strictEqual(padToDisplayWidth('long', 2), 'long');
  });
});
