import { landmarkUrl } from './landmarks';
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


const GRAVITY = [
  '........RRRRRRRR........',
  '......RRrrrrrrrrRR......',
  '.....RrrrrrrrrrrrrR.....',
  '....RrrrrWWWWWWrrrrR....',
  '....RrrrWWkkkkWWrrrR....',
  '....RrrrWkWWWWWWrrrR....',
  '....RrrrWkWWkkkWrrrR....',
  '....RrrrWkWWWWkWrrrR....',
  '....RrrrWWkkkkWWrrrR....',
  '....RrrrrWWWWWWrrrrR....',
  '...MMMMMMMMMMMMMMMMMM...',
  '...MmmmmmmBBBBmmmmmmM...',
  '...MmmmmmmBbbBmmmmmmM...',
  '...MmmmmmmBbbBmmmmmmM...',
  '..SSSSSSSSSSSSSSSSSSSS..',
  '.SssssssssssssssssssssS.',
];
const GRAVITY_PALETTE: Record<string, string> = {
  R: '#8a2418', r: '#d8432e', W: '#f4ecd8', k: '#1b1530', M: '#3a3f4b', m: '#6b7080',
  B: '#22252d', b: '#ffb02e', S: '#8f8aa8', s: '#5f5a7a',
};

const PORT = [
  '...........P............',
  '..........WP............',
  '.........WWP............',
  '........WWWPRR..........',
  '.......WWWWPRRR.........',
  '......WWWWWPRRRR........',
  '.....WWWWWWPRRRRR.......',
  '...........P............',
  '..BBBBBBBBBBBBBBBBBBBB..',
  '...BbbbbbbbbbbbbbbbbB...',
  '....BBBBBBBBBBBBBBBB....',
  'ggggggggggggggggggggggg.',
  'wGwGwGwGwGwGwGwGwGwGwGw.',
  'GGGGGGGGGGGGGGGGGGGGGGG.',
];
const PORT_PALETTE: Record<string, string> = {
  P: '#5a3a22', W: '#f4ecd8', R: '#d8432e', B: '#7a5230', b: '#a8763e',
  g: '#3f8fd8', G: '#2b6cb0', w: '#9ae6ff',
};

const BOARD = [
  '.PPPPPPPPPPPPPPPPPPPP...',
  '.PbbbbbbbbbbbbbbbbbbP...',
  '.PbWWWbbWWWWbbWWWbbbP...',
  '.PbWkWbbWkkWbbWkWbbbP...',
  '.PbWWWbbWWWWbbWWWbbbP...',
  '.PbWkWbbWkkWbbWkWbbbP...',
  '.PbWWWbbWWWWbbWWWbbbP...',
  '.PbbbbbbbbbbbbbbbbbbP...',
  '.PPPPPPPPPPPPPPPPPPPP...',
  '...P..............P.....',
  '...P..............P.....',
  '...P..............P.....',
  '.gggggggggggggggggggg...',
];
const BOARD_PALETTE: Record<string, string> = {
  P: '#5a3a22', b: '#a8763e', W: '#f4ecd8', k: '#d8432e', g: '#3f7a3a',
};

const TENT = [
  '...........YY...........',
  '..........PPPP..........',
  '.........PPppPP.........',
  '........PPppppPP........',
  '.......PPppYYppPP.......',
  '......PPpppppppppP......',
  '.....PPppppppppppPP.....',
  '....PPppppppppppppPP....',
  '...PPpppppBBBBpppppPP...',
  '..PPppppppBCCBppppppPP..',
  '..PppppppBCccCBpppppP...',
  '..PppppppBCccCBpppppP...',
  '..PppppppBBBBBBpppppP...',
  '.SSSSSSSSSSSSSSSSSSSSS..',
];
const TENT_PALETTE: Record<string, string> = {
  Y: '#ffd23f', P: '#3b1d6b', p: '#7a3fa8', B: '#1a1240', C: '#9ae6ff', c: '#e9e4ff', S: '#8f8aa8',
};

