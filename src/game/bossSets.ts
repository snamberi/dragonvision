import type { Bonus } from './bonus';
import type { GearKind, GearTemplate, Rarity } from './gear';

/** A 4-piece boss set effect; battle.ts reads these numbers. */
export type GearEffect =
  | 'recharge'
  | 'hellfire'
  | 'overflow'
  | 'chain'
  | 'execute'
  | 'reflect'
  | 'ascend'
  | 'scorch'
  | 'aegis'
  | 'frost'
  | 'surge';

export const GEAR_EFFECTS: Record<GearEffect, { name: string; text: string }> = {
  recharge: { name: 'Recharge', text: 'First KO each battle refills the special bar' },
  hellfire: { name: 'Hellfire', text: 'Attacks and Ki Blasts burn the target for 2 turns' },
  overflow: { name: 'Blood Crown', text: 'Overhealing from this fighter becomes a shield' },
  chain: { name: 'Riptide', text: 'Single-target specials chain to a second foe at 50% power' },
  execute: { name: 'Reaper', text: '+40% damage to foes under 30% HP' },
  reflect: { name: 'Mirror Guard', text: 'While guarding, reflects 30% of damage taken' },
  ascend: { name: 'Ascendant', text: '+6% ATK after each action, up to +30%' },
  scorch: { name: 'Magma Core', text: 'Specials and combos burn every foe they hit' },
  aegis: { name: 'Colossus Aura', text: 'Allies take 10% less damage while this fighter stands' },
  frost: { name: 'Frostbite', text: 'Attacks and Ki Blasts have a 15% chance to stun a non-boss foe' },
  surge: { name: 'Static Surge', text: 'Attacks and Ki Blasts fill 2 special steps instead of 1' },
};

/** Effect strengths, kept in one place so balance passes don't hunt through battle code. */
export const EFFECT_NUMBERS = {
  burnShareOfAtk: 0.2,
  burnTurns: 2,
  chainPower: 0.5,
  executeBelow: 0.3,
  executeBonus: 0.4,
  reflectShare: 0.3,
  ascendPerAction: 0.06,
  ascendMaxStacks: 5,
  aegisReduction: 0.1,
  frostChance: 0.15,
  surgeSteps: 1,
};

export type SetSource = { kind: 'wall'; stage: number } | { kind: 'raid'; boss: string };

export interface BossSetDef {
  id: string;
  name: string;
  color: string;
  source: SetSource;
  two: Partial<Bonus>;
  effect: GearEffect;
  /** Lowest rarity a drop can have. */
  floor: Rarity;
  /** Existing set whose pixel art the pieces borrow. */
  art: 'ember' | 'bulwark' | 'tempest' | 'sage' | 'void';
  pieces: [string, string, string, string];
  /** Stats of the two accessories at Common. */
  acc: [Partial<Bonus>, Partial<Bonus>];
}

