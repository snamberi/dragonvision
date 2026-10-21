// Pixel item icons: 16x16 ASCII grids painted 3px per cell into a 48x48 canvas.
// '.' is empty; 'o' is the dark outline. Every shape also gets an automatic 1-cell
// outline wherever an empty cell touches it, so icons read on dark purple panels.

const OUTLINE = '#120b2e';
const SCALE = 3;

type Palette = Record<string, string>;

// ---------------------------------------------------------------- ember (fire)

const EMBER: Palette = {
  R: '#ff7a3d', // base orange
  r: '#c2410c', // shade
  D: '#7a1f12', // dark trim
  Y: '#ffd23f', // flame / gold
  y: '#c98a1a', // gold shade
  W: '#fff4d0', // white-hot
  S: '#d9e0f0', // steel
  K: '#2b2140', // black belt
  k: '#5a3a22', // leather
  w: '#8a5a30', // wood
};

// Flaming broadsword, tip top-right.
const EMBER_BLADE = [
  '................',
  '............RW..',
  '..........YRWS..',
  '.........YRWS...',
  '........RYWS....',
  '.......RRWS.....',
  '......YRWS......',
  '...Y.RRWS.......',
  '....YRWS........',
  '.....YR.........',
  '....kwY.........',
  '...kw..Y........',
  '..kw............',
  '.YY.............',
  '.Y..............',
  '................',
];

// Martial-arts gi with crossed lapel and black belt.
const EMBER_GI = [
  '................',
  '................',
  '....RRDooDRR....',
  '..RRRRRDoDRRRR..',
  '.RRRRrRRDDrRRRR.',
  '.RRRoRRRRDRoRRR.',
  '.RRRoRRRRRDoRRR.',
  '.DDDoRRRRRRoDDD.',
  '....rRRRRRRr....',
  '....rRRRRRRr....',
  '....KKKKKKKK....',
  '....rRRRKKRr....',
  '....rRRRKRKr....',
  '....rrrrKrKr....',
  '................',
  '................',
];

// Headband with a flame plate and trailing ribbons.
const EMBER_BAND = [
  '................',
  '................',
  '................',
  '.....SSSSSS.....',
  '.R...SDYDDS...R.',
  '.RRRRSDYRDSRRRR.',
  '.rRRRSYRRYSRRRr.',
  '..rrrSDYYDSrrr..',
  '.....SSSSSS.RR..',
  '...........RrRR.',
  '..........RR.Rr.',
  '.........Rr..Rr.',
  '........rr...rr.',
  '................',
  '................',
  '................',
];

// Talisman on a cord with a flame gem.
const EMBER_CHARM = [
  '...k........k...',
  '....k......k....',
  '.....k....k.....',
  '......k..k......',
  '.......YY.......',
  '......YyyY......',
  '.....YyRRyY.....',
  '....YyRWYRyY....',
  '....YyRYYRyY....',
  '....YyrRRryY....',
  '.....YyrryY.....',
  '......YyyY......',
  '.......YY.......',
  '.......RR.......',
  '......RrrR......',
  '................',
];

// ---------------------------------------------------------------- bulwark (steel)

const BULWARK: Palette = {
  W: '#f2f6ff', // highlight
  S: '#c9d6ee', // steel
  s: '#7d8db0', // steel shade
  D: '#3e4f7a', // dark steel
  B: '#7fb2ff', // set blue
  b: '#3f6fc4', // blue shade
  Y: '#ffd23f', // rivets
  w: '#a0683a', // wood
  k: '#5a3a22', // dark wood
};

const BULWARK_HAMMER = [
  '................',
  '..WWWWWWWWWWWW..',
  '..WSSSSBbSSSSs..',
  '..WSSSSBbSSSSs..',
  '..WSSSSBbSSSSs..',
  '..ssssDDDDssss..',
  '.......wk.......',
  '.......wk.......',
  '.......wk.......',
  '.......Bb.......',
  '.......kk.......',
  '.......wk.......',
  '.......kk.......',
  '.......wk.......',
  '......SSss......',
  '................',
];

