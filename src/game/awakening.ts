import { type Bonus, addBonus, emptyBonus } from './bonus';
import { findUnit } from './progression';
import type { SaveData, Unit } from './types';

/** Awakening points start at 9★: one per star, so a 21★ fighter has 13. */
export const AWAKEN_FROM_STAR = 9;
export const RESPEC_GEMS = 5;
const TIER_COST = [1, 2, 3];

export interface AwakenNode {
  id: string;
  name: string;
  /** 1–3; tier 2 needs a tier-1 node, tier 3 needs a tier-2 node. */
  tier: 1 | 2 | 3;
  effect: Partial<Bonus>;
}

type Tree = [string, Partial<Bonus>][];

// Six nodes per character: two per tier, in tier order. Every tree is its own.
const TREES: Record<string, Tree> = {
  kairo: [
    ['Spark Training', { atk: 0.06 }],
    ['Hungry Spirit', { hp: 0.08 }],
    ['Ember Focus', { specialPower: 0.15 }],
    ['Never Give Up', { lastStand: 0.25 }],
    ['Zenith Surge', { chargeDiscount: 1 }],
    ['Rise Again', { secondWind: 0.25 }],
  ],
  varek: [
    ['Royal Pride', { atk: 0.08 }],
    ["Prince's Guard", { def: 0.08 }],
    ['Cannon Mastery', { specialPower: 0.2 }],
    ["Rival's Fire", { firstStrike: 0.3 }],
    ['Eclipse Will', { crit: 0.15 }],
    ['Overcharge', { charge: 2 }],
  ],
  tobi: [
    ['Light Feet', { spd: 3 }],
    ['Monk Breathing', { ki: 20 }],
    ['Flash Focus', { chargeDiscount: 1 }],
    ['Cliff Discipline', { def: 0.12 }],
    ['Thousand Palms', { crit: 0.15 }],
    ['Brave Heart', { secondWind: 0.2 }],
  ],
  orrin: [
    ['Horn Wisdom', { heal: 0.12 }],
    ['Stone Skin', { hp: 0.1 }],
    ['Deep Meditation', { ki: 25 }],
    ['Sage Ward', { shield: 0.08 }],
    ['Light of Ages', { heal: 0.25 }],
    ['Quick Prayer', { chargeDiscount: 1 }],
  ],
  sora: [
    ['Hidden Talent', { atk: 0.07 }],
    ['Young Fury', { lastStand: 0.3 }],
    ['Twin Comet Mastery', { specialPower: 0.2 }],
    ['Mystic Insight', { crit: 0.08 }],
    ['Awakened Potential', { atk: 0.12, hp: 0.08 }],
    ['Prodigy Burst', { charge: 2 }],
  ],
  mei: [
    ['Storm Step', { spd: 4 }],
    ['Static Palm', { crit: 0.06 }],
    ['Thunder Rhythm', { firstStrike: 0.35 }],
    ['Lightning Reflex', { def: 0.1 }],
    ['Eye of the Storm', { crit: 0.12, specialPower: 0.1 }],
    ['Endless Storm', { charge: 1, ki: 20 }],
  ],
  vorg: [
    ['Cold Tyranny', { atk: 0.07 }],
    ['Pale Armor', { def: 0.1 }],
    ['Death Ray Mastery', { specialPower: 0.18 }],
    ['Hunger', { drain: 0.2 }],
    ['Gilded Form', { hp: 0.15, def: 0.1 }],
    ['Final Form', { secondWind: 0.3 }],
  ],
  nyx: [
    ['Reinforced Frame', { hp: 0.1 }],
    ['Targeting Chip', { crit: 0.06 }],
    ['Infinite Core', { ki: 30 }],
    ['Pulse Amplifier', { specialPower: 0.18 }],
    ['Barrier Protocol', { shield: 0.15 }],
    ['Overclock', { chargeDiscount: 1 }],
  ],
  mogra: [
    ['Mountain Hide', { hp: 0.12 }],
    ['Boulder Fists', { atk: 0.06 }],
    ['Earthquake', { specialPower: 0.2 }],
    ['Rage', { lastStand: 0.35 }],
    ['Unbreakable', { def: 0.18, shield: 0.1 }],
    ['Berserk Return', { secondWind: 0.3 }],
  ],
  jin: [
    ['Sharp Edge', { crit: 0.06 }],
    ['Swift Draw', { spd: 3 }],
    ['First Cut', { firstStrike: 0.4 }],
    ['Crescent Mastery', { specialPower: 0.18 }],
    ['Ascended Blade', { crit: 0.12, atk: 0.06 }],
    ['Iaido', { chargeDiscount: 1 }],
  ],
  aya: [
    ['Petal Step', { spd: 4 }],
    ['Blossom Grace', { hp: 0.08 }],
    ['Petal Storm Mastery', { specialPower: 0.18 }],
    ['Thorned Bloom', { edge: 0.15 }],
    ['Full Bloom', { charge: 2 }],
    ['Dance of Petals', { crit: 0.12, spd: 3 }],
  ],
  bruno: [
    ['Iron Hide', { def: 0.12 }],
    ['Big Frame', { hp: 0.12 }],
    ['Bulwark Mastery', { shield: 0.1 }],
    ['Stubborn', { lastStand: 0.2 }],
    ['Iron Will', { secondWind: 0.35 }],
    ['Fortress', { hp: 0.15, def: 0.12 }],
  ],
  kenji: [
    ['Old Tricks', { ki: 20 }],
    ['Hermit Health', { hp: 0.08 }],
    ['Lesson Plan', { chargeDiscount: 1 }],
    ['Turtle Shell', { shield: 0.1 }],
    ['Max Power', { atk: 0.15, specialPower: 0.1 }],
    ['Second Youth', { secondWind: 0.25 }],
  ],
  lyra: [
    ['Star Map', { crit: 0.06 }],
    ['Ranger Boots', { spd: 3 }],
    ['Starfall Mastery', { specialPower: 0.2 }],
    ['Nova Core', { ki: 25 }],
    ['Supernova', { charge: 2 }],
    ['Constellation', { edge: 0.2, atk: 0.06 }],
  ],
  zeno: [
    ['Rift Sight', { hp: 0.1 }],
    ['Rift Mend', { heal: 0.15 }],
    ['Unseal', { ki: 30 }],
    ['Veil', { shield: 0.12 }],
    ['Quick Rebirth', { chargeDiscount: 2 }],
    ['Undying Keeper', { secondWind: 0.35 }],
  ],
  grimm: [
    ['Demon Blood', { hp: 0.1 }],
    ['Hellfire', { atk: 0.07 }],
    ['Soul Hunger', { drain: 0.25 }],
    ["Lord's Wrath", { specialPower: 0.18 }],
    ['True Demon', { lastStand: 0.4, atk: 0.08 }],
    ['Undying King', { secondWind: 0.3 }],
  ],
  sylas: [
    ['Regeneration', { hp: 0.12 }],
    ['Absorb Cells', { drain: 0.15 }],
    ['Adaptive Armor', { def: 0.12 }],
    ['Perfect Form', { specialPower: 0.15 }],
    ['Perfect Being', { atk: 0.1, hp: 0.1, def: 0.05 }],
    ['Cell Rebirth', { secondWind: 0.4 }],
  ],
  kavrek: [
    ['Twin Souls', { atk: 0.1 }],
    ['Royal Spark', { crit: 0.08 }],
    ['Vision Flash Mastery', { specialPower: 0.25 }],
    ['Rivalry', { firstStrike: 0.4 }],
    ['Perfect Fusion', { atk: 0.12, hp: 0.12 }],
    ['Beyond the Gate', { chargeDiscount: 1, charge: 1 }],
  ],
  orzen: [
    ['Ancient Bond', { heal: 0.15 }],
    ['Rift Horns', { hp: 0.12 }],
    ['Eternal Ward', { shield: 0.12 }],
    ['Endless Prayer', { ki: 30 }],
    ['Rite of Ages', { heal: 0.3 }],
    ['Never Fades', { secondWind: 0.4 }],
  ],
  grylas: [
    ['Hive Blood', { hp: 0.12 }],
    ['Twin Hunger', { drain: 0.2 }],
    ['Feast Mastery', { specialPower: 0.2 }],
    ['Demon Carapace', { def: 0.14 }],
    ['Perfect Demon', { atk: 0.12, lastStand: 0.3 }],
    ['Infinite Feast', { drain: 0.3, secondWind: 0.25 }],
  ],
  kael: [
    ['Void Touch', { atk: 0.08 }],
    ['Dark Echo', { crit: 0.07 }],
    ['Void Cannon Mastery', { specialPower: 0.22 }],
    ['Corruption', { edge: 0.2 }],
    ['Void Form', { chargeDiscount: 1, charge: 1 }],
    ['Echo Never Ends', { lastStand: 0.4 }],
  ],
  // Legendary fighters.
  ryuga: [
    ['Dragon Blood', { atk: 0.1 }],
    ["Emperor's Poise", { crit: 0.08 }],
    ['Dragon Fist Mastery', { specialPower: 0.25 }],
    ['First Roar', { firstStrike: 0.4 }],
    ['Heavenly Scales', { atk: 0.12, hp: 0.12 }],
    ['Eternal Dragon', { chargeDiscount: 1, secondWind: 0.3 }],
  ],
  solenne: [
    ['Dawn Step', { spd: 4 }],
    ['Sunlit Edge', { crit: 0.1 }],
    ['Supernova Mastery', { specialPower: 0.25 }],
    ['Blinding Noon', { firstStrike: 0.35 }],
    ['Solar Core', { atk: 0.15 }],
    ['Never Sets', { lastStand: 0.4, charge: 1 }],
  ],
  seraphine: [
    ['Halo', { shield: 0.08 }],
    ['Gentle Wings', { hp: 0.12 }],
    ['Choir of Light', { heal: 0.25 }],
    ['Swift Prayer', { chargeDiscount: 1 }],
    ['Archangel Grace', { ki: 30, heal: 0.15 }],
    ['Divine Return', { secondWind: 0.5 }],
  ],
  aurel: [
    ['Golden Breath', { ki: 20 }],
    ['Sage Armor', { def: 0.12 }],
    ['Hymn of Courage', { specialPower: 0.25 }],
    ['Gilded Ward', { shield: 0.1 }],
    ['Eternal Verse', { chargeDiscount: 1, charge: 1 }],
    ['Golden Age', { hp: 0.15, heal: 0.2 }],
  ],
  tharok: [
    ['Bedrock', { def: 0.12 }],
    ['Mountain Heart', { hp: 0.14 }],
    ['Titan Wall', { shield: 0.12 }],
    ['Avalanche', { atk: 0.1 }],
    ['King of Peaks', { hp: 0.15, def: 0.1 }],
    ['Unbreakable', { secondWind: 0.5 }],
  ],
  gorvath: [
    ['Ancient Hide', { def: 0.12 }],
    ['Primal Rage', { lastStand: 0.35 }],
    ['World Breaker Mastery', { specialPower: 0.25 }],
    ['Destroyer', { edge: 0.25 }],
    ['Primordial Body', { hp: 0.18, atk: 0.08 }],
    ['Endless Ruin', { chargeDiscount: 1, charge: 1 }],
  ],
  nyxara: [
    ['Night Veil', { crit: 0.08 }],
    ['Moon Thirst', { drain: 0.2 }],
    ['Devourer Mastery', { specialPower: 0.25 }],
    ['Shadow Step', { spd: 4 }],
    ['Eclipse Queen', { atk: 0.12, drain: 0.15 }],
    ['Endless Night', { secondWind: 0.4, chargeDiscount: 1 }],
  ],
  morvain: [
    ['Fallen Grace', { hp: 0.12 }],
    ['Godless Hunger', { drain: 0.2 }],
    ['Godfall Mastery', { specialPower: 0.25 }],
    ['Divine Scorn', { edge: 0.25 }],
    ['Godslayer', { atk: 0.14, crit: 0.08 }],
    ['Rise From Ruin', { secondWind: 0.5 }],
  ],
  volkan: [
    ['Magma Veins', { atk: 0.1 }],
    ['Obsidian Skin', { def: 0.12 }],
    ['Cataclysm Mastery', { specialPower: 0.25 }],
    ['Eruption', { firstStrike: 0.4 }],
    ['Living Core', { atk: 0.12, hp: 0.12 }],
    ['Endless Eruption', { chargeDiscount: 1, charge: 1 }],
  ],
  zephyra: [
    ['Tailwind', { spd: 4 }],
    ['Static Charge', { charge: 1 }],
    ['Tempest Mastery', { specialPower: 0.25 }],
    ['Eye of the Storm', { crit: 0.1 }],
    ['Storm Empress', { atk: 0.14, spd: 3 }],
    ['Endless Storm', { chargeDiscount: 1, lastStand: 0.3 }],
  ],
};

