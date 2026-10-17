// Pixel buildings drawn from ASCII maps: each character is one pixel, '.' is empty.

const SHRINE = [
  '...........YY...........',
  '..........YYYY..........',
  '....RRRRRRRRRRRRRRRR....',
  '..RRRRRRRRRRRRRRRRRRRR..',
  'RRDDDDDDDDDDDDDDDDDDDDRR',
  '....YYYYYYYYYYYYYYYY....',
  '.....P.WWWWWWWWWW.P.....',
  '.....P.WWWGGGGWWW.P.....',
  '.....P.WWGGGGGGWW.P.....',
  '...RRRRRRRRRRRRRRRRRR...',
  '.RRRRRRRRRRRRRRRRRRRRRR.',
  'RDDDDDDDDDDDDDDDDDDDDDDR',
  '...YYYYYYYYYYYYYYYYYY...',
  '....PWWWWWWWWWWWWWWP....',
  '....PWWWWBBBBBBWWWWP....',
  '....PWWWWBGGGGBWWWWP....',
  '....PWWWWBGGGGBWWWWP....',
  '....PWWWWBGGGGBWWWWP....',
  '..SSSSSSSSSSSSSSSSSSSS..',
  '.SssssssssssssssssssssS.',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
];

const SHRINE_PALETTE: Record<string, string> = {
  R: '#d8432e',
  D: '#8a2418',
  Y: '#ffd23f',
  W: '#f4ecd8',
  P: '#b8321f',
  B: '#2a1d55',
  G: '#b794ff',
  S: '#8f8aa8',
  s: '#5f5a7a',
};

const LOT = [
  '..YYYYYYYYYYYY..',
  '..YWWWWWWWWWWY..',
  '..YWkkWkkWkkWY..',
  '..YWWWWWWWWWWY..',
  '..YYYYYYYYYYYY..',
  '.......PP.......',
  '.......PP.......',
  '.......PP.......',
  '.......PP.......',
  '..gggggggggggg..',
  '.gGgGgGgGgGgGgg.',
];

const LOT_PALETTE: Record<string, string> = {
  Y: '#c9a227',
  W: '#e9e4d4',
  k: '#5a3a22',
  P: '#7a5230',
  g: '#3f7a3a',
  G: '#5aa04f',
};

const cache = new Map<string, string>();

function paintAscii(key: string, rows: string[], palette: Record<string, string>): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map((r) => r.length));
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

export const shrineUrl = () => paintAscii('shrine', SHRINE, SHRINE_PALETTE);
export const lotUrl = () => paintAscii('lot', LOT, LOT_PALETTE);