const TOWER = [
  '..........RRRR..........',
  '.........RRRRRR.........',
  '........RRRRRRRR........',
  '.........WWWWWW.........',
  '.........WkWWkW.........',
  '.........WWWWWW.........',
  '........RRRRRRRR........',
  '.........WWWWWW.........',
  '.........WkWWkW.........',
  '.........WWWWWW.........',
  '........RRRRRRRR........',
  '.........WWWWWW.........',
  '.........WkWWkW.........',
  '.........WWWWWW.........',
  '........RRRRRRRR........',
  '.........WWBBWW.........',
  '.........WWBBWW.........',
  '.......SSSSSSSSSS.......',
];
const TOWER_PALETTE: Record<string, string> = {
  R: '#5b2fc0', W: '#c9c2e0', k: '#ffd23f', B: '#1a1240', S: '#8f8aa8',
};

// The Shop: a market stall with a striped awning and goods on the counter.
const SHOP = [
  '..........YYYY..........',
  '.........YyCCyY.........',
  '..........YYYY..........',
  '..OOWWOOWWOOWWOOWWOOWW..',
  '.OOWWOOWWOOWWOOWWOOWWOO.',
  '.oowwoowwoowwoowwoowwoo.',
  '..p.....................',
  '..p..LLLLLLLLLLLLLLLL.p.',
  '..p..L..GG..YY..mm..L.p.',
  '..p..L.GgG.YyY.mMm..L.p.',
  '..p..L..GG..YY..mm..L.p.',
  '.TTTTTTTTTTTTTTTTTTTTTT.',
  '.TtttttttttttttttttttttT',
  '.TbbbbbbbbbbbbbbbbbbbbbT',
  '.TbBBbbbBBbbbBBbbbBBbbbT',
  '.AAAAAAAAAAAAAAAAAAAAAAA',
];
const SHOP_PALETTE: Record<string, string> = {
  Y: '#ffd23f', y: '#c98a1a', C: '#fff4cd', O: '#ff8a1f', o: '#b8560f', W: '#f4ecd8', w: '#b9ad94',
  p: '#5a3a22', L: '#3a2a4a', G: '#4ade80', g: '#1d7a4a', m: '#b794ff', M: '#6b3fc0',
  T: '#8a5a30', t: '#c98a4a', b: '#5a3a22', B: '#3a2412', A: '#8f8aa8',
};

const ARMORY = [
  '.........SSSSSS.........',
  '........SsBBBBsS........',
  '.......SsB.BB.BsS.......',
  '....RRRRRRRRRRRRRRRR....',
  '...RrrrrrrrrrrrrrrrrR...',
  '..RRRRRRRRRRRRRRRRRRRR..',
  '...WWWWWWWWWWWWWWWWWW...',
  '...WkkWWWWWWWWWWWWkkW...',
  '...WkkWWGGGGGGGGWWkkW...',
  '...WWWWWGddddddGWWWWW...',
  '...WPPWWGd.YY.dGWWPPW...',
  '...WPPWWGd.YY.dGWWPPW...',
  '...WPPWWGd....dGWWPPW...',
  '...WWWWWGGGGGGGGWWWWW...',
  '..AAAAAAAAAAAAAAAAAAAA..',
  '.AaaaaaaaaaaaaaaaaaaaaA.',
];
const ARMORY_PALETTE: Record<string, string> = {
  S: '#b9c2cf', s: '#6b7080', B: '#1b1530', R: '#5a3a22', r: '#8a5a30', W: '#d9c9a8', k: '#2a1d55',
  G: '#5a3a22', d: '#2a1d12', Y: '#ffd23f', P: '#9aa0b0', A: '#8f8aa8', a: '#5f5a7a',
};

const HALL = [
  '...........YY...........',
  '..........YYYY..........',
  '......TTTTTTTTTTTT......',
  '....TTttttttttttttTT....',
  '..TTTTTTTTTTTTTTTTTTTT..',
  '..WWWWWWWWWWWWWWWWWWWW..',
  '..WCWWWCWWWCWWWCWWWCWW..',
  '..WCWWWCWWWCWWWCWWWCWW..',
  '..WCWWWCWWBBBBWWWCWWCW..',
  '..WCWWWCWWBYYBWWWCWWCW..',
  '..WCWWWCWWBYYBWWWCWWCW..',
  '..WCWWWCWWBBBBWWWCWWCW..',
  '.SSSSSSSSSSSSSSSSSSSSSS.',
  'SssssssssssssssssssssssS',
];
const HALL_PALETTE: Record<string, string> = {
  Y: '#ffd23f', T: '#c9a227', t: '#ffe066', W: '#f4ecd8', C: '#c9c2e0', B: '#3b2a6b', S: '#8f8aa8', s: '#5f5a7a',
};

