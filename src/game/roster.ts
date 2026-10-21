import { NEW_NORMAL_FAMILIES, GOLDEN_FAMILIES } from './newFighters';
export { GOLDEN_FAMILIES } from './newFighters';
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
    tier: 'crystal',
    name: 'Kairo',
    title: 'The Wandering Spark',
    base: { hp: 100, atk: 26, def: 22, spd: 24 },
    special: { name: 'Solar Wave', kind: 'beam', power: 2.8, charge: 3 },
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
    tier: 'crystal',
    name: 'Varek',
    title: 'Exiled Prince',
    base: { hp: 95, atk: 28, def: 21, spd: 25 },
    special: { name: 'Royal Cannon', kind: 'beam', power: 2.9, charge: 3 },
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
    tier: 'common',
    name: 'Tobi',
    title: 'Monk of the Cliff Temple',
    base: { hp: 90, atk: 22, def: 22, spd: 28 },
    special: { name: 'Blinding Flash', kind: 'stun', power: 0.8, charge: 3 },
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
    tier: 'rare',
    name: 'Orrin',
    title: 'Horned Sage',
    base: { hp: 120, atk: 22, def: 28, spd: 18 },
    special: { name: 'Sage Light', kind: 'heal', power: 0.25, charge: 3 },
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
    tier: 'rare',
    name: 'Sora',
    title: 'Hidden Prodigy',
    base: { hp: 95, atk: 25, def: 22, spd: 25 },
    special: { name: 'Twin Comet', kind: 'beam', power: 2.7, charge: 3 },
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
    tier: 'common',
    name: 'Mei',
    title: 'Storm Fist',
    base: { hp: 92, atk: 24, def: 21, spd: 30 },
    special: { name: 'Thunder Palm', kind: 'beam', power: 2.2, charge: 2 },
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
    tier: 'epic',
    name: 'Vorg',
    title: 'Tyrant of the Pale Stars',
    villain: true,
    base: { hp: 105, atk: 27, def: 24, spd: 23 },
    special: { name: 'Death Ray', kind: 'drain', power: 2.2, charge: 3 },
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
    tier: 'common',
    name: 'Nyx-9',
    title: 'Rogue Android',
    villain: true,
    base: { hp: 100, atk: 25, def: 26, spd: 22 },
    special: { name: 'Pulse Storm', kind: 'wave', power: 1.25, charge: 4 },
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
    tier: 'common',
    name: 'Mogra',
    title: 'Mountain Breaker',
    villain: true,
    base: { hp: 140, atk: 27, def: 20, spd: 14 },
    special: { name: 'Quake Slam', kind: 'wave', power: 1.35, charge: 4 },
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
  {
    id: 'jin',
    tier: 'rare',
    name: 'Jin',
    title: 'Wandering Blade',
    base: { hp: 92, atk: 28, def: 20, spd: 27 },
    special: { name: 'Crescent Slash', kind: 'beam', power: 2.8, charge: 3 },
    forms: [
      form('Jin', { skin: SKIN, hair: INK, hairStyle: 'topknot', outfit: '#2f5fd0', accent: '#e9e4d4', boots: '#1b1530' }),
      form('Blade Jin', { skin: SKIN, hair: INK, hairStyle: 'topknot', outfit: '#1d3f9e', accent: '#ffd23f', boots: '#1b1530', aura: '#9ad4ff' }),
      form('Ascended Jin', { skin: SKIN, hair: '#e9e4d4', hairStyle: 'topknot', outfit: '#e9e4d4', accent: '#2f5fd0', boots: '#2f5fd0', aura: '#e9e4ff' }),
    ],
  },
  {
    id: 'aya',
    tier: 'common',
    name: 'Aya',
    title: 'Blossom Dancer',
    base: { hp: 88, atk: 24, def: 20, spd: 31 },
    special: { name: 'Petal Storm', kind: 'wave', power: 1.3, charge: 3 },
    forms: [
      form('Aya', { skin: SKIN, hair: '#e8578f', hairStyle: 'ponytail', outfit: '#f4ecd8', accent: '#e8578f', boots: '#7a2a4a' }),
      form('Bloom Aya', { skin: SKIN, hair: '#ff8fbf', hairStyle: 'ponytail', outfit: '#e8578f', accent: '#ffd23f', boots: '#7a2a4a', aura: '#ff8fbf' }),
    ],
  },
  {
    id: 'bruno',
    tier: 'common',
    name: 'Bruno',
    title: 'Iron Wall',
    base: { hp: 150, atk: 23, def: 30, spd: 13 },
    special: { name: 'Iron Bulwark', kind: 'shield', power: 0.25, charge: 3 },
    forms: [
      form('Bruno', { skin: SKIN_TAN, hair: SKIN_TAN, hairStyle: 'bald', outfit: '#6b6f7a', accent: '#d8432e', boots: '#2b2d33', large: true }),
      form('Iron Bruno', { skin: '#b9c2cf', hair: '#b9c2cf', hairStyle: 'bald', outfit: '#3a3f4b', accent: '#ffb02e', boots: '#22252d', large: true, aura: '#cfd8e6' }),
    ],
  },
  {
    id: 'kenji',
    tier: 'common',
    name: 'Kenji',
    title: 'Old Master of the Isle',
    base: { hp: 90, atk: 25, def: 24, spd: 22 },
    special: { name: "Master's Lesson", kind: 'rally', power: 0.3, charge: 4 },
    forms: [
      form('Master Kenji', { skin: SKIN, hair: '#f2f2f2', hairStyle: 'bob', outfit: '#e0a030', accent: '#7a3a1a', boots: '#5a3a22', small: true }),
      form('Max Power Kenji', { skin: SKIN, hair: '#f2f2f2', hairStyle: 'bob', outfit: '#e0a030', accent: '#7a3a1a', boots: '#5a3a22', large: true, aura: '#ffe066' }),
    ],
  },
  {
    id: 'lyra',
    tier: 'rare',
    name: 'Lyra',
    title: 'Star Ranger',
    base: { hp: 94, atk: 26, def: 21, spd: 26 },
    special: { name: 'Starfall', kind: 'wave', power: 1.25, charge: 4 },
    forms: [
      form('Lyra', { skin: SKIN, hair: '#3fc6ff', hairStyle: 'bob', outfit: '#1f2a5c', accent: '#ffd23f', boots: '#e9e4d4' }),
      form('Nova Lyra', { skin: SKIN, hair: '#9ae6ff', hairStyle: 'bob', outfit: '#16204a', accent: '#ffd23f', boots: '#e9e4d4', aura: '#9ae6ff' }),
      form('Supernova Lyra', { skin: SKIN, hair: '#fff07a', hairStyle: 'bob', outfit: '#16204a', accent: '#ff8a1f', boots: '#ff8a1f', aura: '#ffb02e' }),
    ],
  },
  {
    id: 'zeno',
    tier: 'rare',
    name: 'Zeno',
    title: 'Keeper of the Rift',
    base: { hp: 105, atk: 22, def: 26, spd: 26 },
    special: { name: 'Rift Rebirth', kind: 'revive', power: 0.4, charge: 4 },
    forms: [
      form('Zeno', { skin: '#a9b7e8', hair: '#e9e4ff', hairStyle: 'long', outfit: '#2b1f5c', accent: '#a78bfa', boots: '#1a1240' }),
      form('Unsealed Zeno', { skin: '#a9b7e8', hair: '#ffffff', hairStyle: 'long', outfit: '#1a1240', accent: '#ffd23f', boots: '#1a1240', aura: '#c9b8ff' }),
    ],
  },
  {
    id: 'grimm',
    tier: 'epic',
    name: 'Grimm',
    title: 'Demon King',
    villain: true,
    base: { hp: 115, atk: 28, def: 23, spd: 20 },
    special: { name: 'Soul Feast', kind: 'drain', power: 2.2, charge: 3 },
    forms: [
      form('Grimm', { skin: '#c23a3a', hair: '#1b1530', hairStyle: 'horns', outfit: '#1b1530', accent: '#ffd23f', boots: '#1b1530' }),
      form('Demon Lord Grimm', { skin: '#a81f2f', hair: '#2a0a12', hairStyle: 'horns', outfit: '#2a0a12', accent: '#ff4a3d', boots: '#2a0a12', aura: '#ff4a3d' }),
      form('True Grimm', { skin: '#5a0f1f', hair: '#ffd23f', hairStyle: 'horns', outfit: '#120b2e', accent: '#ffd23f', boots: '#120b2e', aura: '#b0203a', large: true }),
    ],
  },
  {
    id: 'sylas',
    name: 'Sylas',
    title: 'The Perfect Organism',
    villain: true,
    base: { hp: 108, atk: 26, def: 25, spd: 23 },
    special: { name: 'Absorb', kind: 'drain', power: 2.1, charge: 3 },
    forms: [
      form('Larval Sylas', { skin: '#6fa84a', hair: '#3d6b2a', hairStyle: 'crest', outfit: '#3d6b2a', accent: '#1b1530', boots: '#2a4a1d' }),
      form('Sylas', { skin: '#8fd16a', hair: '#2a4a1d', hairStyle: 'crest', outfit: '#2a4a1d', accent: '#e9e4d4', boots: '#1b1530' }),
      form('Perfect Sylas', { skin: '#c8f0a8', hair: '#5a2f8a', hairStyle: 'crest', outfit: '#1b1530', accent: '#8fd16a', boots: '#5a2f8a', aura: '#b6f28c' }),
    ],
  },
  {
    id: 'kael',
    name: 'Kael',
    title: 'The Corrupted Echo',
    villain: true,
    base: { hp: 98, atk: 29, def: 20, spd: 26 },
    special: { name: 'Void Cannon', kind: 'beam', power: 3.0, charge: 4 },
    forms: [
      form('Kael', { skin: '#c9b8b0', hair: '#3a1f5c', hairStyle: 'spiky', outfit: '#3a1f5c', accent: '#ff4a3d', boots: '#1b1530' }),
      form('Dark Kael', { skin: '#b0a0a8', hair: '#6b2fd0', hairStyle: 'spikyTall', outfit: '#1b1530', accent: '#ff4a3d', boots: '#1b1530', aura: '#8b5cf6' }),
      form('Void Kael', { skin: '#9a8a94', hair: '#ff2f4a', hairStyle: 'spikyTall', outfit: '#0a0618', accent: '#ff2f4a', boots: '#0a0618', aura: '#ff2f4a' }),
    ],
  },
  ...NEW_NORMAL_FAMILIES,
];