export const BOSS_SETS: BossSetDef[] = [
  {
    id: 'foundry', name: 'Foundry Core', color: '#c9d1e0', source: { kind: 'wall', stage: 50 }, two: { def: 0.12 }, effect: 'recharge',
    floor: 'rare', art: 'bulwark', pieces: ['Piston Fist', 'Foundry Plating', 'Gear Ring', 'Core Battery'],
    acc: [{ def: 0.05 }, { ki: 6 }],
  },
  {
    id: 'demongate', name: 'Demon Gate', color: '#ff5a3d', source: { kind: 'wall', stage: 100 }, two: { atk: 0.1 }, effect: 'hellfire',
    floor: 'rare', art: 'ember', pieces: ['Hellgate Cleaver', 'Brimstone Gi', 'Demon Horn', 'Cinder Seal'],
    acc: [{ atk: 0.04 }, { crit: 0.03 }],
  },
  {
    id: 'crimson', name: 'Crimson Crown', color: '#e0315a', source: { kind: 'wall', stage: 180 }, two: { hp: 0.12 }, effect: 'overflow',
    floor: 'epic', art: 'sage', pieces: ['Throne Scepter', 'Royal Bloodmail', 'Crimson Circlet', 'Ruby Chalice'],
    acc: [{ heal: 0.06 }, { hp: 0.05 }],
  },
  {
    id: 'riptide', name: 'Riptide', color: '#2fb7d6', source: { kind: 'wall', stage: 230 }, two: { specialPower: 0.15 }, effect: 'chain',
    floor: 'epic', art: 'tempest', pieces: ['Tidecaller Trident', 'Void Shore Mantle', 'Undertow Pearl', 'Riptide Anklet'],
    acc: [{ specialPower: 0.05 }, { spd: 2 }],
  },
  {
    id: 'grimharvest', name: 'Grim Harvest', color: '#7d8a5a', source: { kind: 'wall', stage: 280 }, two: { crit: 0.08 }, effect: 'execute',
    floor: 'epic', art: 'void', pieces: ['Harvest Scythe', 'Gravecloth', 'Reaper Lantern', 'Bone Talisman'],
    acc: [{ crit: 0.03 }, { atk: 0.04 }],
  },
  {
    id: 'eclipse', name: 'Eclipse Mirror', color: '#9b8cff', source: { kind: 'wall', stage: 330 }, two: { def: 0.15 }, effect: 'reflect',
    floor: 'legendary', art: 'bulwark', pieces: ['Umbra Aegis', 'Eclipse Plate', 'Corona Ring', 'Mirror Shard'],
    acc: [{ def: 0.05 }, { hp: 0.05 }],
  },
  {
    id: 'gatebreaker', name: 'Gatebreaker', color: '#ffd23f', source: { kind: 'wall', stage: 380 }, two: { atk: 0.1, hp: 0.1 }, effect: 'ascend',
    floor: 'legendary', art: 'ember', pieces: ['Vision Breaker', 'Gatewarden Armor', 'Ascendant Halo', 'Key of Echoes'],
    acc: [{ atk: 0.04 }, { crit: 0.03 }],
  },
  {
    id: 'magma', name: "Titan's Magma", color: '#ff8a1f', source: { kind: 'raid', boss: 'Inferno Titan' }, two: { atk: 0.1 }, effect: 'scorch',
    floor: 'epic', art: 'ember', pieces: ['Magma Maul', 'Titan Slag Armor', 'Lava Heart', 'Ember Core'],
    acc: [{ specialPower: 0.05 }, { atk: 0.04 }],
  },
  {
    id: 'colossus', name: 'Colossus Aegis', color: '#6d5cff', source: { kind: 'raid', boss: 'Void Colossus' }, two: { hp: 0.15 }, effect: 'aegis',
    floor: 'epic', art: 'void', pieces: ['Colossus Bulwark', 'Void Bastion', 'Gravity Stone', 'Event Horizon'],
    acc: [{ hp: 0.05 }, { def: 0.05 }],
  },
  {
    id: 'warden', name: "Warden's Frost", color: '#9fe8ff', source: { kind: 'raid', boss: 'Glacial Warden' }, two: { def: 0.12 }, effect: 'frost',
    floor: 'epic', art: 'tempest', pieces: ['Glacier Spear', 'Permafrost Coat', 'Rime Crystal', 'Frozen Bell'],
    acc: [{ def: 0.05 }, { crit: 0.03 }],
  },
  {
    id: 'sovereign', name: "Sovereign's Storm", color: '#fff27a', source: { kind: 'raid', boss: 'Storm Sovereign' }, two: { spd: 6 }, effect: 'surge',
    floor: 'epic', art: 'tempest', pieces: ['Thunder Scepter', 'Stormlord Cape', 'Static Coil', 'Sovereign Crown'],
    acc: [{ spd: 2 }, { ki: 6 }],
  },
];

const KINDS: GearKind[] = ['weapon', 'armor', 'accessory', 'accessory'];
const ART_SLOT: Record<BossSetDef['art'], [string, string, string, string]> = {
  ember: ['ember-blade', 'ember-gi', 'ember-band', 'ember-charm'],
  bulwark: ['bulwark-hammer', 'bulwark-plate', 'bulwark-ring', 'bulwark-seal'],
  tempest: ['tempest-staff', 'tempest-cloak', 'tempest-boots', 'tempest-earring'],
  sage: ['sage-rod', 'sage-robe', 'sage-beads', 'sage-lotus'],
  void: ['void-edge', 'void-mantle', 'void-eye', 'void-fang'],
};
/** Boss weapons and armor beat the best Armory pieces (0.06 ATK / 0.06 HP at Common). */
const BOSS_WEAPON: Partial<Bonus> = { atk: 0.08 };
const BOSS_ARMOR: Partial<Bonus> = { hp: 0.07, def: 0.02, shield: 0.01 };

export const BOSS_TEMPLATES: (GearTemplate & { art: string })[] = BOSS_SETS.flatMap((set) =>
  set.pieces.map((name, i) => ({
    id: `${set.id}-${i}`,
    name,
    kind: KINDS[i],
    setId: set.id,
    base: [BOSS_WEAPON, BOSS_ARMOR, set.acc[0], set.acc[1]][i],
    art: ART_SLOT[set.art][i],
  })),
);

export function wallSetFor(stage: number): BossSetDef | undefined {
  return BOSS_SETS.find((s) => s.source.kind === 'wall' && s.source.stage === stage);
}

export function raidSetFor(bossName: string): BossSetDef | undefined {
  return BOSS_SETS.find((s) => s.source.kind === 'raid' && s.source.boss === bossName);
}

export function isBossSet(setId: string): boolean {
  return BOSS_SETS.some((s) => s.id === setId);
}