const COLOSSEUM = [
  '....RR..........RR......',
  '....RRR.........RRR.....',
  '....R...........R.......',
  '..SSSSSSSSSSSSSSSSSSSS..',
  '.SsSsSsSsSsSsSsSsSsSsSS.',
  '.SSSSSSSSSSSSSSSSSSSSSS.',
  '.SaSaSaSaSaSaSaSaSaSaSS.',
  '.SaSaSaSaSaSaSaSaSaSaSS.',
  '.SSSSSSSSSSSSSSSSSSSSSS.',
  '.SaSaSaSaBBBBBaSaSaSaSS.',
  '.SaSaSaSaBrrrBaSaSaSaSS.',
  '.SaSaSaSaBrrrBaSaSaSaSS.',
  '.SSSSSSSSSSSSSSSSSSSSSS.',
  'GGGGGGGGGGGGGGGGGGGGGGGG',
];
const COLOSSEUM_PALETTE: Record<string, string> = {
  R: '#d8432e', S: '#cbb898', s: '#e9dcc0', a: '#3b2a1a', B: '#2a1d12', r: '#ff4a3d', G: '#5f5a7a',
};

const GATE = [
  '......PPPPPPPPPPPP......',
  '.....PPppppppppppPP.....',
  '....PPpp........ppPP....',
  '....Pp..vvvvvvvv..pP....',
  '....Pp.vvVVVVVVvv.pP....',
  '....Pp.vVVwwwwVVv.pP....',
  '....Pp.vVwwWWwwVv.pP....',
  '....Pp.vVVwwwwVVv.pP....',
  '....Pp.vvVVVVVVvv.pP....',
  '....Pp..vvvvvvvv..pP....',
  '....Pp............pP....',
  '...SSSSSSSSSSSSSSSSSS...',
  '..SsssssssssssssssssS..',
];
const GATE_PALETTE: Record<string, string> = {
  P: '#3b2a6b', p: '#5b3fa8', v: '#7a3fa8', V: '#b794ff', w: '#e9e4ff', W: '#ffffff', S: '#8f8aa8', s: '#5f5a7a',
};

const UPGRADES = [
  '..........YYYY..........',
  '.........YGGGY..........',
  '........YGGGGGY.........',
  '.......YGGGGGGGGY.......',
  '....RRRRRRRRRRRRRRRR....',
  '..RRRRRRRRRRRRRRRRRRRR..',
  'RRDDDDDDDDDDDDDDDDDDDDRR',
  '....WWWWWWWWWWWWWWWWWW..',
  '....WppWWWWWWWWWWWWppW..',
  '....WppWWWaaaaaaWWWppW..',
  '....WppWWWaAAAAaWWWppW..',
  '....WppWWWaAAAAaWWWppW..',
  '....WppWWWaaaaaaWWWppW..',
  '....WppWWWWWWWWWWWWppW..',
  '..SSSSSSSSSSSSSSSSSSSS..',
  '.SssssssssssssssssssssS.',
  'SSSSSSSSSSSSSSSSSSSSSSSS',
];

const UPGRADES_PALETTE: Record<string, string> = {
  Y: '#ffd23f',
  G: '#ffe890',
  R: '#5b2fc0',
  D: '#3a1f88',
  W: '#f4ecd8',
  p: '#8a5a30',
  a: '#b794ff',
  A: '#7a50e0',
  S: '#8f8aa8',
  s: '#5f5a7a',
};

const cache = new Map<string, string>();

