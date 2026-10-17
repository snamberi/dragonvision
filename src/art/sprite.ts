import type { Look } from '../game/types';

// Procedural 32×32 chibi fighters: big head, big eyes, short body. These are
// placeholders until hand-drawn sprites exist; any form can swap to a real image
// later without touching game logic. Sprites face right.

export const SPRITE_SIZE = 32;
const OUTLINE = '#120b2e';
const EYE = '#1b1530';
const EYE_SHINE = '#ffffff';
const MOUTH = '#8a3a2a';

type Grid = (string | null)[][];

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 255;
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function painter(grid: Grid) {
  const set = (x: number, y: number, c: string | null) => {
    if (x >= 0 && y >= 0 && x < SPRITE_SIZE && y < SPRITE_SIZE) grid[y][x] = c;
  };
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c);
  };
  /** Fills each column from its top row down to `bottom`. */
  const heights = (tops: Record<number, number>, bottom: number, c: string) => {
    for (const [x, top] of Object.entries(tops)) rect(Number(x), top, 1, bottom - top + 1, c);
  };
  return { set, rect, heights };
}

// Head box: x 10–21, y 6–16. Hair tops are per column, filled down to the brow line.
const SPIKY: Record<number, number> = {
  9: 8, 10: 4, 11: 5, 12: 2, 13: 4, 14: 0, 15: 3, 16: 1, 17: 3, 18: 2, 19: 4, 20: 4, 21: 6, 22: 8,
};
const CAP: Record<number, number> = { 10: 7, 11: 5, 12: 4, 13: 4, 14: 3, 15: 3, 16: 3, 17: 3, 18: 4, 19: 4, 20: 5, 21: 7 };

function raise(tops: Record<number, number>, by: number): Record<number, number> {
  return Object.fromEntries(Object.entries(tops).map(([x, y]) => [x, Math.max(0, y - by)]));
}

