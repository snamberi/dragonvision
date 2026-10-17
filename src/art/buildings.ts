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

const DOJO = [
  '.........F..............',
  '.........FRR............',
  '.........FRRR...........',
  '.........F..............',
  '...DDDDDDDDDDDDDDDDDD...',
  '..DddddddddddddddddddD..',
  '.DDDDDDDDDDDDDDDDDDDDDD.',
  'DD....................DD',
  '..WWWWWWWWWWWWWWWWWWWW..',
  '..WPPWWWWWWWWWWWWWWPPW..',
  '..WPPWWWYYYYYYYYWWWPPW..',
  '..WPPWWWYkkkkkkYWWWPPW..',
  '..WPPWWWYYYYYYYYWWWPPW..',
  '..WPPWWWWWWWWWWWWWWPPW..',
  '..WPPWWWBBBBBBBBWWWPPW..',
  '..WPPWWWBbbbbbbBWWWPPW..',
  '..WPPWWWBbbbbbbBWWWPPW..',
  '..WPPWWWBbbbbbbBWWWPPW..',
  '.SSSSSSSSSSSSSSSSSSSSSS.',
  'SssssssssssssssssssssssS',
];

const DOJO_PALETTE: Record<string, string> = {
  F: '#5a3a22',
  R: '#d8432e',
  D: '#3b2a6b',
  d: '#5b3fa8',
  W: '#e9d8b4',
  P: '#8a5a30',
  Y: '#ffd23f',
  k: '#1b1530',
  B: '#5a3a22',
  b: '#2a1d12',
  S: '#8f8aa8',
  s: '#5f5a7a',
};

const LAB = [
  '..........GGGG..........',
  '........GGggggGG........',
  '.......GggggggggG.......',
  '......GggggwwgggggG.....',
  '......GgggggwgggggG.....',
  '.....MMMMMMMMMMMMMMM....',
  '.....MmmmmmmmmmmmmmM....',
  '..T..MmCCmmmmmmCCmmM..T.',
  '..T..MmCCmmmmmmCCmmM..T.',
  '.TtT.MmmmmmmmmmmmmmM.TtT',
  '.TtT.MmmmmBBBBmmmmmM.TtT',
  '.TtT.MmmmmBbbBmmmmmM.TtT',
  '.TtT.MmmmmBbbBmmmmmM.TtT',
  '.TTT.MmmmmBbbBmmmmmM.TTT',
  '.SSSSSSSSSSSSSSSSSSSSSSS',
  'SssssssssssssssssssssssS',
];

const LAB_PALETTE: Record<string, string> = {
  G: '#3fc6ff',
  g: '#9ae6ff',
  w: '#ffffff',
  M: '#3a3f4b',
  m: '#6b7080',
  C: '#4ade80',
  B: '#22252d',
  b: '#7fe7ff',
  T: '#5f5a7a',
  t: '#b6f28c',
  S: '#8f8aa8',
  s: '#5f5a7a',
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
export const dojoUrl = () => paintAscii('dojo', DOJO, DOJO_PALETTE);
export const labUrl = () => paintAscii('lab', LAB, LAB_PALETTE);
