const combiningMark = /\p{Mark}/u;
const wideCharacter = /[\u1100-\u115f\u2329\u232a\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff00-\uff60\uffe0-\uffe6]/u;
const emoji = /\p{Extended_Pictographic}/u;

export function displayWidth(value: string): number {
  let width = 0;
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : undefined;
  const segments = segmenter
    ? Array.from(segmenter.segment(value), ({ segment }) => segment)
    : Array.from(value);

  for (const segment of segments) {
    const first = Array.from(segment).find((character) => !combiningMark.test(character));
    if (!first) {
      continue;
    }
    width += wideCharacter.test(first) || emoji.test(segment) ? 2 : 1;
  }
  return width;
}

export function padToDisplayWidth(value: string, width: number): string {
  return value + ' '.repeat(Math.max(0, width - displayWidth(value)));
}