// Breastplate with round pauldrons and gold rivets.
const BULWARK_PLATE = [
  '................',
  '................',
  '..WWW......WWW..',
  '.WSSSoWWWWoSSSs.',
  '.SSYSoSSSSoSYSs.',
  '.sSSSoSBBSoSSss.',
  '..sssoSBBSosss..',
  '....WSSBBSSs....',
  '....SYSBBSYs....',
  '....SSSBBSSs....',
  '....DDDDDDDD....',
  '....SsSSsSSs....',
  '....ssDssDss....',
  '................',
  '................',
  '................',
];

// Thick band with a square crest stone.
const BULWARK_RING = [
  '................',
  '......DDDD......',
  '.....DBWBbD.....',
  '.....DBBBbD.....',
  '.....DbbbbD.....',
  '....WSDDDDSs....',
  '...WSSssssSSs...',
  '..WSso....osSs..',
  '..WSo......oSs..',
  '..WSo......oSs..',
  '..SSo......oSs..',
  '..sSso....osss..',
  '...sSSssssSss...',
  '....ssssssss....',
  '................',
  '................',
];

// Round medallion with a shield emblem.
const BULWARK_SEAL = [
  '................',
  '.....DDDDDD.....',
  '...DDSSSSSSDD...',
  '..DSWWSSSSSSsD..',
  '..DSWBBBBBBssD..',
  '.DSWSBWBBBbSssD.',
  '.DSWSBWBBBbSssD.',
  '.DSSSBBBBBbSssD.',
  '.DSSSbBBBbbSssD.',
  '.DSSSSbBBbSSssD.',
  '.DSSSSSbbSSSssD.',
  '..DSSSSSSSSssD..',
  '..DsSSSSSSsssD..',
  '...DDssssssDD...',
  '.....DDDDDD.....',
  '................',
];

// ---------------------------------------------------------------- tempest (wind)

const TEMPEST: Palette = {
  C: '#7fe7ff', // base cyan
  c: '#2fa6d0', // shade
  D: '#1c4f6e', // dark
  L: '#c8f6ff', // light
  W: '#ffffff', // white
  w: '#a9d8ea', // wing shade
  S: '#d8e8f5', // silver
  s: '#7a96b0', // silver shade
  d: '#123a52', // sole
  k: '#0f2a40', // hood shadow
  Y: '#fff36b', // lightning
  y: '#e0a92a', // lightning shade
};

// Long staff topped by a swirling wind orb.
const TEMPEST_STAFF = [
  '................',
  '..CCCC....W.....',
  '.CLLLCC....W....',
  '.CLccLC.....W...',
  '.CCcLLC.....W...',
  '.cCCCCc....W....',
  '..ccccSS..W.....',
  '......Ss........',
  '.......Ss.......',
  '........Ss......',
  '.........CC.....',
  '..........Ss....',
  '...........Ss...',
  '............Ss..',
  '.............DD.',
  '................',
];

// Hooded cloak billowing to the right.
const TEMPEST_CLOAK = [
  '................',
  '......CCCC......',
  '.....CLLCCc.....',
  '....CLkkkkCc....',
  '....CkkkkkkC....',
  '....CkkkkkkCc...',
  '...CCCkkkkCCcc..',
  '...CLCCYYCCCccc.',
  '..CLCCCCCcCCCcc.',
  '..CLCCCCcCCCCcc.',
  '.CLCCCCcCCCCCcc.',
  '.CLCCCcCCCCCCc..',
  '.cCCCcCCCCCcc.c.',
  '..cc..ccc..cc...',
  '................',
  '................',
];

// A pair of winged boots.
const TEMPEST_BOOTS = [
  '................',
  '.........wDDDD..',
  '........wWcCCc..',
  '.......wWWcCCc..',
  '..........cCCc..',
  '..w..DDDD.cCCc..',
  '..ww.CLCC.cCCcc.',
  '.wWW.CLCC.cCCcc.',
  '.wWWWCLCC.ddddd.',
  '..wWWCLCC.......',
  '...wWCLCC.......',
  '.....CLCCCCC....',
  '.....CCCCCCCC...',
  '.....DDDDDDDD...',
  '................',
  '................',
];