export const STARTER_FAMILY_ID = 'kairo';

/**
 * Fusion characters: made only by fusing two specific fighters in the Fusion Lab.
 * They are never summoned and never appear as random enemies.
 */
export const FUSIONS: Family[] = [
  {
    id: 'kavrek',
    name: 'Kavrek',
    title: 'Fusion of Spark and Prince',
    base: { hp: 125, atk: 34, def: 27, spd: 28 },
    special: { name: 'Final Vision Flash', kind: 'beam', power: 3.6, charge: 3 },
    forms: [
      form('Kavrek', { skin: SKIN, hair: INK, hairStyle: 'spikyTall', outfit: '#3a2f8f', accent: '#ff8a1f', boots: '#e9e4d4' }),
      form('Radiant Kavrek', { skin: SKIN, hair: '#ffd23f', hairStyle: 'spikyTall', outfit: '#3a2f8f', accent: '#ff8a1f', boots: '#e9e4d4', aura: '#ffd23f' }),
      form('Azure Kavrek', { skin: SKIN, hair: '#3fc6ff', hairStyle: 'spikyTall', outfit: '#1f2a6b', accent: '#ff8a1f', boots: '#e9e4d4', aura: '#7fe7ff' }),
    ],
  },
  {
    id: 'orzen',
    name: 'Orzen',
    title: 'Fusion of Sage and Keeper',
    base: { hp: 145, atk: 26, def: 33, spd: 26 },
    special: { name: 'Eternal Rite', kind: 'heal', power: 0.4, charge: 3 },
    forms: [
      form('Orzen', { skin: '#9fb0e6', hair: '#fff6c8', hairStyle: 'horns', outfit: '#2b1f5c', accent: '#ffd23f', boots: '#1a1240', aura: '#c9b8ff' }),
      form('Ascended Orzen', { skin: '#b8c6f2', hair: '#ffffff', hairStyle: 'horns', outfit: '#1a1240', accent: '#ffd23f', boots: '#1a1240', aura: '#ffffff' }),
    ],
  },
  {
    id: 'grylas',
    name: 'Grylas',
    title: 'Fusion of Demon and Organism',
    villain: true,
    base: { hp: 155, atk: 33, def: 29, spd: 24 },
    special: { name: 'Endless Feast', kind: 'drain', power: 3.0, charge: 3 },
    forms: [
      form('Grylas', { skin: '#7a3a4a', hair: '#2a4a1d', hairStyle: 'crest', outfit: '#1b1530', accent: '#8fd16a', boots: '#2a0a12', aura: '#b6f28c' }),
      form('Perfect Grylas', { skin: '#5a1f3a', hair: '#ffd23f', hairStyle: 'crest', outfit: '#0a0618', accent: '#ff4a3d', boots: '#2a0a12', aura: '#ff4a3d', large: true }),
    ],
  },
];

