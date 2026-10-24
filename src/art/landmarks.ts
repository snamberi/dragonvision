/**
 * Vision City buildings: flat, front-facing pixel models in the same language as Home's house —
 * outlined walls, stepped tile roofs, framed windows with flower boxes, doors with frames and steps.
 * Drawn once per building and light level on a 192×160 canvas, then cached as a data URL.
 */
export type Light = 'day' | 'dusk' | 'night';

type Pal = { roof: string; light: string; dark: string };

const OUT = '#362b3d';
const FRAME = '#594449';
const STONE = '#ead6ad';
const MORTAR = '#d0b88d';
const TIMBER = '#91654e';
const GOLD = '#e2be83';
const GLASS = '#ffd994';
const GLASS_LIT = '#ffe7a8';

const EMBER: Pal = { roof: '#a94d45', light: '#dd8058', dark: '#6f343d' };
const JADE: Pal = { roof: '#397d74', light: '#72b5a1', dark: '#285355' };
const VIOLET: Pal = { roof: '#716195', light: '#aa91bf', dark: '#494263' };
const SLATE: Pal = { roof: '#5c6677', light: '#8e9aab', dark: '#3a4150' };
const DUSKY: Pal = { roof: '#625777', light: '#9686b1', dark: '#3e3550' };
const GILT: Pal = { roof: '#b89b55', light: '#e7cd8d', dark: '#7d6633' };
const AZURE: Pal = { roof: '#4f6788', light: '#86a0c2', dark: '#34445e' };

const W = 192;
const H = 160;
/** Ground line every building stands on. */
const BASE = 146;

const cache = new Map<string, string>();