// Hook earring with a gem stud and a lightning-bolt drop.
const TEMPEST_EARRING = [
  '................',
  '......SSS.......',
  '.....S...S......',
  '.........S......',
  '........LCc.....',
  '........Ccc.....',
  '.........S......',
  '........WYY.....',
  '.......WYY......',
  '......WYYYYY....',
  '........YYy.....',
  '.......YYy......',
  '......Yy........',
  '......y.........',
  '................',
  '................',
];

// ---------------------------------------------------------------- sage (jade)

const SAGE: Palette = {
  G: '#8ef0a8', // jade
  g: '#3fae6a', // shade
  J: '#1f6b45', // dark jade
  L: '#d6ffe0', // light
  Y: '#ffd23f', // gold
  y: '#c98a1a', // gold shade
  P: '#ff9ccf', // petal
  p: '#d0609a', // petal shade
  W: '#fff0f6', // petal light
  T: '#d8432e', // tassel
  t: '#8a2418', // tassel shade
};

// Short golden rod with a crescent cradling a jade gem.
const SAGE_ROD = [
  '................',
  '...Y........Y...',
  '...YY..GG..YY...',
  '...yYYGLGGYYy...',
  '....yYGGGgYy....',
  '.....yYYYYy.....',
  '......yYYy......',
  '.......Yy.......',
  '.....GGYy.......',
  '......gYy.......',
  '.......YyGG.....',
  '.......Yyg......',
  '.......Yy.......',
  '......yYYy......',
  '.......yy.......',
  '................',
];

// Long monk robe with bell sleeves and a gold sash.
const SAGE_ROBE = [
  '................',
  '.....GGooGG.....',
  '...GGGGYoGGGG...',
  '..GGGGGGYGGGGG..',
  '.GGGGGGGGYGGGGG.',
  '.GGGoGGGGGGoGGG.',
  '.gGGoGGGGGGoGGg.',
  '.gGGoGGGGGGoGGg.',
  '.gGGoYYYYYYoGGg.',
  '.gggoGGGYyGoggg.',
  '.JJJoGGGYGGoJJJ.',
  '....gGGGGyGg....',
  '...gGGGGGGGGg...',
  '...gGGGGGGGGg...',
  '..JJJJJJJJJJJJ..',
  '................',
];

// Loop of prayer beads with a gold guru bead and tassel.
const SAGE_BEADS = [
  '................',
  '....LG.LG.LG....',
  '....Gg.Gg.Gg....',
  '..LG........LG..',
  '..Gg........Gg..',
  '................',
  '.LG..........LG.',
  '.Gg..........Gg.',
  '................',
  '..LG........LG..',
  '..Gg........Gg..',
  '....LG.YY.LG....',
  '....Gg.Yy.Gg....',
  '.......yy.......',
  '......TtTt......',
  '................',
];

// Lotus blossom on a lily pad.
const SAGE_LOTUS = [
  '................',
  '................',
  '.......WW.......',
  '......WPPp......',
  '..W...WPPp...p..',
  '..WP..WPPp..Pp..',
  '..WPP.WPPp.PPp..',
  '...WPPoPpoPPp...',
  '.WWPPPPYYPPPPpp.',
  '..WWPPPPPPPPpp..',
  '.LGGGGGGGGGGGGg.',
  '.GGGGGGGGGGGGgg.',
  '..gGGGGGGGGggg..',
  '....gggggggg....',
  '................',
  '................',
];

// ---------------------------------------------------------------- void (shadow)

const VOID: Palette = {
  K: '#4a3590', // dark violet
  M: '#5f5694', // blade steel
  k: '#2a1d55', // deeper
  P: '#b794ff', // set purple
  p: '#7b5cc4', // purple shade
  W: '#efe6ff', // glow
  S: '#8f8aa8', // dull metal
  H: '#5b46a0', // handle wrap
  h: '#b794ff', // wrap diamonds
  X: '#120b2e', // pupil
  V: '#6b5a9a', // cord
  I: '#f4ecd8', // ivory
  i: '#9a8ab8', // ivory shade (void tinted)
  L: '#ffffff', // shine
};