export function paintFighter(look: Look): Grid {
  const grid: Grid = Array.from({ length: SPRITE_SIZE }, () => Array<string | null>(SPRITE_SIZE).fill(null));
  const { set, rect, heights } = painter(grid);
  const hair = look.hair;
  const hairDark = shade(hair, -0.3);
  const outfitDark = shade(look.outfit, -0.3);
  const outfitLight = shade(look.outfit, 0.25);
  const skinDark = shade(look.skin, -0.2);
  const bootsDark = shade(look.boots, -0.3);

  // Hair that hangs behind the head and body.
  if (look.hairStyle === 'long') rect(7, 8, 5, 16, hairDark);
  if (look.hairStyle === 'ponytail') {
    rect(6, 7, 5, 4, hairDark);
    rect(5, 11, 4, 9, hairDark);
  }
  if (look.hairStyle === 'braids') {
    rect(8, 10, 2, 12, hairDark);
    rect(8, 22, 2, 1, look.accent);
  }
  if (look.hairStyle === 'bob') rect(9, 8, 3, 9, hairDark);

  // Legs and boots.
  rect(12, 24, 3, 4, outfitDark);
  rect(17, 24, 3, 4, look.outfit);
  rect(11, 28, 4, 3, bootsDark);
  rect(17, 28, 4, 3, look.boots);
  rect(20, 29, 1, 2, bootsDark);

  // Back arm.
  rect(9, 17, 2, 3, outfitDark);
  rect(9, 20, 2, 2, skinDark);

  // Torso: shaded back edge, collar, sash.
  rect(11, 17, 10, 7, look.outfit);
  rect(11, 17, 2, 7, outfitDark);
  rect(18, 18, 2, 3, outfitLight);
  rect(15, 17, 2, 2, look.accent);
  rect(11, 22, 10, 2, look.accent);
  set(19, 23, shade(look.accent, -0.3));
  set(20, 23, shade(look.accent, -0.3));

  // Front arm with wristband and fist.
  rect(21, 17, 2, 3, look.outfit);
  rect(21, 20, 2, 1, look.accent);
  rect(21, 21, 2, 2, look.skin);

  // Big round head (facing right).
  rect(10, 6, 12, 11, look.skin);
  set(10, 6, null);
  set(21, 6, null);
  set(10, 16, null);
  set(21, 16, null);
  rect(10, 13, 2, 3, skinDark);
  // Ear.
  rect(12, 11, 2, 2, skinDark);
  // Eyes: two-pixel-tall pupils with a shine.
  rect(16, 11, 2, 3, EYE);
  rect(19, 11, 2, 3, EYE);
  set(16, 11, EYE_SHINE);
  set(19, 11, EYE_SHINE);
  // Brows and mouth.
  rect(16, 10, 2, 1, hairDark);
  rect(19, 10, 2, 1, hairDark);
  rect(18, 15, 2, 1, MOUTH);

  switch (look.hairStyle) {
    case 'spiky':
      heights(SPIKY, 9, hair);
      [12, 14].forEach((x) => set(x, 10, hair));
      rect(10, 9, 2, 5, hair);
      break;
    case 'spikyTall':
    case 'long':
      heights({ ...raise(SPIKY, 2), 8: 9, 23: 9 }, 9, hair);
      [12, 14].forEach((x) => set(x, 10, hair));
      rect(10, 9, 2, 5, hair);
      break;
    case 'flame':
      heights({ 10: 5, 11: 3, 12: 1, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 1, 19: 3, 20: 5, 21: 7 }, 8, hair);
      rect(15, 9, 2, 1, hair);
      rect(10, 8, 2, 4, hair);
      break;
    case 'braids':
      heights(CAP, 9, hair);
      rect(11, 10, 3, 1, hair);
      rect(10, 9, 2, 3, hair);
      rect(22, 9, 2, 11, hair);
      rect(22, 20, 2, 1, look.accent);
      break;
    case 'bald':
      rect(12, 6, 8, 1, look.skin);
      rect(13, 7, 2, 1, shade(look.skin, 0.35));
      [14, 16, 18].forEach((x) => set(x, 8, '#3a2a20'));
      break;
    case 'horns':
      [[11, 5], [10, 4], [10, 3], [9, 2], [20, 5], [21, 4], [21, 3], [22, 2]].forEach(([x, y]) => set(x, y, hair));
      rect(11, 9, 10, 1, skinDark);
      break;
    case 'crest':
      heights({ 11: 4, 12: 3, 13: 2, 14: 2, 15: 1, 16: 1, 17: 2, 18: 2, 19: 3, 20: 4 }, 8, hair);
      rect(10, 6, 1, 6, look.accent);
      rect(21, 6, 1, 6, look.accent);
      rect(15, 8, 2, 1, look.accent);
      break;
    case 'mohawk':
      heights({ 14: 2, 15: 0, 16: 0, 17: 2 }, 7, hair);
      break;
    case 'visor':
      heights(CAP, 9, hair);
      rect(10, 9, 2, 5, hair);
      rect(15, 11, 7, 2, look.accent);
      break;
    case 'topknot':
      heights(CAP, 9, hair);
      rect(10, 9, 2, 4, hair);
      rect(13, 0, 5, 4, hair);
      rect(14, 4, 3, 1, look.accent);
      break;
    case 'ponytail':
      heights(CAP, 9, hair);
      rect(10, 9, 2, 4, hair);
      rect(13, 10, 2, 1, hair);
      break;
    case 'bob':
      heights(CAP, 10, hair);
      rect(10, 10, 2, 6, hair);
      rect(21, 10, 1, 4, hair);
      break;
  }

  // Light the top edge of the hair so it reads as volume.
  const hairLight = shade(hair, 0.3);
  for (let y = 1; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (grid[y][x] === hair && !grid[y - 1][x]) grid[y][x] = hairLight;
    }
  }

  // Dark outline around every filled pixel for the classic sprite look.
  const outlined = grid.map((row) => [...row]);
  for (let y = 0; y < SPRITE_SIZE; y++) {
    for (let x = 0; x < SPRITE_SIZE; x++) {
      if (grid[y][x]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx]);
      if (near) outlined[y][x] = OUTLINE;
    }
  }
  return outlined;
}

const cache = new Map<string, string>();

/** PNG data URL for a look, cached so each form is painted once. */
export function spriteUrl(look: Look): string {
  const key = JSON.stringify(look);
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SIZE;
  canvas.height = SPRITE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  paintFighter(look).forEach((row, y) =>
    row.forEach((color, x) => {
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }),
  );
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}