/**
 * Legendary fighters: never summoned. Ten pieces of one make the fighter at 5★; pieces drop rarely from
 * summons, from stage bosses, and the Shop sells one at a time.
 */
function legend(f: Omit<Family, 'legendary' | 'firstStar'>): Family {
  return { ...f, legendary: true, firstStar: 5 };
}

const ryugaBase: Look = { skin: SKIN, hair: '#1b1530', hairStyle: 'spikyTall', outfit: '#8a1020', accent: '#ffd23f', boots: '#1b1530', aura: '#ff8a1f' };
const seraBase: Look = { skin: SKIN, hair: '#fff6c8', hairStyle: 'long', outfit: '#f4ecd8', accent: '#ffd23f', boots: '#d9c48a', aura: '#fff6c8' };
const tharokBase: Look = { skin: SKIN_TAN, hair: '#5a3a22', hairStyle: 'topknot', outfit: '#6b4a2a', accent: '#c9d2e0', boots: '#3a2a1a', large: true };
const nyxBase: Look = { skin: '#c9b8e8', hair: '#1a1240', hairStyle: 'ponytail', outfit: '#1a1240', accent: '#b794ff', boots: '#0a0618', aura: '#8b5cf6' };
const volkanBase: Look = { skin: '#7a3a2a', hair: '#ff4a3d', hairStyle: 'flame', outfit: '#2a1410', accent: '#ff8a1f', boots: '#1b0a06', aura: '#ff4a3d' };
const aurelBase: Look = { skin: SKIN, hair: '#e9e4d4', hairStyle: 'bald', outfit: '#d8a21f', accent: '#ffffff', boots: '#8a5a1a', aura: '#ffd23f' };
const zephBase: Look = { skin: SKIN, hair: '#7fe7ff', hairStyle: 'braids', outfit: '#1f4a6b', accent: '#e9fbff', boots: '#e9fbff', aura: '#7fe7ff' };
const morvainBase: Look = { skin: '#8a8fa8', hair: '#d9e2f2', hairStyle: 'horns', outfit: '#0a0618', accent: '#ff4a3d', boots: '#2a0a12', aura: '#ff4a3d' };
const solBase: Look = { skin: SKIN_TAN, hair: '#ffb35a', hairStyle: 'mohawk', outfit: '#f4ecd8', accent: '#ff8a1f', boots: '#8a3a0a', aura: '#ffe066' };
const gorvathBase: Look = { skin: '#5a6b4a', hair: '#2a2a2a', hairStyle: 'crest', outfit: '#3a3a3a', accent: '#8fd16a', boots: '#1b1b1b', large: true };

