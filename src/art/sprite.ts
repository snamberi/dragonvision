import type { Look } from '../game/types';
import { identityFor } from './identity';
export type SpritePose = 'idle' | 'charge' | 'punch' | 'hurt' | 'victory' | 'guard' | 'walk';

// Keep the original 32px face and hair vocabulary, then compose a 48px
// family-specific body, accessories and independently posed limbs. Faces point right.

const BASE_SIZE = 32;
export const SPRITE_SIZE = 48;
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
    if (x >= 0 && y >= 0 && x < BASE_SIZE && y < BASE_SIZE) grid[y][x] = c;
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

function paintBase(look: Look): Grid {
  const grid: Grid = Array.from({ length: BASE_SIZE }, () => Array<string | null>(BASE_SIZE).fill(null));
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

  // Folded collar, embroidered chest badge, knuckles and boot cuffs.
  rect(13, 18, 1, 3, outfitLight);
  set(14, 19, outfitDark);
  set(18, 19, look.accent);
  set(18, 20, shade(look.accent, 0.5));
  set(19, 21, outfitDark);
  set(22, 21, shade(look.skin, 0.3));
  rect(12, 28, 3, 1, look.accent);
  rect(18, 28, 3, 1, look.accent);
  set(18, 30, shade(look.boots, 0.35));
  // Light the top edge of the hair so it reads as volume.
  const hairLight = shade(hair, 0.3);
  for (let y = 1; y < BASE_SIZE; y++) {
    for (let x = 0; x < BASE_SIZE; x++) {
      if (grid[y][x] === hair && !grid[y - 1][x]) grid[y][x] = hairLight;
    }
  }

  // Dark outline around every filled pixel for the classic sprite look.
  const outlined = grid.map((row) => [...row]);
  for (let y = 0; y < BASE_SIZE; y++) {
    for (let x = 0; x < BASE_SIZE; x++) {
      if (grid[y][x]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx]);
      if (near) outlined[y][x] = OUTLINE;
    }
  }
  return outlined;
}