// Curved katana, tip top-left, glowing edge.
const VOID_EDGE = [
  '................',
  '.MP.............',
  '..MP............',
  '...MPW..........',
  '....MP..........',
  '.....MP.........',
  '......MPW.......',
  '.......MP..S....',
  '........MPSS....',
  '.........SS.....',
  '........SSHh....',
  '...........Hh...',
  '............hH..',
  '.............HS.',
  '................',
  '................',
];

// Spiky mantle with a high collar.
const VOID_MANTLE = [
  '................',
  '..p..........p..',
  '..pP........Pp..',
  '..pPK......KPp..',
  '..pPKK....KKPp..',
  '.KKpKKK..KKKpKK.',
  '.KKKKKKPPKKKKKK.',
  '.KKKKKKppKKKKKK.',
  '.kKKKKKKKKKKKKk.',
  '.kKKKKKKKKKKKKk.',
  '.kkKKKKKKKKKKkk.',
  '.kPkKKPKKPKKkPk.',
  '.P..kP.kk.Pk..P.',
  '.....P..P..P....',
  '................',
  '................',
];

// Floating eyeball in a dark setting.
const VOID_EYE = [
  '................',
  '.....KKKKKK.....',
  '...KKkkkkkkKK...',
  '..KkkkWWWWkkkK..',
  '..KkWWWPPWWWkK..',
  '.KkWWWPPPPWWWkK.',
  '.KkWWPPXXPPWWkK.',
  '.KWWWPLXXPPWWWK.',
  '.KWWWPPXXPPWWWK.',
  '.KkWWPPXXpPWWkK.',
  '.KkWWWPppPWWWkK.',
  '..KkWWWppWWWkK..',
  '..KkkkWWWWkkkK..',
  '...KKkkkkkkKK...',
  '.....KKKKKK.....',
  '................',
];

// One big curved fang hanging from a cord.
const VOID_FANG = [
  '................',
  '.V............V.',
  '..V..........V..',
  '...VV......VV...',
  '.....VVPPVV.....',
  '......pPPp......',
  '.....IIIIi......',
  '.....LIIIi......',
  '.....LIIi.......',
  '.....IIIi.......',
  '.....IIi........',
  '......Ii........',
  '.......Ii.......',
  '........i.......',
  '................',
  '................',
];

// ---------------------------------------------------------------- misc items

const SPIN_ORB = [
  '................',
  '.....GGGGGG.....',
  '...GGLLGGGGGG...',
  '..GLWLGGGGGGGg..',
  '..GLLGGGGGGGGg..',
  '.GGLGGGGSGGGGgg.',
  '.GGGGGGSSSGGGgg.',
  '.GGGGSSSWSSSGgg.',
  '.GGGGGSSSSSGggg.',
  '.gGGGGSSGSSGggg.',
  '.gGGGGSGGGSgggg.',
  '..gGGGGGGGgggg..',
  '..ggGGGGgggggd..',
  '...dggggggggd...',
  '.....dddddd.....',
  '................',
];
const SPIN_ORB_PALETTE: Palette = {
  G: '#4ade80', g: '#1f9d55', d: '#0f6b3a', L: '#b6ffcf', W: '#ffffff', S: '#fffbd0',
};

const SHARD = [
  '................',
  '.........WL.....',
  '........WLLT....',
  '........WLTTt...',
  '.......WLLTTt...',
  '.......WLTTtt...',
  '......WLLTTt....',
  '......WLTTtt....',
  '.....WLLTTt.....',
  '.....WLTTtt.....',
  '....WLLTtt......',
  '....WLTtt.......',
  '....LTtt........',
  '.....Td.........',
  '................',
  '................',
];
const SHARD_PALETTE: Palette = {
  W: '#e6fffb', L: '#7ff5e6', T: '#2dd4bf', t: '#0f8f86', d: '#0b5e5c',
};