export const LEGENDARIES: Family[] = [
  legend({
    id: 'ryuga',
    name: 'Ryuga',
    title: 'The Dragon Emperor',
    base: { hp: 115, atk: 36, def: 26, spd: 30 },
    special: { name: 'Emperor Dragon Fist', kind: 'beam', power: 3.8, charge: 3 },
    forms: [
      form('Ryuga', ryugaBase),
      form('Crimson Ryuga', { ...ryugaBase, hair: '#d8432e', aura: '#ff4a3d' }),
      form('Dragon King Ryuga', { ...ryugaBase, hair: '#ffd23f', hairStyle: 'long', aura: '#ffd23f' }),
      form('Celestial Dragon Ryuga', { ...ryugaBase, hair: '#ffffff', hairStyle: 'long', outfit: '#1a1240', aura: '#fff07a' }),
    ],
  }),
  legend({
    id: 'solenne',
    name: 'Solenne',
    title: 'Blade of the Rising Sun',
    base: { hp: 105, atk: 38, def: 24, spd: 32 },
    special: { name: 'Supernova Edge', kind: 'beam', power: 3.9, charge: 3 },
    forms: [
      form('Solenne', solBase),
      form('Dawn Solenne', { ...solBase, hair: '#ffd23f', aura: '#ffd23f' }),
      form('Zenith Solenne', { ...solBase, hair: '#fff6c8', outfit: '#ff8a1f', aura: '#fff6c8' }),
      form('Supernova Solenne', { ...solBase, hair: '#ffffff', outfit: '#d8432e', accent: '#ffd23f', aura: '#ffffff' }),
    ],
  }),
  legend({
    id: 'seraphine',
    name: 'Seraphine',
    title: 'Light of the Heavens',
    base: { hp: 112, atk: 26, def: 30, spd: 30 },
    special: { name: 'Celestial Rebirth', kind: 'revive', power: 0.6, charge: 3 },
    forms: [
      form('Seraphine', seraBase),
      form('Haloed Seraphine', { ...seraBase, aura: '#ffd23f' }),
      form('Archangel Seraphine', { ...seraBase, outfit: '#ffffff', hair: '#ffd23f', aura: '#ffe066' }),
      form('Divine Seraphine', { ...seraBase, outfit: '#ffffff', hair: '#ffffff', accent: '#7fe7ff', aura: '#ffffff' }),
    ],
  }),
  legend({
    id: 'aurel',
    name: 'Aurel',
    title: 'The Golden Sage',
    base: { hp: 118, atk: 27, def: 31, spd: 28 },
    special: { name: 'Golden Hymn', kind: 'rally', power: 0.45, charge: 3 },
    forms: [
      form('Aurel', aurelBase),
      form('Gilded Aurel', { ...aurelBase, outfit: '#ffd23f' }),
      form('Radiant Aurel', { ...aurelBase, outfit: '#ffd23f', accent: '#ff8a1f', aura: '#fff07a' }),
      form('Eternal Aurel', { ...aurelBase, outfit: '#ffffff', accent: '#ffd23f', aura: '#ffffff' }),
    ],
  }),
  legend({
    id: 'tharok',
    name: 'Tharok',
    title: 'The Mountain King',
    base: { hp: 170, atk: 28, def: 38, spd: 22 },
    special: { name: 'Titan Bulwark', kind: 'shield', power: 0.4, charge: 3 },
    forms: [
      form('Tharok', tharokBase),
      form('Stoneborn Tharok', { ...tharokBase, outfit: '#5a5a6b', accent: '#ffd23f' }),
      form('Mountain King Tharok', { ...tharokBase, outfit: '#3a3a4a', accent: '#ffd23f', aura: '#c9d2e0' }),
      form('Worldpillar Tharok', { ...tharokBase, hair: '#ffffff', outfit: '#2a2a3a', accent: '#7fe7ff', aura: '#7fe7ff' }),
    ],
  }),
  legend({
    id: 'gorvath',
    name: 'Gorvath',
    title: 'The Ancient Destroyer',
    villain: true,
    base: { hp: 160, atk: 32, def: 34, spd: 23 },
    special: { name: 'World Breaker', kind: 'stun', power: 1.2, charge: 3 },
    forms: [
      form('Gorvath', gorvathBase),
      form('Awakened Gorvath', { ...gorvathBase, aura: '#8fd16a' }),
      form('Primordial Gorvath', { ...gorvathBase, skin: '#3a4a2a', accent: '#ff4a3d', aura: '#ff4a3d' }),
      form('Worldender Gorvath', { ...gorvathBase, skin: '#2a2a2a', hair: '#ff4a3d', accent: '#ffd23f', aura: '#ffd23f' }),
    ],
  }),
  legend({
    id: 'nyxara',
    name: 'Nyxara',
    title: 'Queen of the Endless Night',
    villain: true,
    base: { hp: 120, atk: 33, def: 27, spd: 31 },
    special: { name: 'Night Devourer', kind: 'drain', power: 3.3, charge: 3 },
    forms: [
      form('Nyxara', nyxBase),
      form('Moonlit Nyxara', { ...nyxBase, hair: '#d9e2f2', aura: '#c9b8ff' }),
      form('Eclipse Nyxara', { ...nyxBase, outfit: '#0a0618', accent: '#ff4a3d', aura: '#ff4a3d' }),
      form('Endless Night Nyxara', { ...nyxBase, hair: '#0a0618', outfit: '#0a0618', accent: '#ffd23f', aura: '#b794ff' }),
    ],
  }),
  legend({
    id: 'morvain',
    name: 'Morvain',
    title: 'The Fallen God',
    villain: true,
    base: { hp: 125, atk: 34, def: 28, spd: 27 },
    special: { name: 'Godfall', kind: 'drain', power: 3.4, charge: 3 },
    forms: [
      form('Morvain', morvainBase),
      form('Risen Morvain', { ...morvainBase, aura: '#b794ff' }),
      form('Godslayer Morvain', { ...morvainBase, outfit: '#2a0a12', hair: '#ff4a3d', aura: '#ff4a3d' }),
      form('Fallen God Morvain', { ...morvainBase, skin: '#5a5f78', hair: '#ffd23f', accent: '#ffd23f', aura: '#ffd23f', large: true }),
    ],
  }),
  legend({
    id: 'volkan',
    name: 'Volkan',
    title: 'The Living Volcano',
    base: { hp: 115, atk: 37, def: 25, spd: 27 },
    special: { name: 'Magma Cataclysm', kind: 'wave', power: 1.9, charge: 3 },
    forms: [
      form('Volkan', volkanBase),
      form('Molten Volkan', { ...volkanBase, hair: '#ff8a1f', aura: '#ff8a1f' }),
      form('Eruption Volkan', { ...volkanBase, hair: '#ffd23f', accent: '#ffd23f', aura: '#ffd23f' }),
      form('Core Volkan', { ...volkanBase, skin: '#3a1410', hair: '#ffffff', aura: '#fff07a', large: true }),
    ],
  }),
  legend({
    id: 'zephyra',
    name: 'Zephyra',
    title: 'The Storm Empress',
    base: { hp: 110, atk: 35, def: 26, spd: 34 },
    special: { name: 'Tempest Crown', kind: 'wave', power: 1.8, charge: 3 },
    forms: [
      form('Zephyra', zephBase),
      form('Gale Zephyra', { ...zephBase, outfit: '#2f5fd0' }),
      form('Thunder Zephyra', { ...zephBase, hair: '#ffe066', accent: '#ffe066', aura: '#ffe066' }),
      form('Storm Empress Zephyra', { ...zephBase, hair: '#ffffff', outfit: '#1a1240', aura: '#ffffff' }),
    ],
  }),
];

