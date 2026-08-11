interface Point {
  x: number;
  y: number;
}

interface ScrollPosition {
  left: number;
  top: number;
}

export function hasExceededDragThreshold(start: Point, current: Point, threshold: number): boolean {
  return Math.hypot(current.x - start.x, current.y - start.y) >= threshold;
}

export function scrollPositionForPan(
  initial: ScrollPosition,
  start: Point,
  current: Point,
): ScrollPosition {
  return {
    left: initial.left - (current.x - start.x),
    top: initial.top - (current.y - start.y),
  };
}