// Golden puzzle-piece fragment stamped with a dragon eye.
const PIECE = [
  '................',
  '......YYY.......',
  '.....YWYYO......',
  '......YYO.......',
  '..YWWYYYYYYO....',
  '..YWYYYYYYYO....',
  '..YYYYYrYYYO....',
  '....YYrRrYYYYYO.',
  '....YrRXRrYYYYO.',
  '....YYrRrYYYYYO.',
  '..YYYYYrYYYO....',
  '..YYYYYYYYYO....',
  '..OOOOOOOOOO....',
  '................',
  '................',
  '................',
];
const PIECE_PALETTE: Palette = {
  Y: '#ffd23f', W: '#fff6c0', O: '#e07a1f', R: '#ff5a3d', r: '#9a3412', X: '#2a0a08',
};

// Ticket with a stub, perforation and a refresh symbol.
const REFRESH_TICKET = [
  '................',
  '................',
  '.YYYpWWWWWWWWWs.',
  '.YYYWWWWBBBWWWs.',
  '.YYYpWWBWWWBWWs.',
  '.YYYWWBWWWBBBWs.',
  '..YYpWBWWWWBWW..',
  '..YYWWWBWWWWBW..',
  '.YYYpWBBBWWWBWs.',
  '.YYYWWWBWWWBWWs.',
  '.YYYpWWWBBBWWWs.',
  '.yyysssssssssss.',
  '................',
  '................',
  '................',
  '................',
];
const REFRESH_TICKET_PALETTE: Palette = {
  W: '#f4ecd8', s: '#c9b896', Y: '#ffd23f', y: '#c98a1a', p: '#8a7650', B: '#2f7fd8',
};

// Rolled scroll tied with a ribbon and wax seal.
const RESPEC_SCROLL = [
  '................',
  '................',
  '................',
  '................',
  '...........ddd..',
  '.WWWWWRRWWdWWWd.',
  '.WWWWWRRWWdWdWd.',
  '.sssssrrssdWdWd.',
  '.sssssrrssdWWWd.',
  '.ddddRRRRd.ddd..',
  '....RRYYRR......',
  '....RRYYRr......',
  '.....rrrr.......',
  '....r....r......',
  '................',
  '................',
];
const RESPEC_SCROLL_PALETTE: Palette = {
  W: '#f4ecd8', s: '#d6c39a', d: '#8a6a3a', R: '#d8432e', r: '#8a2418', Y: '#ffd23f',
};

// Stack of gold coins with reeded edges.
const COINS = [
  '................',
  '.....YYYYYY.....',
  '...YYWWYYYYYY...',
  '...YWYYOOYYYy...',
  '...yYYYYYYYyy...',
  '...YyYyYyYyYy...',
  '...OOOOOOOOOO...',
  '..YyYyYyYyYy....',
  '..OOOOOOOOOO....',
  '...YyYyYyYyYy...',
  '...OOOOOOOOOO...',
  '....YyYyYyYyYy..',
  '....OOOOOOOOOO..',
  '................',
  '................',
  '................',
];
const COINS_PALETTE: Palette = {
  Y: '#ffd23f', y: '#e0a020', W: '#fff6c0', O: '#a8580f',
};

// Brilliant-cut blue gem.
const GEMS = [
  '................',
  '................',
  '................',
  '....LWWLLLBb....',
  '...LWLLBBBBbb...',
  '..LWLBBBBBBBbb..',
  '.LLBBBBBBBBBbbb.',
  '..LBBBBBBBBbbb..',
  '...LBBBBBBbbb...',
  '....LBBBBbbb....',
  '.....LBBbbb.....',
  '......LBbb......',
  '.......Bb.......',
  '................',
  '................',
  '................',
];
const GEMS_PALETTE: Palette = {
  W: '#ffffff', L: '#b8f4ff', B: '#58dfff', b: '#1f8fbf',
};

// ---------------------------------------------------------------- painter