export function awakeningTree(familyId: string): AwakenNode[] {
  const tree = TREES[familyId] ?? [];
  return tree.map(([name, effect], i) => ({
    id: `${familyId}-${i}`,
    name,
    tier: (Math.floor(i / 2) + 1) as 1 | 2 | 3,
    effect,
  }));
}

/** Registers extra trees (fusion characters add theirs). */
export function registerTree(familyId: string, tree: Tree): void {
  TREES[familyId] = tree;
}

export function nodeCost(node: AwakenNode): number {
  return TIER_COST[node.tier - 1];
}

export function awakenPoints(unit: Unit): number {
  return Math.max(0, unit.star - AWAKEN_FROM_STAR + 1);
}

export function spentPoints(unit: Unit): number {
  const tree = awakeningTree(unit.familyId);
  return (unit.awakened ?? []).reduce((sum, id) => {
    const node = tree.find((n) => n.id === id);
    return sum + (node ? nodeCost(node) : 0);
  }, 0);
}

export function canAwaken(unit: Unit, node: AwakenNode): { ok: boolean; reason?: string } {
  const owned = new Set(unit.awakened ?? []);
  if (owned.has(node.id)) return { ok: false, reason: 'Already awakened' };
  if (awakenPoints(unit) === 0) return { ok: false, reason: `Awakening starts at ${AWAKEN_FROM_STAR}★` };
  if (awakenPoints(unit) - spentPoints(unit) < nodeCost(node)) return { ok: false, reason: 'Not enough points' };
  if (node.tier > 1) {
    const below = awakeningTree(unit.familyId).filter((n) => n.tier === node.tier - 1);
    if (!below.some((n) => owned.has(n.id))) return { ok: false, reason: `Unlock a tier ${node.tier - 1} node first` };
  }
  return { ok: true };
}