export function landmarkUrl(kind: string, light: Light = 'day'): string {
  const key = `${kind}:${light}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const glows: [number, number, number, number, string][] = [];
  const kit = makeKit(ctx, glows);
  (DRAW[kind] ?? DRAW.shrine)(kit);
  if (light !== 'day') {
    // Dim the whole model, then relight its windows, lamps and magic so the city glows after dark.
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = light === 'night' ? 'rgba(16,20,52,.5)' : 'rgba(60,30,80,.2)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    for (const [x, y, w, h, c] of glows) {
      ctx.fillStyle = 'rgba(255,214,140,.18)';
      ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
      ctx.fillStyle = c === GLASS ? GLASS_LIT : c;
      ctx.fillRect(x, y, w, h);
    }
  }
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

type Kit = ReturnType<typeof makeKit>;

function makeKit(ctx: CanvasRenderingContext2D, glows: [number, number, number, number, string][]) {
  const r = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  /** A filled rectangle with Home's dark 2px outline. */
  const box = (x: number, y: number, w: number, h: number, fill: string, out = OUT) => {
    r(x - 2, y - 2, w + 4, h + 4, out);
    r(x, y, w, h, fill);
  };
  const glow = (x: number, y: number, w: number, h: number, c: string) => {
    r(x, y, w, h, c);
    glows.push([x, y, w, h, c]);
  };
  /** A stepped pixel disc. */
  const disc = (cx: number, cy: number, rad: number, c: string) => {
    for (let dy = -rad; dy < rad; dy += 2) {
      const mid = dy + 1;
      const half = Math.round(Math.sqrt(Math.max(0, rad * rad - mid * mid)) / 2) * 2;
      r(cx - half, cy + dy, half * 2, 2, c);
    }
  };
  const shadow = (cx: number, w: number) => {
    r(cx - w / 2, BASE + 2, w, 4, 'rgba(24,52,50,.38)');
    r(cx - w / 2 + 8, BASE + 6, w - 16, 3, 'rgba(24,52,50,.24)');
  };
  /** Brick-coursed stone wall inside a dark frame, like Home's facade. */
  const stone = (x: number, y: number, w: number, h: number, base = STONE, mortar = MORTAR) => {
    box(x, y, w, h, base, FRAME);
    for (let yy = y + 8, row = 0; yy < y + h; yy += 8, row++) {
      r(x, yy, w, 2, mortar);
      for (let xx = x + (row % 2 ? 6 : 14); xx < x + w - 2; xx += 16) r(xx, yy - 8 + 2, 2, 6, mortar);
    }
    r(x, y, w, 4, '#a78b6e');
  };
  /** Cream plaster crossed by timber beams. */
  const timber = (x: number, y: number, w: number, h: number, plaster = '#efdcb5', beam = TIMBER) => {
    box(x, y, w, h, plaster, FRAME);
    r(x, y, w, 4, beam);
    r(x, y + h - 4, w, 4, beam);
    r(x, y, 4, h, beam);
    r(x + w - 4, y, 4, h, beam);
  };
  /**
   * A stepped tile roof: rows of tiles with seams and a highlight, each row stepping in toward the ridge.
   * `eave` is the bottom of the roof; returns the ridge y.
   */
  const roof = (x: number, w: number, eave: number, rows: number, p: Pal, step = 6, tips = false) => {
    const rowH = 8;
    for (let i = rows - 1; i >= 0; i--) {
      const rx = x + i * step;
      const rw = w - i * step * 2;
      r(rx - 2, eave - (i + 1) * rowH - 2, rw + 4, rowH + 2, OUT);
    }
    for (let i = 0; i < rows; i++) {
      const rx = x + i * step;
      const rw = w - i * step * 2;
      const ry = eave - (i + 1) * rowH;
      r(rx, ry, rw, rowH, p.roof);
      r(rx, ry + rowH - 2, rw, 2, p.dark);
      r(rx + 2, ry + 2, rw - 4, 2, p.light);
      for (let sx = rx + (i % 2 ? 6 : 12); sx < rx + rw - 2; sx += 12) r(sx, ry + 4, 2, 2, p.dark);
    }
    const ridge = eave - rows * rowH;
    r(x + (rows - 1) * step, ridge, w - (rows - 1) * step * 2, 2, p.light);
    // Eave trim: a light lip over a dark band.
    r(x - 4, eave, w + 8, 3, p.light);
    r(x - 2, eave + 3, w + 4, 3, OUT);
    if (tips) {
      for (const tx of [x - 6, x + w + 2]) {
        r(tx, eave - 6, 4, 6, p.dark);
        r(tx, eave - 8, 4, 2, p.light);
      }
    }
    return ridge;
  };
  /** Home-style window: wood frame, dark reveal, warm glass with a shaded pane and a cross mullion. */
  const win = (x: number, y: number, w: number, h: number, flowers = true, glass = GLASS) => {
    r(x - 4, y - 4, w + 8, h + 8, '#b58a60');
    r(x - 2, y - 2, w + 4, h + 4, '#57434a');
    glow(x, y, w, h, glass);
    if (glass === GLASS) r(x, y, Math.round(w / 3), h, '#f3b56d');
    r(x + Math.round(w / 2) - 1, y, 2, h, '#9f704f');
    r(x, y + Math.round(h / 2) - 1, w, 2, '#9f704f');
    if (flowers) {
      r(x - 5, y + h + 3, w + 10, 3, '#65444a');
      r(x - 4, y + h + 6, w + 8, 6, '#a46a4a');
      for (let fx = x - 2; fx < x + w + 2; fx += 5) r(fx, y + h + 1, 4, 3, '#5d8c68');
      for (let fx = x; fx < x + w; fx += 7) r(fx, y + h, 3, 2, '#e9a3a4');
    }
  };
  /** A round porthole window. */
  const porthole = (cx: number, cy: number, rad: number, glass = GLASS) => {
    disc(cx, cy, rad + 4, '#b58a60');
    disc(cx, cy, rad + 2, '#57434a');
    disc(cx, cy, rad, glass);
    glows.push([cx - rad + 2, cy - rad + 2, rad * 2 - 4, rad * 2 - 4, glass]);
    r(cx - 1, cy - rad, 2, rad * 2, '#9f704f');
    r(cx - rad, cy - 1, rad * 2, 2, '#9f704f');
  };
  /** A panelled door in a timber frame with a lintel and a brass knob. */
  const door = (x: number, w: number, h: number, wood = '#825348') => {
    const y = BASE - h;
    r(x - 4, y - 6, w + 8, 6, '#835a48');
    r(x - 4, y, w + 8, h, '#947153');
    r(x - 2, y + 2, w + 4, h - 2, '#5b3c43');
    r(x, y + 4, w, h - 4, wood);
    r(x + 3, y + 7, w - 6, Math.round(h / 3), '#9d6951');
    r(x + 3, y + Math.round(h / 2), w - 6, Math.round(h / 2) - 6, '#9d6951');
    r(x + w - 6, y + Math.round(h * 0.55), 3, 3, '#ffe2a0');
  };
  /** Two pale stone steps in front of a door. */
  const steps = (cx: number, w: number) => {
    r(cx - w / 2, BASE, w, 4, '#bda680');
    r(cx - w / 2, BASE, w, 1, '#ebd4a7');
    r(cx - w / 2 - 6, BASE + 4, w + 12, 4, '#a8916e');
    r(cx - w / 2 - 6, BASE + 4, w + 12, 1, '#d8c39c');
  };
  /** A lantern post with a warm glass head. */
  const lamp = (x: number, top: number) => {
    r(x - 1, top + 8, 3, BASE - top - 8, '#4d484b');
    r(x - 5, top, 11, 11, '#5c5150');
    glow(x - 3, top + 2, 7, 7, '#ffe1a0');
    r(x - 6, top - 2, 13, 2, '#3b3438');
  };
  /** A hanging pennant banner on a pole. */
  const banner = (x: number, top: number, len: number, c: string, emblem = GOLD) => {
    r(x, top - 4, 3, len + 26, '#5b454b');
    r(x - 1, top - 6, 5, 3, GOLD);
    r(x + 3, top, 14, len, c);
    r(x + 3, top, 14, 3, '#eed18d');
    r(x + 3, top + len, 5, 4, c);
    r(x + 12, top + len, 5, 4, c);
    r(x + 8, top + Math.round(len / 2) - 3, 4, 6, emblem);
  };
  /** A flowering shrub. */
  const shrub = (x: number, w = 18) => {
    r(x - 2, BASE - 14, w + 4, 16, '#284c45');
    r(x, BASE - 12, w, 12, '#4f8466');
    r(x + 2, BASE - 12, w - 6, 3, '#7fae7f');
    r(x + 4, BASE - 9, 3, 3, '#e9a3a4');
    r(x + w - 7, BASE - 6, 3, 3, '#f2d49d');
  };
  const crate = (x: number, y: number, s = 14) => {
    box(x, y, s, s, '#a46a4a');
    r(x + 2, y + 2, s - 4, 2, '#c58a5a');
    r(x + Math.round(s / 2) - 1, y, 2, s, '#73514d');
  };
  const barrel = (x: number, y: number) => {
    box(x, y, 12, 16, '#8a5a3e');
    r(x, y + 3, 12, 2, '#5b454b');
    r(x, y + 11, 12, 2, '#5b454b');
    r(x + 2, y, 2, 16, '#a9744f');
  };
  const smoke = (x: number, y: number, c = '#d2c6c8') => {
    r(x, y, 8, 6, c);
    r(x + 4, y - 7, 10, 6, c);
    r(x + 10, y - 13, 7, 5, c);
  };
  const chimney = (x: number, top: number, bottom: number) => {
    box(x, top, 12, bottom - top, '#705455');
    r(x - 2, top, 16, 4, '#ad7b65');
    smoke(x + 2, top - 9);
  };
  /** Fire in a brazier or torch. */
  const flame = (x: number, y: number) => {
    glow(x, y, 8, 7, '#ff9b3d');
    glow(x + 2, y + 2, 4, 4, '#ffe08a');
  };
  return { r, box, glow, disc, shadow, stone, timber, roof, win, porthole, door, steps, lamp, banner, shrub, crate, barrel, smoke, chimney, flame };
}

const DRAW: Record<string, (k: Kit) => void> = {
  shrine(k) {
    k.shadow(96, 168);
    k.stone(18, 128, 156, 18);
    // Main hall with vermilion pillars and a glowing summoning portal.
    k.box(36, 86, 120, 42, '#f0e0bf', FRAME);
    for (const x of [36, 64, 122, 150]) { k.r(x, 86, 6, 42, '#a94d45'); k.r(x, 86, 2, 42, '#dd8058'); }
    k.r(78, 92, 36, 36, OUT);
    k.r(82, 96, 28, 32, '#2a1d55');
    k.r(80, 98, 32, 30, OUT);
    k.r(84, 100, 24, 28, '#2a1d55');
    k.glow(86, 102, 20, 26, '#8d79b9');
    k.glow(90, 106, 12, 22, '#d5c2f4');
    k.glow(94, 110, 4, 14, '#f6edff');
    k.r(76, 90, 40, 4, GOLD);
    k.roof(26, 140, 86, 3, EMBER, 6, true);
    // Upper tier with a round window and a gold finial.
    k.box(60, 50, 72, 12, '#f0e0bf', FRAME);
    k.porthole(96, 56, 4, '#c3addc');
    k.roof(46, 100, 50, 3, EMBER, 6, true);
    k.r(94, 10, 4, 18, GOLD);
    k.disc(96, 10, 5, '#ffd23f');
    k.r(94, 7, 3, 3, '#fff3c2');
    // Purple temple banners, stone lanterns and the steps up to the portal.
    for (const x of [46, 138]) { k.r(x, 94, 10, 22, '#716195'); k.r(x, 94, 10, 3, GOLD); k.r(x + 3, 102, 4, 6, GOLD); }
    k.lamp(16, 106);
    k.lamp(176, 106);
    k.steps(96, 44);
  },
  shop(k) {
    k.shadow(96, 160);
    k.timber(34, 74, 124, 72);
    k.chimney(130, 26, 52);
    k.roof(24, 144, 74, 4, JADE);
    // A striped awning over the display window full of goods.
    for (let i = 0; i < 10; i++) k.r(38 + i * 8, 84, 8, 12, i % 2 ? '#4b9382' : '#f3e6c4');
    k.r(36, 82, 84, 2, OUT);
    for (let i = 0; i < 10; i++) k.r(38 + i * 8 + 2, 96, 4, 3, i % 2 ? '#4b9382' : '#f3e6c4');
    k.win(46, 104, 64, 26, false, '#f6dfac');
    for (let i = 0; i < 6; i++) k.r(50 + i * 10, 118, 7, 8, ['#c97b52', '#5e8f6a', '#e4c17b', '#8f6aa8', '#b8433a', '#4f6788'][i]);
    k.r(48, 126, 60, 3, '#73514d');
    k.door(124, 22, 40);
    // Hanging coin sign.
    k.r(146, 80, 10, 2, '#5b454b');
    k.r(150, 82, 2, 4, '#5b454b');
    k.disc(151, 92, 7, '#e9be65');
    k.disc(151, 92, 4, '#f6d98c');
    k.r(150, 89, 2, 6, '#9a6e2f');
    k.crate(14, 128);
    k.crate(18, 112, 12);
    k.barrel(164, 130);
    k.steps(135, 30);
  },
  armory(k) {
    k.shadow(96, 164);
    k.stone(36, 76, 120, 70, '#d7cfc2', '#b9ada0');
    k.r(132, 30, 14, 34, OUT);
    k.r(134, 32, 10, 32, '#6c6466');
    k.r(130, 30, 18, 4, '#a5a2a0');
    k.smoke(136, 20, '#bfb8bc');
    k.roof(26, 140, 76, 4, SLATE);
    // Shield and crossed swords over the door.
    for (let i = 0; i < 16; i++) { k.r(80 + i * 2, 76 + i * 2, 3, 3, '#dce5e3'); k.r(110 - i * 2, 76 + i * 2, 3, 3, '#dce5e3'); }
    k.r(86, 82, 22, 18, OUT);
    k.r(88, 84, 18, 16, '#b4574e');
    k.r(90, 100, 14, 4, OUT);
    k.r(92, 100, 10, 2, '#b4574e');
    k.r(88, 84, 18, 3, GOLD);
    k.r(95, 88, 4, 10, GOLD);
    k.door(84, 26, 38, '#5f4a45');
    for (const y of [114, 126, 138]) for (const x of [88, 104]) k.r(x, y, 2, 2, '#c7c2c0');
    // Barred windows and a rack of spears outside.
    for (const x of [48, 124]) { k.win(x, 94, 20, 20, false, '#f0c27a'); for (let b = 2; b < 20; b += 6) k.r(x + b, 94, 2, 20, '#4b4344'); }
    for (const x of [12, 20, 28]) { k.r(x, 104, 2, 42, '#876449'); k.r(x - 1, 98, 4, 6, '#dce5e3'); }
    k.r(8, 120, 26, 3, '#5b454b');
    k.box(160, 132, 18, 6, '#4b4344');
    k.r(164, 138, 10, 8, '#4b4344');
    k.steps(97, 34);
  },
  lab(k) {
    k.shadow(96, 164);
    k.stone(40, 88, 112, 58, '#d6d2c8', '#b4ae9f');
    // A glass greenhouse dome with brass ribs.
    const glass: Pal = { roof: '#7fc8b8', light: '#c8f0e4', dark: '#3f7f7a' };
    k.roof(32, 128, 88, 5, glass, 8);
    for (const x of [56, 80, 104, 128]) k.r(x, 50, 2, 38, '#c9a35f');
    k.porthole(80, 112, 13, '#83d8c1');
    k.disc(80, 112, 7, '#5bb89c');
    k.disc(80, 112, 3, '#e6fff7');
    k.door(118, 22, 40);
    // Copper pipes feed a bubbling tank and a green-smoking stack.
    k.box(14, 104, 20, 42, '#3f4c55');
    k.glow(17, 112, 14, 30, '#6fdcb2');
    k.r(17, 112, 14, 3, '#b8f3dd');
    k.r(34, 118, 8, 4, '#c27a4a');
    k.r(32, 100, 4, 6, '#c27a4a');
    k.r(32, 98, 120, 4, '#c27a4a');
    k.box(158, 40, 10, 50, '#6c6466');
    k.r(152, 86, 10, 4, '#c27a4a');
    k.smoke(158, 30, '#9fe0c4');
    for (const [x, c] of [[64, '#e05b7a'], [74, '#6aa8e8'], [86, '#f2d460']] as const) {
      k.r(x + 2, 128, 2, 4, '#e8eef0');
      k.r(x, 132, 6, 6, c);
    }
    k.steps(129, 30);
  },
  fortune(k) {
    k.shadow(96, 150);
    tent(k, '#716195', '#aa91bf', 96, 128);
    // The open flap shows a glowing crystal ball on a draped table.
    k.r(80, 104, 32, 42, OUT);
    k.r(82, 106, 28, 40, '#241d3a');
    k.box(84, 128, 24, 6, '#8f3f5a');
    k.disc(96, 120, 7, '#5a4a8a');
    k.glow(91, 115, 10, 10, '#c9b3ff');
    k.glow(93, 117, 3, 3, '#ffffff');
    k.r(92, 126, 8, 2, GOLD);
    // Star pennant and a hanging lantern.
    k.r(95, 2, 2, 14, GOLD);
    k.r(97, 3, 12, 7, '#e2bd77');
    k.r(100, 5, 4, 3, '#fff3c2');
    k.lamp(30, 100);
    k.lamp(162, 100);
    k.steps(96, 34);
  },
  event(k) {
    k.shadow(96, 170);
    tent(k, '#b8433a', '#f3e6c4', 96, 150);
    for (let i = 0; i < 9; i++) {
      k.r(32 + i * 16, 60 + Math.abs(4 - i) * 2, 8, 8, ['#ffd23f', '#4b9382', '#b8433a', '#716195'][i % 4]);
    }
    k.r(24, 58, 144, 2, '#5b454b');
    k.r(80, 104, 32, 42, OUT);
    k.r(82, 106, 28, 40, '#3a1f2a');
    k.glow(86, 112, 20, 30, '#ffcf7a');
    k.r(86, 112, 20, 3, '#ffe7a8');
    k.r(95, 0, 3, 16, GOLD);
    k.r(98, 1, 16, 9, '#ffd23f');
    k.r(100, 3, 6, 4, '#b8433a');
    k.barrel(20, 130);
    k.crate(158, 132);
    k.steps(96, 34);
  },
  upgrades(k) {
    k.shadow(96, 164);
    k.timber(32, 76, 112, 70, '#ead3a6');
    k.chimney(46, 34, 56);
    k.roof(22, 132, 76, 4, EMBER);
    // A big cog on the gable marks the builder's workshop.
    k.disc(88, 60, 9, '#c79c56');
    for (const [dx, dy] of [[-12, -2], [10, -2], [-2, -12], [-2, 8]]) k.r(88 + dx, 60 + dy, 4, 4, '#c79c56');
    k.disc(88, 60, 3, '#6b4a3a');
    k.win(44, 94, 22, 20);
    k.door(98, 24, 42);
    // Scaffolding, a ladder and stacked timber beside the house.
    for (const x of [150, 176]) k.r(x, 64, 3, 82, '#876449');
    for (const y of [72, 100, 126]) k.r(146, y, 36, 3, '#b08a5e');
    k.r(156, 98, 3, 48, '#a07a52');
    k.r(168, 98, 3, 48, '#a07a52');
    for (let y = 104; y < 146; y += 8) k.r(156, y, 15, 2, '#a07a52');
    // Hammer sign.
    k.r(70, 90, 18, 2, '#5b454b');
    k.r(78, 92, 2, 10, '#876449');
    k.r(72, 92, 14, 5, '#8e9aab');
    k.crate(12, 132, 12);
    k.r(10, 126, 22, 4, '#c08f5f');
    k.steps(110, 30);
  },
  dojo(k) {
    k.shadow(96, 168);
    // Raised wooden platform and shoji screens between red pillars.
    k.box(26, 132, 140, 12, '#8a5f43');
    k.r(26, 132, 140, 3, '#b8875c');
    k.box(40, 92, 112, 40, '#f4ead2', FRAME);
    for (let x = 40; x < 152; x += 14) k.r(x, 92, 2, 40, '#c8b291');
    for (let y = 100; y < 132; y += 10) k.r(40, y, 112, 2, '#c8b291');
    for (const x of [40, 74, 112, 146]) { k.r(x, 92, 6, 40, '#a94d45'); k.r(x, 92, 2, 40, '#dd8058'); }
    k.glow(80, 102, 30, 26, '#ffe7c0');
    k.roof(26, 140, 92, 3, DUSKY, 6, true);
    // Upper tier with the dojo plaque and an upturned pagoda roof.
    k.box(60, 54, 72, 14, '#f4ead2', FRAME);
    k.box(80, 56, 32, 10, '#3e3550');
    for (const x of [86, 94, 102]) k.r(x, 58, 4, 6, GOLD);
    k.roof(44, 104, 54, 3, DUSKY, 6, true);
    k.r(94, 18, 4, 12, GOLD);
    k.disc(96, 18, 3, '#ffd23f');
    // A hanging gong and a practice post.
    k.r(16, 100, 22, 3, '#5b454b');
    k.r(18, 100, 3, 46, '#5b454b');
    k.r(34, 100, 3, 46, '#5b454b');
    k.disc(27, 116, 7, '#d9a53f');
    k.disc(27, 116, 3, '#f6d98c');
    k.box(166, 116, 8, 30, '#b8875c');
    k.r(160, 120, 20, 4, '#8a5f43');
    k.steps(96, 40);
  },
  gravity(k) {
    k.shadow(96, 160);
    k.box(38, 98, 116, 48, '#6f7c8c', FRAME);
    for (let x = 42; x < 152; x += 12) { k.r(x, 102, 2, 2, '#aab4c2'); k.r(x, 140, 2, 2, '#aab4c2'); }
    k.r(38, 98, 116, 4, '#8e9aab');
    // A stepped steel dome ringed by a violet gravity band.
    const steel: Pal = { roof: '#8a94a6', light: '#c3cbd8', dark: '#4d5566' };
    k.roof(34, 124, 98, 6, steel, 9);
    k.glow(30, 92, 132, 5, '#c9a6ff');
    k.glow(30, 93, 132, 2, '#f1e3ff');
    k.porthole(64, 120, 8, '#c3addc');
    k.porthole(128, 120, 8, '#c3addc');
    // Heavy blast door with warning chevrons.
    k.box(82, 108, 28, 38, '#4d5566');
    for (let y = 112; y < 144; y += 8) { k.r(84, y, 24, 4, '#e2be83'); k.r(84, y + 4, 24, 4, '#3a4150'); }
    k.r(95, 108, 2, 38, OUT);
    // Antenna with a beacon.
    k.r(95, 20, 3, 24, '#4d5566');
    k.glow(93, 14, 7, 7, '#ff6b6b');
    k.steps(96, 36);
  },
  board(k) {
    k.shadow(96, 162);
    for (const x of [34, 154]) k.box(x, 70, 6, 76, '#6e5140');
    // A plank notice wall under a little shingled roof.
    k.box(30, 70, 132, 62, '#927454');
    for (let y = 80; y < 132; y += 10) k.r(30, y, 132, 2, '#7a5f45');
    k.roof(24, 144, 68, 2, EMBER);
    const posters: [number, number, string][] = [[38, 78, '#ebd5a8'], [66, 82, '#f1e2bd'], [96, 78, '#ebd5a8'], [126, 84, '#f1e2bd']];
    for (const [x, y, c] of posters) {
      k.box(x, y, 24, 32, c, '#6b5444');
      k.r(x + 8, y + 5, 8, 8, '#8a6a52');
      k.r(x + 6, y + 13, 12, 6, '#8a6a52');
      k.r(x + 4, y + 22, 16, 2, '#b8433a');
      k.r(x + 4, y + 26, 12, 2, '#9a8a72');
      k.r(x + 11, y - 2, 2, 3, '#c9c3bd');
    }
    k.r(54, 116, 16, 12, '#b8433a');
    k.r(56, 118, 12, 8, '#ffe4a4');
    k.lamp(14, 100);
    k.lamp(178, 100);
    k.barrel(44, 132);
    k.crate(136, 132);
  },
  hall(k) {
    k.shadow(96, 168);
    k.stone(18, 130, 156, 16);
    k.box(32, 80, 128, 50, '#eadfc4', FRAME);
    // Columns, bronze doors and a gilded pediment with a star.
    for (const x of [36, 62, 122, 148]) {
      k.r(x, 84, 10, 46, '#f6ecd2');
      k.r(x + 6, 84, 4, 46, '#d8c8a2');
      k.r(x - 2, 80, 14, 4, '#c9b48a');
      k.r(x - 2, 126, 14, 4, '#c9b48a');
    }
    k.door(82, 28, 46, '#9a6a3a');
    k.r(84, 100, 24, 2, GOLD);
    for (const x of [74, 112]) { k.r(x, 88, 8, 22, '#b4574e'); k.r(x, 88, 8, 3, GOLD); }
    k.r(26, 72, 140, 8, OUT);
    k.r(28, 74, 136, 6, '#c9b48a');
    for (let i = 0; i < 6; i++) {
      const w = 140 - i * 22;
      k.r(96 - w / 2 - 2, 64 - i * 8, w + 4, 10, OUT);
      k.r(96 - w / 2, 66 - i * 8, w, 8, i % 2 ? GILT.light : GILT.roof);
    }
    k.disc(96, 50, 6, '#fff0b9');
    k.r(95, 42, 2, 16, '#ffe08a');
    k.r(88, 49, 16, 2, '#ffe08a');
    k.r(94, 10, 4, 12, GOLD);
    k.disc(96, 10, 4, '#ffd23f');
    k.steps(96, 40);
  },
  journal(k) {
    k.shadow(96, 164);
    k.stone(36, 80, 120, 66, '#e6d7b6', '#ccb991');
    k.roof(26, 140, 80, 4, AZURE);
    k.porthole(96, 60, 6, '#cfe0f4');
    // Bookshelf windows, an ivy corner and an open book over the door.
    for (const x of [46, 124]) {
      k.r(x - 4, 96, 30, 34, '#b58a60');
      k.r(x - 2, 98, 26, 30, '#57434a');
      for (let row = 0; row < 3; row++) {
        for (let b = 0; b < 6; b++) k.glow(x + b * 4, 100 + row * 10, 3, 8, ['#b8433a', '#4f6788', '#e4c17b', '#5e8f6a', '#8f6aa8', '#c97b52'][(b + row) % 6]);
        k.r(x - 2, 108 + row * 10, 26, 2, '#9f704f');
      }
    }
    k.door(84, 24, 40, '#5f6f8a');
    k.r(80, 92, 16, 10, '#f4ecd8');
    k.r(98, 92, 16, 10, '#f4ecd8');
    k.r(96, 92, 2, 10, '#876449');
    for (let i = 0; i < 3; i++) { k.r(82, 94 + i * 3, 12, 1, '#9a8c78'); k.r(100, 94 + i * 3, 12, 1, '#9a8c78'); }
    for (let y = 84; y < 140; y += 6) k.r(36 + ((y / 6) % 3) * 2, y, 6, 4, y % 12 ? '#5d8c68' : '#7fae7f');
    k.lamp(170, 104);
    k.shrub(14);
    k.steps(96, 32);
  },
  colosseum(k) {
    k.shadow(96, 180);
    k.stone(12, 64, 168, 82, '#ddd0b2', '#bfb08e');
    // Battlements, two tiers of dark arches and gold cornices.
    for (let x = 12; x < 180; x += 14) { k.r(x - 2, 54, 10, 12, OUT); k.r(x, 56, 6, 8, '#ddd0b2'); }
    k.r(12, 92, 168, 4, GOLD);
    k.r(12, 120, 168, 2, '#bfb08e');
    for (let i = 0; i < 8; i++) {
      const x = 18 + i * 20;
      k.r(x, 72, 12, 16, OUT);
      k.r(x + 2, 70, 8, 2, OUT);
      k.glow(x + 2, 76, 8, 12, '#3b2f45');
      if (i === 3 || i === 4) continue;
      k.r(x, 102, 12, 20, OUT);
      k.r(x + 2, 100, 8, 2, OUT);
      k.r(x + 2, 106, 8, 16, '#3b2f45');
    }
    // The great gate with a portcullis.
    k.r(78, 98, 36, 48, OUT);
    k.r(82, 94, 28, 4, OUT);
    k.r(82, 102, 28, 44, '#2a2232');
    for (let x = 84; x < 110; x += 6) k.r(x, 102, 2, 44, '#8f7a52');
    for (let y = 110; y < 146; y += 10) k.r(82, y, 28, 2, '#8f7a52');
    for (const x of [24, 160]) { k.r(x, 18, 3, 40, '#5b454b'); k.r(x + 3, 20, 18, 12, '#b8433a'); k.r(x + 3, 20, 18, 3, GOLD); }
    k.steps(96, 40);
  },
  tower(k) {
    k.shadow(96, 120);
    k.stone(60, 104, 72, 42, '#d4c8d8', '#b3a6ba');
    k.door(84, 24, 34, '#5f4a6a');
    k.win(66, 112, 10, 14, false);
    k.win(116, 112, 10, 14, false);
    k.roof(52, 88, 104, 2, VIOLET, 6, true);
    k.stone(68, 66, 56, 22, '#d4c8d8', '#b3a6ba');
    k.win(90, 70, 12, 12, false);
    k.roof(60, 72, 66, 2, VIOLET, 6, true);
    k.stone(76, 36, 40, 14, '#d4c8d8', '#b3a6ba');
    k.win(92, 38, 8, 8, false);
    k.roof(68, 56, 36, 3, VIOLET, 6, true);
    k.r(94, 2, 3, 14, GOLD);
    k.r(97, 3, 14, 8, '#b8433a');
    k.r(97, 3, 14, 2, GOLD);
    k.lamp(40, 108);
    k.lamp(152, 108);
    k.steps(96, 32);
  },
  gate(k) {
    k.shadow(96, 150);
    // A stone arch around a swirling portal, flanked by braziers.
    k.box(36, 40, 120, 106, '#bdb3c9', FRAME);
    for (let y = 48; y < 146; y += 10) { k.r(36, y, 120, 2, '#9e93ac'); }
    for (let i = 0; i < 5; i++) k.r(36 + i * 4, 40 - i * 4, 120 - i * 8, 4, i % 2 ? '#bdb3c9' : '#9e93ac');
    k.r(52, 62, 88, 84, OUT);
    k.r(58, 56, 76, 6, OUT);
    k.r(66, 50, 60, 6, OUT);
    k.r(56, 64, 80, 82, '#24263f');
    k.r(62, 58, 68, 6, '#24263f');
    k.glow(64, 68, 64, 76, '#6d5aa0');
    k.glow(72, 76, 48, 64, '#8d79b9');
    k.glow(80, 84, 32, 50, '#d5c2f4');
    k.glow(90, 94, 12, 32, '#f6edff');
    for (const [x, y] of [[42, 60], [42, 96], [42, 128], [146, 60], [146, 96], [146, 128], [94, 44]]) k.r(x, y, 4, 4, GOLD);
    for (const x of [14, 164]) {
      k.box(x, 122, 14, 6, '#4b4344');
      k.r(x + 4, 128, 6, 18, '#4b4344');
      k.flame(x + 3, 112);
    }
    k.steps(96, 56);
  },
  climb(k) {
    k.shadow(96, 110);
    // An endless spire: stacked tiers, each crowned with violet tiles, rising past the clouds.
    const tiers: [number, number, number][] = [[64, 112, 64], [70, 84, 52], [76, 58, 40], [82, 34, 28]];
    tiers.forEach(([x, y, w], i) => {
      const h = i === 0 ? BASE - y : 18;
      k.stone(x, y, w, h, '#d4c8d8', '#b3a6ba');
      k.roof(x - 4, w + 8, y, 1, VIOLET, 4);
      k.win(x + w / 2 - 4, y + 4 + (i === 0 ? 2 : 0), 8, 9, false, i ? '#c3addc' : GLASS);
    });
    k.door(86, 20, 24, '#5f4a6a');
    // The crystal crown.
    k.r(92, 2, 8, 2, OUT);
    k.r(88, 4, 16, 4, OUT);
    k.r(90, 4, 12, 18, '#8be6cf');
    k.glow(92, 6, 6, 12, '#e6fff7');
    k.r(88, 20, 16, 2, OUT);
    for (const [x, y, w] of [[18, 60, 40], [138, 44, 38], [26, 30, 24]]) {
      k.r(x, y, w, 6, '#eef0ff');
      k.r(x + 6, y - 4, w - 14, 4, '#eef0ff');
      k.r(x, y + 6, w, 2, '#c9cbe6');
    }
    k.lamp(46, 112);
    k.lamp(146, 112);
    k.steps(96, 28);
  },
  port(k) {
    // Harbour water, a plank dock, a little harbourmaster's hut and a moored sailboat.
    k.r(0, 124, W, 36, '#2f6a7c');
    for (let x = 4; x < W; x += 18) { k.r(x, 132, 10, 2, '#93c8cd'); k.r(x + 8, 146, 8, 2, '#6fa9b4'); }
    k.box(8, 116, 110, 8, '#a07a52');
    for (let x = 10; x < 118; x += 10) k.r(x, 116, 2, 8, '#7d5c40');
    for (const x of [16, 56, 104]) k.r(x, 124, 5, 22, '#57423a');
    k.timber(18, 82, 52, 34, '#efdcb5');
    k.roof(12, 64, 82, 3, JADE);
    k.win(30, 92, 10, 10, false);
    k.r(50, 94, 14, 22, '#5b3c43');
    k.r(52, 96, 10, 20, '#825348');
    k.crate(78, 102);
    k.barrel(96, 100);
    k.lamp(112, 86);
    // The boat.
    k.r(112, 112, 74, 4, OUT);
    k.r(116, 116, 66, 10, OUT);
    k.r(114, 114, 70, 3, '#c9935f');
    k.r(118, 117, 62, 8, '#8f6345');
    k.r(118, 121, 62, 2, '#b8433a');
    k.r(146, 20, 4, 92, '#5b454b');
    for (let i = 0; i < 12; i++) k.r(150, 26 + i * 6, 4 + i * 2.6, 6, '#f3e6c4');
    for (let i = 0; i < 10; i++) k.r(142 - i * 2, 34 + i * 6, i * 2 + 2, 6, '#b95c4b');
    k.r(146, 16, 12, 6, GOLD);
  },
  dungeon(k) {
    k.shadow(96, 160);
    // A mossy crag with a carved cave mouth, torches and steps leading down.
    const rows: [number, number][] = [[30, 44], [44, 76], [58, 100], [72, 116], [86, 128], [100, 136], [114, 144]];
    rows.forEach(([y, w], i) => {
      const h = i === rows.length - 1 ? BASE - y : 14;
      k.r(96 - w / 2 - 2, y - 2, w + 4, h + 4, OUT);
      k.r(96 - w / 2, y, w, h, i % 2 ? '#6f6a7b' : '#7b7588');
      k.r(96 - w / 2 + 4, y + 2, w - 8, 2, '#958fa2');
    });
    for (const [x, y] of [[40, 82], [140, 92], [58, 64], [126, 70]]) k.r(x, y, 12, 4, '#5d8c68');
    k.r(64, 92, 64, 54, OUT);
    k.r(70, 86, 52, 6, OUT);
    k.r(78, 80, 36, 6, OUT);
    k.r(68, 94, 56, 52, '#2a2433');
    k.r(74, 88, 44, 6, '#2a2433');
    k.r(80, 82, 32, 6, '#2a2433');
    k.r(74, 98, 44, 48, '#100d18');
    for (const [x, y] of [[64, 92], [68, 86], [76, 80], [86, 76], [100, 76], [110, 80], [118, 86], [122, 92]]) k.r(x, y, 8, 6, '#c9b99a');
    k.box(90, 68, 12, 10, '#d9a53f');
    k.r(94, 71, 4, 4, OUT);
    for (let i = 0; i < 4; i++) k.r(80 + i * 3, 116 + i * 8, 32 - i * 6, 3, ['#4c4656', '#3e3848', '#302b39', '#231f2b'][i]);
    for (const x of [52, 134]) { k.r(x + 2, 104, 3, 20, '#5b454b'); k.flame(x, 96); }
    k.shrub(16, 16);
    k.shrub(160, 16);
  },
  raid(k) {
    k.shadow(96, 176);
    // A spiked palisade around a crenellated gatehouse, red war banners and braziers.
    for (let x = 10; x < 182; x += 9) {
      if (x > 56 && x < 130) continue;
      k.r(x - 1, 80, 9, 66, OUT);
      k.r(x, 82, 7, 64, '#876449');
      k.r(x + 1, 82, 2, 64, '#a8805a');
      k.r(x + 1, 74, 5, 6, OUT);
      k.r(x + 2, 74, 3, 6, '#c9a26e');
    }
    k.r(8, 112, 176, 3, '#57423a');
    k.stone(58, 54, 76, 92, '#d7cfc2', '#b9ada0');
    for (let x = 58; x < 134; x += 14) { k.r(x - 2, 42, 10, 14, OUT); k.r(x, 44, 6, 10, '#d7cfc2'); }
    k.r(58, 62, 76, 3, GOLD);
    k.r(76, 98, 40, 48, OUT);
    k.r(80, 94, 32, 4, OUT);
    k.r(80, 100, 32, 46, '#231c2a');
    for (let x = 82; x < 112; x += 6) k.r(x, 100, 2, 46, '#8f7a52');
    k.box(84, 70, 24, 14, '#efe1be');
    k.r(88, 74, 4, 4, OUT);
    k.r(100, 74, 4, 4, OUT);
    k.r(92, 80, 8, 2, OUT);
    for (const x of [24, 150]) k.banner(x, 22, 34, '#b8433a');
    for (const x of [36, 146]) { k.box(x, 128, 12, 6, '#4b4344'); k.r(x + 3, 134, 6, 12, '#4b4344'); k.flame(x + 2, 118); }
    k.steps(96, 40);
  },
};

/** A stepped, striped big-top tent. */
function tent(k: Kit, a: string, b: string, cx: number, base: number) {
  const top = 22;
  const rows = Math.ceil((BASE - top) / 8);
  for (let i = 0; i < rows; i++) {
    const y = top + i * 8;
    const w = Math.round(16 + ((base - 16) * i) / (rows - 1));
    k.r(cx - w / 2 - 2, y - 2, w + 4, 12, OUT);
  }
  for (let i = 0; i < rows; i++) {
    const y = top + i * 8;
    const w = Math.round(16 + ((base - 16) * i) / (rows - 1));
    const h = i === rows - 1 ? BASE - y : 8;
    for (let x = cx - w / 2; x < cx + w / 2; x += 2) {
      const band = Math.floor(((x - cx) / (w / 2)) * 3 + 3);
      k.r(x, y, 2, h, band % 2 ? a : b);
    }
  }
  k.r(cx - base / 2 - 4, BASE - 10, base + 8, 4, OUT);
  for (let x = cx - base / 2; x < cx + base / 2; x += 12) k.r(x, BASE - 8, 8, 6, GOLD);
}