export interface FusionRecipe {
  result: string;
  parts: [string, string];
  /** Both parts must have at least this many stars. */
  minStar: number;
}

export const FUSION_RECIPES: FusionRecipe[] = [
  { result: 'kavrek', parts: ['kairo', 'varek'], minStar: 6 },
  { result: 'orzen', parts: ['orrin', 'zeno'], minStar: 6 },
  { result: 'grylas', parts: ['grimm', 'sylas'], minStar: 6 },
];

const byId = new Map([...FAMILIES, ...GOLDEN_FAMILIES, ...FUSIONS, ...LEGENDARIES].map((f) => [f.id, f]));

export function getFamily(id: string): Family {
  const family = byId.get(id);
  if (!family) throw new Error(`Unknown family: ${id}`);
  return family;
}

/** Form shown at a star rating; families with fewer forms keep their last one. */
export function formForStar(family: Family, star: number): Form {
  const index = star - (family.firstStar ?? 1);
  return family.forms[Math.max(0, Math.min(index, family.forms.length - 1))];
}

export type Role = 'Tank' | 'Assassin' | 'Blaster' | 'Support' | 'Drainer';

/** Battle role shown on cards and in the team arena, derived from stats and special. */
export function roleFor(family: Family): Role {
  const kind = family.special.kind;
  if (kind === 'heal' || kind === 'revive' || kind === 'rally') return 'Support';
  if (family.special.kind === 'drain') return 'Drainer';
  if (family.base.hp >= 120) return 'Tank';
  if (family.special.kind === 'wave') return 'Blaster';
  return 'Assassin';
}