export function awaken(save: SaveData, uid: string, nodeId: string): SaveData {
  const unit = findUnit(save, uid);
  const node = awakeningTree(unit.familyId).find((n) => n.id === nodeId);
  if (!node) throw new Error('Unknown awakening');
  const check = canAwaken(unit, node);
  if (!check.ok) throw new Error(check.reason);
  return { ...save, units: save.units.map((u) => (u.uid === uid ? { ...u, awakened: [...(u.awakened ?? []), nodeId] } : u)) };
}

/** Refunds every awakening point: a Respec Scroll if you have one, otherwise gems. */
export function respecAwakening(save: SaveData, uid: string): SaveData {
  const unit = findUnit(save, uid);
  if (!unit.awakened?.length) throw new Error('Nothing to reset');
  const units = save.units.map((u) => (u.uid === uid ? { ...u, awakened: [] } : u));
  if (save.materials.respecScroll > 0) {
    return { ...save, units, materials: { ...save.materials, respecScroll: save.materials.respecScroll - 1 } };
  }
  if (save.gems < RESPEC_GEMS) throw new Error('Not enough gems');
  return { ...save, gems: save.gems - RESPEC_GEMS, units };
}

export function awakeningBonus(unit: Unit): Bonus {
  const tree = awakeningTree(unit.familyId);
  return (unit.awakened ?? []).reduce((total, id) => {
    const node = tree.find((n) => n.id === id);
    return node ? addBonus(total, node.effect) : total;
  }, emptyBonus());
}
