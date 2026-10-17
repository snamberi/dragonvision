import type { Family, Form, Look } from './types';

// Original Vision-universe fighters. Silhouettes and palettes are deliberately our own.

const SKIN = '#f2c29b';
const SKIN_TAN = '#d99a6c';
const INK = '#1b1530';

function form(name: string, look: Look): Form {
  return { name, look };
}

const kairoBase: Look = {
  skin: SKIN,
  hair: INK,
  hairStyle: 'spiky',
  outfit: '#d8432e',
  accent: '#2f5fd0',
  boots: '#2f5fd0',
};

const varekBase: Look = {
  skin: SKIN,
  hair: INK,
  hairStyle: 'flame',
  outfit: '#26306b',
  accent: '#e9e4d4',
  boots: '#e9e4d4',
};

export const FAMILIES: Family[] = [
  {
    id: 'kairo',
    name: 'Kairo',
    title: 'The Wandering Spark',
    base: { hp: 100, atk: 26, def: 22, spd: 24 },
    special: { name: 'Solar Wave', kind: 'beam', power: 2.8 },
    forms: [
      form('Kid Kairo', { ...kairoBase, small: true }),
      form('Teen Kairo', { ...kairoBase, outfit: '#e0602c' }),
      form('Kairo', kairoBase),
      form('Ember Kairo', { ...kairoBase, aura: '#ff4a3d' }),
      form('Radiant Kairo', { ...kairoBase, hair: '#ffd23f', hairStyle: 'spikyTall', aura: '#ffd23f' }),
      form('Radiant Kairo II', { ...kairoBase, hair: '#ffe066', hairStyle: 'spikyTall', aura: '#fff07a' }),
      form('Radiant Kairo III', { ...kairoBase, hair: '#ffd23f', hairStyle: 'long', aura: '#ffd23f' }),
      form('Solar Kairo', { ...kairoBase, hair: '#e8304a', aura: '#ff6a7a' }),
      form('Azure Kairo', { ...kairoBase, hair: '#3fc6ff', hairStyle: 'spikyTall', aura: '#3fc6ff' }),
      form('Zenith Kairo', { ...kairoBase, hair: '#d9e2f2', outfit: '#9a3b2c', aura: '#cfe3ff' }),
    ],
  },
  {
    id: 'varek',
    name: 'Varek',
    title: 'Exiled Prince',
    base: { hp: 95, atk: 28, def: 21, spd: 25 },
    special: { name: 'Royal Cannon', kind: 'beam', power: 2.9 },
    forms: [
      form('Varek', varekBase),
      form('Radiant Varek', { ...varekBase, hair: '#ffd23f', aura: '#ffd23f' }),
      form('Radiant Varek II', { ...varekBase, hair: '#ffe066', aura: '#fff07a' }),
      form('Azure Varek', { ...varekBase, hair: '#3fc6ff', aura: '#3fc6ff' }),
      form('Eclipse Varek', { ...varekBase, hair: '#8b5cf6', outfit: '#1a1840', aura: '#a78bfa' }),
    ],
  },
  {
    id: 'tobi',
    name: 'Tobi',
    title: 'Monk of the Cliff Temple',
    base: { hp: 90, atk: 22, def: 22, spd: 28 },
    special: { name: 'Spinning Disc', kind: 'wave', power: 1.3 },
    forms: [
      form('Tobi', {
        skin: SKIN,
        hair: SKIN,
        hairStyle: 'bald',
        outfit: '#2f9e57',
        accent: '#f2d04a',
        boots: '#5a3a22',
        small: true,
      }),
    ],
  },
  {
    id: 'orrin',
    name: 'Orrin',
    title: 'Horned Sage',
    base: { hp: 120, atk: 22, def: 28, spd: 18 },
    special: { name: 'Sage Light', kind: 'heal', power: 0.25 },
    forms: [
      form('Orrin', {
        skin: '#8fb3d9',
        hair: '#e9e4d4',
        hairStyle: 'horns',
        outfit: '#5b3fa8',
        accent: '#e9e4d4',
        boots: '#3b2a6b',
      }),
      form('Awakened Orrin', {
        skin: '#8fb3d9',
        hair: '#fff6c8',
        hairStyle: 'horns',
        outfit: '#3d2b7a',
        accent: '#ffd23f',
        boots: '#2a1d55',
        aura: '#c9b8ff',
      }),
    ],
  },
  {
    id: 'sora',
    name: 'Sora',
    title: 'Hidden Prodigy',
    base: { hp: 95, atk: 25, def: 22, spd: 25 },
    special: { name: 'Twin Comet', kind: 'beam', power: 2.7 },
    forms: [
      form('Kid Sora', {
        skin: SKIN,
        hair: INK,
        hairStyle: 'spiky',
        outfit: '#6b4fd0',
        accent: '#d8432e',
        boots: '#2a2240',
        small: true,
      }),
      form('Radiant Sora', {
        skin: SKIN,
        hair: '#ffd23f',
        hairStyle: 'spikyTall',
        outfit: '#6b4fd0',
        accent: '#d8432e',
        boots: '#2a2240',
        aura: '#ffd23f',
      }),
      form('Mystic Sora', {
        skin: SKIN,
        hair: INK,
        hairStyle: 'spiky',
        outfit: '#2b2d5c',
        accent: '#ffb02e',
        boots: '#ffb02e',
        aura: '#e9e4ff',
      }),
    ],
  },
  {
    id: 'mei',
    name: 'Mei',
    title: 'Storm Fist',
    base: { hp: 92, atk: 24, def: 21, spd: 30 },
    special: { name: 'Thunder Palm', kind: 'beam', power: 2.6 },
    forms: [
      form('Mei', {
        skin: SKIN_TAN,
        hair: '#3a1f12',
        hairStyle: 'braids',
        outfit: '#18a3a3',
        accent: '#f2d04a',
        boots: '#1b1530',
      }),
      form('Storm Mei', {
        skin: SKIN_TAN,
        hair: '#7fe7ff',
        hairStyle: 'braids',
        outfit: '#0f6f80',
        accent: '#f2d04a',
        boots: '#1b1530',
        aura: '#7fe7ff',
      }),
    ],
  },
  {
    id: 'vorg',
    name: 'Vorg',
    title: 'Tyrant of the Pale Stars',
    villain: true,
    base: { hp: 105, atk: 27, def: 24, spd: 23 },
    special: { name: 'Death Ray', kind: 'drain', power: 2.2 },
    forms: [
      form('Vorg', {
        skin: '#e8e6f2',
        hair: '#7a3fa8',
        hairStyle: 'crest',
        outfit: '#7a3fa8',
        accent: '#e8e6f2',
        boots: '#7a3fa8',
      }),
      form('Vorg Unbound', {
        skin: '#f4f2fb',
        hair: '#9b4fd6',
        hairStyle: 'crest',
        outfit: '#9b4fd6',
        accent: '#f4f2fb',
        boots: '#9b4fd6',
        aura: '#c58bff',
      }),
      form('Gilded Vorg', {
        skin: '#ffd23f',
        hair: '#7a3fa8',
        hairStyle: 'crest',
        outfit: '#ffd23f',
        accent: '#7a3fa8',
        boots: '#7a3fa8',
        aura: '#ffd23f',
      }),
    ],
  },
  {
    id: 'nyx',
    name: 'Nyx-9',
    title: 'Rogue Android',
    villain: true,
    base: { hp: 100, atk: 25, def: 26, spd: 22 },
    special: { name: 'Pulse Storm', kind: 'wave', power: 1.25 },
    forms: [
      form('Nyx-9', {
        skin: '#e9d6c4',
        hair: '#f2f2f2',
        hairStyle: 'visor',
        outfit: '#3a3f4b',
        accent: '#ff4a3d',
        boots: '#22252d',
      }),
    ],
  },
  {
    id: 'mogra',
    name: 'Mogra',
    title: 'Mountain Breaker',
    villain: true,
    base: { hp: 140, atk: 27, def: 20, spd: 14 },
    special: { name: 'Quake Slam', kind: 'wave', power: 1.35 },
    forms: [
      form('Mogra', {
        skin: '#c57a52',
        hair: '#2b1a12',
        hairStyle: 'mohawk',
        outfit: '#5a3a22',
        accent: '#c9a227',
        boots: '#2b1a12',
        large: true,
      }),
      form('Raging Mogra', {
        skin: '#d4583e',
        hair: '#ff4a3d',
        hairStyle: 'mohawk',
        outfit: '#4a2a18',
        accent: '#ffd23f',
        boots: '#2b1a12',
        large: true,
        aura: '#ff4a3d',
      }),
    ],
  },
];

export const STARTER_FAMILY_ID = 'kairo';

const byId = new Map(FAMILIES.map((f) => [f.id, f]));

export function getFamily(id: string): Family {
  const family = byId.get(id);
  if (!family) throw new Error(`Unknown family: ${id}`);
  return family;
}

/** Form shown at a star rating; families with fewer forms keep their last one. */
export function formForStar(family: Family, star: number): Form {
  return family.forms[Math.min(star, family.forms.length) - 1];
}