function paintAscii(key: string, rows: string[], palette: Record<string, string>): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(...rows.map((r) => r.length)) * 6;
  canvas.height = rows.length * 6;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = palette[ch];
      if (!color) return;
      const px=x*6, py=y*6;
      ctx.fillStyle = color; ctx.fillRect(px,py,6,6);
      ctx.fillStyle='rgba(255,237,191,.27)';
      if(rows[y-1]?.[x]!==ch) ctx.fillRect(px,py,6,1);
      ctx.fillStyle='rgba(13,13,35,.28)'; ctx.fillRect(px+5,py+1,1,5);
      if ('SsWCP'.includes(ch)) {
        ctx.fillRect(px,py+5,6,1); ctx.fillRect(px+(y%2?2:4),py+2,1,3);
        ctx.fillStyle='rgba(255,255,230,.1)';ctx.fillRect(px+1,py+1,3,1);
      } else if ('RrTtDd'.includes(ch)) {
        ctx.fillRect(px,py+4,6,1);ctx.fillStyle='rgba(255,234,175,.22)';ctx.fillRect(px+1,py+1,3,2);
      } else if ('Yyw'.includes(ch)) {
        ctx.fillStyle='rgba(255,246,192,.55)';ctx.fillRect(px+1,py+1,3,3);
      } else if ('B'.includes(ch)) {
        ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(px,py,6,2);
      }

    }),
  );
  // Facade fixtures: warm lanterns, planted entrances, and destination emblems.
  const w=canvas.width, h=canvas.height;
  if (!['port','lot','board','gate'].includes(key)) {
    for (const x of [w*.23,w*.77]) {
      ctx.fillStyle='#342d38';ctx.fillRect(Math.round(x)-3,h-34,6,14);
      ctx.fillStyle='#bc874c';ctx.fillRect(Math.round(x)-4,h-30,8,10);
      ctx.fillStyle='#ffe7a1';ctx.fillRect(Math.round(x)-2,h-29,4,7);
    }
    for (const x of [5,w-13]) {
      ctx.fillStyle='#8c6352';ctx.fillRect(x,h-11,8,7);
      ctx.fillStyle='#2b574b';ctx.fillRect(x-2,h-18,12,8);
      ctx.fillStyle='#74945c';ctx.fillRect(x,h-21,7,6);
    }
  }
  if (key==='armory') {
    ctx.fillStyle='#d8e9ed';ctx.fillRect(w/2-2,h-39,4,19);
    ctx.fillStyle='#e9be65';ctx.fillRect(w/2-7,h-24,14,3);
  }
  if(key==='lab'||key==='gravity') {
    ctx.fillStyle='#8be6cf';for(let i=0;i<3;i++)ctx.fillRect(w/2-9+i*8,h-44,4,4);
  }
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

export const upgradesHouseUrl = () => paintAscii('upgrades', UPGRADES, UPGRADES_PALETTE);
export const shrineUrl = () => landmarkUrl('shrine') || paintAscii('shrine', SHRINE, SHRINE_PALETTE);
export const lotUrl = () => paintAscii('lot', LOT, LOT_PALETTE);
export const dojoUrl = () => landmarkUrl('dojo') || paintAscii('dojo', DOJO, DOJO_PALETTE);
export const labUrl = () => landmarkUrl('lab') || paintAscii('lab', LAB, LAB_PALETTE);
export const gravityUrl = () => landmarkUrl('gravity') || paintAscii('gravity', GRAVITY, GRAVITY_PALETTE);
export const portUrl = () => landmarkUrl('port') || paintAscii('port', PORT, PORT_PALETTE);
export const boardUrl = () => landmarkUrl('board') || paintAscii('board', BOARD, BOARD_PALETTE);
export const tentUrl = () => landmarkUrl('tent') || paintAscii('tent', TENT, TENT_PALETTE);
export const towerUrl = () => landmarkUrl('tower') || paintAscii('tower', TOWER, TOWER_PALETTE);
export const shopUrl = () => landmarkUrl('shop') || paintAscii('shop', SHOP, SHOP_PALETTE);
export const armoryUrl = () => landmarkUrl('armory') || paintAscii('armory', ARMORY, ARMORY_PALETTE);
export const hallUrl = () => landmarkUrl('hall') || paintAscii('hall', HALL, HALL_PALETTE);
export const colosseumUrl = () => landmarkUrl('colosseum') || paintAscii('colosseum', COLOSSEUM, COLOSSEUM_PALETTE);
export const gateUrl = () => landmarkUrl('gate') || paintAscii('gate', GATE, GATE_PALETTE);
export const dungeonUrl = () => landmarkUrl('dungeon') || dojoUrl();
export const raidUrl = () => landmarkUrl('raid') || colosseumUrl();
export const climbUrl = () => landmarkUrl('climb') || towerUrl();
export const journalUrl = () => landmarkUrl('journal') || hallUrl();