/** 48px artboard: an individual silhouette with independently posed limbs. */
export function paintFighter(look: Look, familyId = 'kairo', pose: SpritePose = 'idle', frame = 0): Grid {
  const art: Grid = Array.from({ length: 48 }, () => Array<string | null>(48).fill(null));
  const profile = identityFor(familyId);
  const put = (x: number, y: number, c: string | null) => { if (x >= 0 && x < 48 && y >= 0 && y < 48) art[y][x] = c; };
  const rect = (x:number,y:number,w:number,h:number,c:string) => { for(let j=0;j<h;j++) for(let i=0;i<w;i++) put(x+i,y+j,c); };
  const line = (x:number,y:number,ex:number,ey:number,c:string,width=1) => {
    const n=Math.max(Math.abs(ex-x),Math.abs(ey-y),1);
    for(let i=0;i<=n;i++) rect(Math.round(x+(ex-x)*i/n),Math.round(y+(ey-y)*i/n),width,width,c);
  };
  const dark=shade(look.outfit,-.38), light=shade(look.outfit,.28), skinDark=shade(look.skin,-.25);
  const a=look.accent, glow=look.aura ?? profile.color;
  const heavy=look.large || profile.build==='heavy';
  const lean=!heavy && profile.build==='lean';
  const bw=heavy?16:lean?10:12, bx=25-Math.floor(bw/2);
  const breath=pose==='idle' && frame===1 ? 1 : 0;
  const crouch=pose==='charge'?2:pose==='hurt'?1:0;
  const ty=25+breath+crouch;
  const headX=pose==='hurt'?7:pose==='punch'?11:9;
  const headY=7+breath+crouch;
  // Rear silhouette: cloth, wings, tails and weapons remain visible outside the body.
  if(profile.accessory==='cape') {
    for(let j=0;j<19;j++) rect(bx-4-Math.floor(j/5),ty+j,7+Math.floor(j/5),1,j%5===0?a:dark);
    line(bx-3,ty+3,bx-7+(frame%2),ty+17,light);
  }
  if(profile.accessory==='wings') {
    for(let j=0;j<14;j++) {
      rect(bx-3-Math.floor(j/2),ty-4+j,5+Math.floor(j/3),1,j%3===0?a:dark);
      rect(bx+bw-1,ty-4+j,5+Math.floor(j/3),1,j%3===0?a:dark);
    }
    line(bx-2,ty+3,bx-10,ty-6+(frame%2),a,2);
  }
  if(profile.accessory==='tail') { line(bx,ty+13,bx-8,ty+12,dark,3);line(bx-8,ty+12,bx-12,ty+7+frame,look.skin,3);line(bx-12,ty+7+frame,bx-10,ty+4,look.skin,2); }
  if(profile.accessory==='blade') {line(bx-7,ty+12,bx+4,ty-9,'#c8d4e4',2);line(bx-6,ty+10,bx+4,ty-9,'#fff3d5');line(bx-9,ty+7,bx-2,ty+11,a,2);}
  if(profile.accessory==='scarf') {rect(bx-7-frame,ty+1,9,3,a);rect(bx-9-frame,ty+3,6,3,shade(a,-.3));}
  if(profile.accessory==='staff') {rect(bx-7,ty-10,2,29,'#a27b50');rect(bx-9,ty-12,6,5,a);rect(bx-8,ty-13,4,2,glow);}
  // Large identifying props read even in a tiny portrait or an unlit silhouette.
  if(profile.accessory==='spear') {line(9,42,14,5,'#9b774f',2);line(14,5,18,1,'#e9f4eb',2);line(14,5,11,1,a,2);rect(10,14,7,2,a);}
  if(profile.accessory==='shield') {rect(7,25,11,14,a);rect(9,23,7,18,a);rect(10,27,5,11,dark);line(12,25,12,39,glow,2);line(8,31,16,31,glow);}
  if(profile.accessory==='fan') {for(let i=0;i<6;i++)line(14,33,5+i*2,18-Math.abs(2-i),i%2?a:glow,2);line(14,33,17,36,'#785748',2);}
  if(profile.accessory==='hammer') {line(11,41,12,11,'#a98454',3);rect(5,9,15,8,dark);rect(4,9,4,8,a);rect(17,9,4,8,a);rect(8,10,9,2,light);}
  if(profile.accessory==='lantern') {line(10,14,10,37,'#9b8059',2);rect(6,26,11,11,a);rect(8,27,7,7,'#f7ffd7');rect(5,25,13,2,dark);rect(8,24,7,2,a);}
  if(profile.accessory==='bow') {line(9,14,5,24,a,2);line(5,24,6,33,a,2);line(6,33,12,42,a,2);line(9,14,12,42,'#ece2b3');line(6,28,18,28,'#a5b2c2');}
  if(profile.accessory==='claws') {for(let i=0;i<3;i++)line(bx-4+i*3,ty+8,bx-5+i*3,ty+15,'#c7d3e2',2);rect(bx-5,ty+5,10,4,a);}
  if(['lyra','noctelle','vesper'].includes(familyId)) {for(let j=0;j<17;j++)rect(bx-2-Math.floor(j/5),ty+j,bw+4+Math.floor(j/3),1,j%5===0?a:dark);}
  if(['mogra','tharok','gorvath','onyx','cairn'].includes(familyId)){rect(bx-4,ty-2,9,6,dark);rect(bx+bw-4,ty-2,9,6,light);rect(bx-4,ty-3,8,2,a);}
  // Wide stances, heavy boots and actual alternating walking legs.
  const stride=pose==='walk' ? (frame%2?2:-2) : pose==='punch'?2:0;
  rect(bx+1-stride,ty+10,heavy?6:4,8-breath-crouch,dark);
  rect(bx+bw-5+stride,ty+10,heavy?6:4,8-breath-crouch,look.outfit);
  rect(bx-stride,42,heavy?7:5,3,look.boots);rect(bx+bw-5+stride,42,heavy?8:6,3,look.boots);
  rect(bx-stride,41,heavy?6:4,1,a);rect(bx+bw-5+stride,41,heavy?7:5,1,a);
  rect(bx+bw-3+stride,44,4,1,shade(look.boots,.4));
  rect(bx,ty,bw,12,look.outfit);rect(bx,ty,2,12,dark);rect(bx+bw-3,ty+2,2,7,light);
  line(bx+3,ty,bx+6,ty+4,a);line(bx+bw-2,ty,bx+6,ty+4,shade(a,.3));
  rect(bx,ty+10,bw,2,a);rect(bx+4,ty+12,2,3,shade(a,-.2));
  // Individual uniforms and insignias.
  if(profile.accessory==='armor') {
    rect(bx-2,ty-1,6,4,a);rect(bx+bw-3,ty-1,6,4,a);rect(bx+3,ty+3,bw-5,5,shade(a,-.2));
    for(let i=0;i<3;i++) rect(bx+3,ty+4+i*2,bw-5,1,light);
  } else if(profile.accessory==='beads') { for(let i=0;i<5;i++) rect(bx+i*2,ty+1+Math.min(i,4-i),2,2,'#d8a26a'); }
  else {rect(bx+bw-5,ty+5,3,3,a);put(bx+bw-4,ty+6,shade(a,.6));}
  // New head positions preserve each form's original hair and palette.
  const base=paintBase(look);
  for(let y=0;y<17;y++) for(let x=4;x<26;x++) if(base[y][x] && base[y][x]!==OUTLINE) put(x+headX,y+headY,base[y][x]);
  // Long hair has a silhouette behind the shoulder instead of being cut off at the neck.
  if(look.hairStyle==='long'||look.hairStyle==='braids'||look.hairStyle==='ponytail') {
    rect(headX+7,headY+14,3,12,shade(look.hair,-.2));rect(headX+8,headY+15,1,10,shade(look.hair,.2));
  }
  if(profile.accessory==='crown') {rect(headX+11,headY+6,11,2,a);[11,15,20].forEach(x=>rect(headX+x,headY+3,2,4,a));put(headX+16,headY+6,glow);}
  if(familyId==='kenji') {rect(headX+15,headY+14,6,2,'#eee6d9');rect(headX+17,headY+16,3,2,'#d4cbbd');}
  if(['varek','kael','ryuga'].includes(familyId)) line(headX+16,headY+10,headX+18,headY+11,shade(look.hair,-.3));
  if(['nyx','nyxara'].includes(familyId)) rect(headX+16,headY+11,6,1,glow);
  // Facial landmarks and headgear belong to the family, not just a palette swap.
  if(profile.accessory==='hat'||['kenji','lyra','tarka'].includes(familyId)) {
    const tall=familyId==='lyra';
    rect(headX+5,headY+5,23,3,a);
    for(let i=0;i<(tall?8:4);i++)rect(headX+9+i,headY+4-i,15-i*2,1,i%2?light:a);
  }
  if(profile.accessory==='antlers'||['orrin','grimm','eiren'].includes(familyId)) {
    line(headX+10,headY+7,headX+5,headY-3,a,2);line(headX+21,headY+7,headX+26,headY-3,a,2);
    line(headX+7,headY+1,headX+2,headY-1,a,2);line(headX+24,headY+1,headX+29,headY-1,a,2);
  }
  if(profile.accessory==='mask'||['nyx','bruno','quillon'].includes(familyId)) {
    rect(headX+14,headY+10,9,6,shade(a,-.35));rect(headX+15,headY+11,7,2,glow);rect(headX+18,headY+14,4,1,dark);
    if(familyId==='bruno'){rect(headX+9,headY+5,15,4,dark);rect(headX+9,headY+8,3,9,a);}
  }
  if(['sora','flint','kest'].includes(familyId)){rect(headX+14,headY+9,9,3,dark);rect(headX+15,headY+9,3,2,a);rect(headX+20,headY+9,3,2,a);}
  if(['jin','ruka','amaranth'].includes(familyId)){rect(headX+10,headY+8,13,2,a);line(headX+10,headY+9,headX+3-frame%2,headY+13,a,2);}
  if(['aya','namiya','briar'].includes(familyId)){rect(headX+8,headY+5,5,5,a);rect(headX+9,headY+4,3,7,a);put(headX+10,headY+7,'#fff3ba');}
  if(['kenji','orrin','bastion','cairn'].includes(familyId)){rect(headX+15,headY+14,7,3,look.hair);rect(headX+17,headY+17,4,3,shade(look.hair,.25));}
  if(['varek','helion'].includes(familyId)){line(headX+14,headY+8,headX+17,headY+10,a);line(headX+17,headY+10,headX+21,headY+7,a);}
  if(['kael','zeno','vesper'].includes(familyId)){rect(headX+8,headY+3,4,15,dark);rect(headX+10,headY+1,12,3,dark);rect(headX+8,headY+16,7,3,a);}
  if(frame===2 && pose==='idle' && !['mask'].includes(profile.accessory) && !['nyx','bruno','quillon','sora','flint','kest'].includes(familyId)) {rect(headX+16,headY+11,2,3,look.skin);rect(headX+19,headY+11,2,3,look.skin);rect(headX+16,headY+12,2,1,OUTLINE);rect(headX+19,headY+12,2,1,OUTLINE);}
  // Articulated arms: separate coordinates for anticipation, strike, recoil and celebration.
  const arm=(sx:number,sy:number,ex:number,ey:number,front:boolean) => {
    line(sx,sy,Math.round((sx+ex)/2),Math.round((sy+ey)/2),front?look.outfit:dark,3);
    line(Math.round((sx+ex)/2),Math.round((sy+ey)/2),ex,ey,front?look.skin:skinDark,3);
    rect(ex-1,ey,heavy?5:4,3,profile.accessory==='gauntlets'?a:front?look.skin:skinDark);
    rect(ex-1,ey-1,heavy?5:4,1,a);put(ex+1,ey,shade(look.skin,.35));
  };
  let back=[bx-2,ty+7], front=[bx+bw,ty+7];
  if(pose==='charge') {back=[bx+1,ty+5];front=[bx+bw-2,ty+5];}
  if(pose==='punch') {back=[bx-5,ty+5];front=[Math.min(43,bx+bw+8),ty+1];}
  if(pose==='hurt') {back=[bx-5,ty+2];front=[bx+bw+2,ty-1];}
  if(pose==='victory') {back=[bx-4,ty-7-frame%2];front=[bx+bw+2,ty-8+frame%2];}
  if(pose==='guard') {back=[bx+2,ty+2];front=[bx+bw-1,ty-1];}
  if(pose==='walk') {back=[bx-2,ty+6+stride];front=[bx+bw,ty+6-stride];}
  arm(bx-1,ty+1,back[0],back[1],false);arm(bx+bw-1,ty+1,front[0],front[1],true);
  if(pose==='punch' && profile.accessory==='blade') {line(front[0]-3,front[1]-7,front[0]+2,front[1]+7,'#e9f4ff',2);}
  if(pose==='hurt') {rect(headX+16,headY+11,2,3,look.skin);line(headX+16,headY+12,headX+20,headY+13,OUTLINE);}
  if(pose==='victory') {rect(headX+18,headY+14,3,2,'#fff4df');}
  // One crisp outline, no noisy checkerboard treatment.
  const outlined=art.map(row=>[...row]);
  for(let y=0;y<48;y++) for(let x=0;x<48;x++) if(!art[y][x]&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>art[y+dy]?.[x+dx])) outlined[y][x]=OUTLINE;
  return outlined;
}

const cache = new Map<string,string>();
function renderUrl(look:Look,familyId:string,pose:SpritePose,sheet:boolean):string {
  const key=JSON.stringify([look,familyId,pose,sheet]);const hit=cache.get(key);if(hit)return hit;
  const canvas=document.createElement('canvas');canvas.width=48*(sheet?4:1);canvas.height=48;
  const ctx=canvas.getContext('2d');if(!ctx)return '';
  for(let f=0;f<(sheet?4:1);f++) paintFighter(look,familyId,pose,f).forEach((row,y)=>row.forEach((c,x)=>{if(c){ctx.fillStyle=c;ctx.fillRect(x+48*f,y,1,1);}}));
  const url=canvas.toDataURL();cache.set(key,url);return url;
}
export function spriteUrl(look:Look,familyId='kairo',pose:SpritePose='idle'):string {return renderUrl(look,familyId,pose,false);}
export function spriteSheetUrl(look:Look,familyId:string,pose:SpritePose):string {return renderUrl(look,familyId,pose,true);}