/**
 * Class loop: each class beats the next one.
 * Assassin → Blaster → Tank → Drainer → Support → Assassin
 * (assassins dive squishy casters, blasts melt armor, armor starves drains,
 * drains outlast healing, healing outlasts burst).
 */
export const BEATS: Record<Role, Role> = {
  Assassin: 'Blaster',
  Blaster: 'Tank',
  Tank: 'Drainer',
  Drainer: 'Support',
  Support: 'Assassin',
};

/** 1 = neutral, >1 attacker has the edge, <1 defender has the edge. */
export function classEdge(attacker: Role, defender: Role): 'strong' | 'weak' | 'neutral' {
  if (BEATS[attacker] === defender) return 'strong';
  if (BEATS[defender] === attacker) return 'weak';
  return 'neutral';
}

export interface Combo {
  name: string;
  parts: [string, string];
  kind: 'beam' | 'wave' | 'heal' | 'drain';
  /** Damage multiplier, or share of max HP for heals. */
  power: number;
}

/** Pairs that unlock a shared attack when both are on the team with full special bars. */
export const COMBOS: Combo[] = [
  { name: 'Rival Cannon', parts: ['kairo', 'varek'], kind: 'beam', power: 4.5 },
  { name: 'Family Comet', parts: ['kairo', 'sora'], kind: 'wave', power: 2.2 },
  { name: 'Sacred Restoration', parts: ['orrin', 'zeno'], kind: 'heal', power: 0.45 },
  { name: 'Storm Blade', parts: ['mei', 'jin'], kind: 'beam', power: 4.2 },
  { name: 'Earthshaker', parts: ['bruno', 'mogra'], kind: 'wave', power: 2.0 },
  { name: 'Master and Student', parts: ['tobi', 'kenji'], kind: 'wave', power: 2.0 },
  { name: 'Starlight Blossom', parts: ['lyra', 'aya'], kind: 'wave', power: 2.2 },
  { name: 'Devour', parts: ['grimm', 'sylas'], kind: 'drain', power: 3.5 },
  { name: 'Void Tyranny', parts: ['vorg', 'kael'], kind: 'beam', power: 4.6 },
];

export function combosWith(familyId: string): Combo[] {
  return COMBOS.filter((c) => c.parts.includes(familyId));
}
