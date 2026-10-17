import type { Look } from '../game/types';

// Procedural 32×32 pixel fighters. These are placeholders until hand-drawn sprites
// exist; any form can swap to a real image later without touching game logic.

export const SPRITE_SIZE = 32;
const OUTLINE = '#120b2e';
const EYE = '#120b2e';

type Grid = (string | null)[][];

function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * (1 + amount))));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

function painter(grid: Grid) {
  const set = (x: number, y: number, c: string) => {
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

const SPIKY: Record<number, number> = { 10: 6, 11: 3, 12: 4, 13: 2, 14: 3, 15: 1, 16: 3, 17: 2, 18: 4, 19: 3, 20: 5, 21: 7 };

function raise(tops: Record<number, number>, by: number): Record<number, number> {
  return Object.fromEntries(Object.entries(tops).map(([x, y]) => [x, Math.max(0, y - by)]));
}

export function paintFighter(look: Look): Grid {
  const grid: Grid = Array.from({ length: SPRITE_SIZE }, () => Array<string | null>(SPRITE_SIZE).fill(null));
  const { set, rect, heights } = painter(grid);
  const hair = look.hair;
  const hairDark = shade(hair, -0.25);
  const outfitDark = shade(look.outfit, -0.25);
  const skinDark = shade(look.skin, -0.18);

  // Hair that hangs behind the body.
  if (look.hairStyle === 'long') rect(9, 8, 4, 16, hairDark);
  if (look.hairStyle === 'ponytail') {
    rect(9, 6, 3, 3, hairDark);
    rect(8, 9, 3, 8, hairDark);
  }
  if (look.hairStyle === 'braids') {
    rect(10, 10, 2, 10, hairDark);
    rect(10, 20, 2, 1, look.accent);
  }

  // Back arm, legs, boots.
  rect(9, 16, 2, 3, outfitDark);
  rect(9, 19, 2, 4, skinDark);
  rect(12, 24, 3, 5, outfitDark);
  rect(17, 24, 3, 5, look.outfit);
  rect(11, 29, 4, 2, shade(look.boots, -0.2));
  rect(17, 29, 4, 2, look.boots);

  // Torso with sash and collar.
  rect(11, 16, 10, 8, look.outfit);
  rect(11, 16, 2, 8, outfitDark);
  rect(15, 16, 2, 2, look.accent);
  rect(11, 22, 10, 2, look.accent);
  rect(15, 15, 2, 1, skinDark);

  // Front arm with wristband.
  rect(21, 16, 2, 3, look.outfit);
  rect(21, 19, 2, 3, look.skin);
  rect(21, 21, 2, 1, look.accent);
  rect(21, 22, 2, 1, look.skin);

  // Head and face (facing right).
  rect(12, 7, 8, 8, look.skin);
  rect(12, 13, 2, 2, skinDark);
  set(16, 11, EYE);
  set(18, 11, EYE);
  set(17, 13, skinDark);
  rect(16, 10, 1, 1, hairDark);
  rect(18, 10, 1, 1, hairDark);

  switch (look.hairStyle) {
    case 'spiky':
      heights(SPIKY, 8, hair);
      set(13, 9, hair);
      set(15, 9, hair);
      rect(12, 9, 1, 3, hair);
      break;
    case 'spikyTall':
    case 'long':
      heights(raise(SPIKY, 2), 8, hair);
      set(14, 9, hair);
      rect(12, 9, 1, 3, hair);
      break;
    case 'flame':
      heights({ 11: 6, 12: 4, 13: 2, 14: 1, 15: 0, 16: 0, 17: 1, 18: 2, 19: 4, 20: 6 }, 8, hair);
      rect(15, 9, 2, 1, hair);
      rect(12, 9, 1, 2, hair);
      break;
    case 'braids':
      heights({ 11: 7, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 4, 18: 5, 19: 5, 20: 7 }, 8, hair);
      rect(12, 9, 1, 3, hair);
      rect(21, 9, 2, 10, hair);
      rect(21, 19, 2, 1, look.accent);
      break;
    case 'bald':
      rect(13, 7, 6, 1, shade(look.skin, 0.12));
      set(14, 8, '#3a2a20');
      set(16, 8, '#3a2a20');
      set(18, 8, '#3a2a20');
      break;
    case 'horns':
      rect(13, 6, 6, 1, look.skin);
      [[12, 6], [12, 5], [11, 4], [11, 3], [19, 6], [19, 5], [20, 4], [20, 3]].forEach(([x, y]) => set(x, y, hair));
      rect(12, 9, 8, 1, shade(look.skin, -0.1));
      break;
    case 'crest':
      heights({ 12: 5, 13: 4, 14: 3, 15: 3, 16: 3, 17: 4, 18: 4, 19: 5 }, 7, hair);
      rect(11, 5, 1, 4, look.accent);
      rect(20, 5, 1, 4, look.accent);
      rect(15, 8, 2, 1, look.accent);
      break;
    case 'mohawk':
      heights({ 14: 3, 15: 1, 16: 1, 17: 3 }, 7, hair);
      break;
    case 'topknot':
      heights({ 11: 7, 12: 5, 13: 5, 14: 4, 15: 4, 16: 4, 17: 4, 18: 5, 19: 5, 20: 7 }, 8, hair);
      rect(14, 1, 4, 3, hair);
      rect(15, 4, 2, 1, look.accent);
      rect(12, 9, 1, 3, hair);
      break;
    case 'ponytail':
      heights({ 11: 7, 12: 5, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 5, 19: 5, 20: 7 }, 8, hair);
      rect(13, 9, 3, 1, hair);
      rect(12, 9, 1, 3, hair);
      break;
    case 'bob':
      heights({ 11: 6, 12: 5, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 5, 20: 6 }, 8, hair);
      rect(11, 9, 2, 5, hair);
      rect(19, 9, 2, 3, hair);
      rect(14, 9, 4, 1, hair);
      break;
    case 'visor':
      heights({ 11: 7, 12: 5, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 5, 20: 7 }, 8, hair);
      rect(12, 9, 1, 4, hair);
      rect(14, 10, 6, 2, look.accent);
      break;
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
