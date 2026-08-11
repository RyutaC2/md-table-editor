import * as assert from 'assert';
import { hasExceededDragThreshold, scrollPositionForPan, visibleCellAlignment } from '../../webview/interaction';

suite('Grid pointer interaction', () => {
  test('uses left alignment for unspecified columns and preserves explicit alignment', () => {
    assert.strictEqual(visibleCellAlignment('none'), 'left');
    assert.strictEqual(visibleCellAlignment('left'), 'left');
    assert.strictEqual(visibleCellAlignment('center'), 'center');
    assert.strictEqual(visibleCellAlignment('right'), 'right');
  });

  test('starts a selection drag only after reaching the movement threshold', () => {
    assert.strictEqual(hasExceededDragThreshold({ x: 10, y: 10 }, { x: 13, y: 13 }, 5), false);
    assert.strictEqual(hasExceededDragThreshold({ x: 10, y: 10 }, { x: 13, y: 14 }, 5), true);
  });

  test('pans the scroll position opposite to the pointer movement', () => {
    assert.deepStrictEqual(
      scrollPositionForPan({ left: 120, top: 80 }, { x: 20, y: 30 }, { x: 5, y: 50 }),
      { left: 135, top: 60 },
    );
  });
});
