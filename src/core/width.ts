const combiningMark = /\p{Mark}/u;
const wideCharacter = /[\u1100-\u115f\u2329\u232a\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/u;
const emoji = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\uFE0F/u;
const simpleNarrowText = /^[\u0020-\u007e]*$/u;
const graphemeSegmenter = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : undefined;

export function displayWidth(value: string): number {
  if (simpleNarrowText.test(value)) {
    return value.length;
  }
  let width = 0;
  const addSegment = (segment: string): void => {
    let first: string | undefined;
    for (const character of segment) {
      if (!combiningMark.test(character)) {
        first = character;
        break;
      }
    }
    if (!first) {
      return;
    }
    width += wideCharacter.test(first) || emoji.test(segment) ? 2 : 1;
  };
  if (graphemeSegmenter) {
    for (const { segment } of graphemeSegmenter.segment(value)) {
      addSegment(segment);
    }
  } else {
    for (const segment of value) {
      addSegment(segment);
    }
  }
  return width;
}

export function padToDisplayWidth(value: string, width: number): string {
  return value + ' '.repeat(Math.max(0, width - displayWidth(value)));
}