const GEAR: Record<string, [string[], Palette]> = {
  'ember-blade': [EMBER_BLADE, EMBER],
  'ember-gi': [EMBER_GI, EMBER],
  'ember-band': [EMBER_BAND, EMBER],
  'ember-charm': [EMBER_CHARM, EMBER],
  'bulwark-hammer': [BULWARK_HAMMER, BULWARK],
  'bulwark-plate': [BULWARK_PLATE, BULWARK],
  'bulwark-ring': [BULWARK_RING, BULWARK],
  'bulwark-seal': [BULWARK_SEAL, BULWARK],
  'tempest-staff': [TEMPEST_STAFF, TEMPEST],
  'tempest-cloak': [TEMPEST_CLOAK, TEMPEST],
  'tempest-boots': [TEMPEST_BOOTS, TEMPEST],
  'tempest-earring': [TEMPEST_EARRING, TEMPEST],
  'sage-rod': [SAGE_ROD, SAGE],
  'sage-robe': [SAGE_ROBE, SAGE],
  'sage-beads': [SAGE_BEADS, SAGE],
  'sage-lotus': [SAGE_LOTUS, SAGE],
  'void-edge': [VOID_EDGE, VOID],
  'void-mantle': [VOID_MANTLE, VOID],
  'void-eye': [VOID_EYE, VOID],
  'void-fang': [VOID_FANG, VOID],
};

export type ItemArtId = 'goldenOrb' | 'spinOrb' | 'shard' | 'piece' | 'refreshTicket' | 'respecScroll' | 'coins' | 'gems';

const ITEMS: Record<ItemArtId, [string[], Palette]> = {
  spinOrb: [SPIN_ORB, SPIN_ORB_PALETTE],
  goldenOrb: [SPIN_ORB, { ...SPIN_ORB_PALETTE, G:'#f2c454', g:'#aa6e29', h:'#fff3ae', W:'#fffbe0', d:'#6c431e', L:'#ffe59a', D:'#9c5b21', S:'#fff6ce' }],
  shard: [SHARD, SHARD_PALETTE],
  piece: [PIECE, PIECE_PALETTE],
  refreshTicket: [REFRESH_TICKET, REFRESH_TICKET_PALETTE],
  respecScroll: [RESPEC_SCROLL, RESPEC_SCROLL_PALETTE],
  coins: [COINS, COINS_PALETTE],
  gems: [GEMS, GEMS_PALETTE],
};

const cache = new Map<string, string>();

function paintIcon(key: string, rows: string[], palette: Palette): string {
  const hit = cache.get(key);
  if (hit) return hit;
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 16 * SCALE;
  canvas.height = 16 * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const at = (x: number, y: number) => rows[y]?.[x] ?? '.';
  const filled = (x: number, y: number) => {
    const ch = at(x, y);
    return ch !== '.' && ch !== 'o';
  };
  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = at(x, y);
      const px = x * SCALE;
      const py = y * SCALE;
      if (ch === 'o' || (ch === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)))) {
        ctx.fillStyle = OUTLINE;
        ctx.fillRect(px, py, SCALE, SCALE);
        continue;
      }
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, SCALE, SCALE);
      // Soft top-edge light where a new color begins, and a dark right-side shade.
      if (at(x, y - 1) !== ch) {
        ctx.fillStyle = 'rgba(255,244,210,.22)';
        ctx.fillRect(px, py, SCALE, 1);
      }
      ctx.fillStyle = 'rgba(15,12,40,.18)';
      ctx.fillRect(px + SCALE - 1, py + 1, 1, SCALE - 1);
    }
  }
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}

/** Icon for a gear template id (e.g. 'ember-blade'); '' for unknown ids or without a canvas. */
export function gearArtUrl(templateId: string): string {
  const art = GEAR[templateId];
  return art ? paintIcon(`gear:${templateId}`, art[0], art[1]) : '';
}

/** Icon for a non-gear inventory item / currency. */
export function itemArtUrl(id: ItemArtId): string {
  const art = ITEMS[id];
  return art ? paintIcon(`item:${id}`, art[0], art[1]) : '';
}
