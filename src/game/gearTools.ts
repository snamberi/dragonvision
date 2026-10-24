import { type Bonus } from './bonus';
import { dustFor, forgeDust } from './forge';
import {
  RARITIES,
  type Rarity,
  equip,
  gearBonus,
  getSet,
  getTemplate,
  isBossSetTemplate,
  itemBonus,
  setCounts,
  wearer,
} from './gear';
import { GEAR_EFFECTS } from './bossSets';
import { findUnit } from './progression';
import type { GearItem, GearSlotKey, SaveData, Unit } from './types';

export const GEAR_SLOTS: GearSlotKey[] = ['weapon', 'armor', 'acc1', 'acc2'];

/** Rough worth of one point of each stat, so different stats can be compared (10% ATK ≈ 10). */
const STAT_WEIGHT: Record<keyof Bonus, number> = {
  atk: 100, hp: 80, def: 70, spd: 2, crit: 110, ki: 0.4, charge: 8, shield: 90, heal: 40, edge: 50,
  specialPower: 60, chargeDiscount: 12, lastStand: 25, secondWind: 50, firstStrike: 20, drain: 30,
};
/** A boss set's play-changing 4-piece effect counts as much as a big stat bonus. */
const EFFECT_VALUE = 40;

export function bonusScore(b: Partial<Bonus>): number {
  return (Object.entries(b) as [keyof Bonus, number][]).reduce((sum, [k, v]) => sum + (STAT_WEIGHT[k] ?? 0) * v, 0);
}

function setScore(setId: string, pieces: number): number {
  const set = getSet(setId);
  return (pieces >= 2 ? bonusScore(set.two) : 0) + (pieces >= 4 ? bonusScore(set.four) + (set.effect ? EFFECT_VALUE : 0) : 0);
}

type Loadout = Partial<Record<GearSlotKey, GearItem>>;

function loadoutScore(items: GearItem[]): number {
  const counts = new Map<string, number>();
  let score = 0;
  for (const item of items) {
    score += bonusScore(itemBonus(item));
    const setId = getTemplate(item.templateId).setId;
    counts.set(setId, (counts.get(setId) ?? 0) + 1);
  }
  for (const [setId, pieces] of counts) score += setScore(setId, pieces);
  return score;
}

interface Scored {
  item: GearItem;
  score: number;
  set: string;
}

const TOP_PER_KIND = 4;
/** Accessories: two per set, since a fighter wears two. */
const ACC_PER_SET = 2;

/** Keeps the search small: the best few pieces overall plus the best pieces of every set. */
function candidates(items: Scored[], perSet: number): Scored[] {
  const ranked = [...items].sort((a, b) => b.score - a.score);
  const bySet = new Map<string, Scored[]>();
  for (const s of ranked) {
    const list = bySet.get(s.set) ?? [];
    if (list.length < perSet) bySet.set(s.set, [...list, s]);
  }
  return [...new Set([...ranked.slice(0, TOP_PER_KIND), ...[...bySet.values()].flat()])];
}

/** The highest-scoring loadout from a pool of pieces, counting 2- and 4-piece set bonuses. */
export function bestLoadout(pool: GearItem[]): Loadout {
  const scored: Scored[] = pool.map((item) => ({ item, score: bonusScore(itemBonus(item)), set: getTemplate(item.templateId).setId }));
  const ofKind = (kind: string, perSet: number) =>
    candidates(scored.filter((s) => getTemplate(s.item.templateId).kind === kind), perSet);
  const weapons: (Scored | undefined)[] = ofKind('weapon', 1);
  const armors: (Scored | undefined)[] = ofKind('armor', 1);
  const accs = ofKind('accessory', ACC_PER_SET);
  if (weapons.length === 0) weapons.push(undefined);
  if (armors.length === 0) armors.push(undefined);
  const accPairs: [Scored | undefined, Scored | undefined][] = [];
  for (let i = 0; i < accs.length; i++) for (let j = i + 1; j < accs.length; j++) accPairs.push([accs[i], accs[j]]);
  if (accPairs.length === 0) accPairs.push([accs[0], undefined]);

  const setBonus = new Map<string, number[]>();
  const bonusFor = (set: string, pieces: number) => {
    let row = setBonus.get(set);
    if (!row) {
      row = [0, 1, 2, 3, 4].map((n) => setScore(set, n));
      setBonus.set(set, row);
    }
    return row[pieces];
  };

  let best: Loadout = {};
  let bestScore = -Infinity;
  for (const weapon of weapons) {
    for (const armor of armors) {
      for (const [acc1, acc2] of accPairs) {
        const picks = [weapon, armor, acc1, acc2];
        let score = 0;
        const counts: Record<string, number> = {};
        for (const p of picks) {
          if (!p) continue;
          score += p.score;
          counts[p.set] = (counts[p.set] ?? 0) + 1;
        }
        for (const set in counts) score += bonusFor(set, counts[set]);
        if (score > bestScore) {
          bestScore = score;
          best = { weapon: weapon?.item, armor: armor?.item, acc1: acc1?.item, acc2: acc2?.item };
        }
      }
    }
  }
  return best;
}

export function unitGearScore(save: SaveData, unit: Unit): number {
  return loadoutScore(
    GEAR_SLOTS.map((slot) => unit.gear?.[slot]).filter(Boolean).map((id) => save.items.find((i) => i.id === id)).filter((i): i is GearItem => Boolean(i)),
  );
}

export interface AutoEquipResult {
  save: SaveData;
  /** Slots that changed. */
  changed: number;
  /** Pieces taken off benched fighters. */
  fromBench: number;
}

/** Pieces this fighter may use: unworn ones, its own, and (if allowed) ones on fighters off the team. */
function poolFor(save: SaveData, unit: Unit, takeFromBench: boolean): GearItem[] {
  return save.items.filter((item) => {
    const owner = wearer(save, item.id);
    if (!owner || owner.uid === unit.uid) return true;
    return takeFromBench && !save.team.includes(owner.uid);
  });
}

/** Equips the best gear this fighter can get. Team fighters' gear is never taken. */
export function autoEquip(save: SaveData, uid: string, takeFromBench = false): AutoEquipResult {
  const unit = findUnit(save, uid);
  const best = bestLoadout(poolFor(save, unit, takeFromBench));
  let next = save;
  let changed = 0;
  let fromBench = 0;
  for (const slot of GEAR_SLOTS) {
    const item = best[slot];
    if (!item || unit.gear?.[slot] === item.id) continue;
    const owner = wearer(next, item.id);
    if (owner && owner.uid !== uid) fromBench++;
    next = equip(next, uid, slot, item.id);
    changed++;
  }
  return { save: next, changed, fromBench };
}

/** Auto-equips every team fighter in pad order; earlier pads get first pick. */
export function autoEquipTeam(save: SaveData, takeFromBench = false): AutoEquipResult {
  const uids = save.team.filter((t): t is string => Boolean(t));
  return uids.reduce<AutoEquipResult>(
    (acc, uid) => {
      const r = autoEquip(acc.save, uid, takeFromBench);
      return { save: r.save, changed: acc.changed + r.changed, fromBench: acc.fromBench + r.fromBench };
    },
    { save, changed: 0, fromBench: 0 },
  );
}

/** True when allowing bench gear would give a better result than unworn gear alone. */
export function benchWouldHelp(save: SaveData, uids: string[]): boolean {
  const score = (s: SaveData) => uids.reduce((sum, uid) => sum + unitGearScore(s, findUnit(s, uid)), 0);
  const solo = (allow: boolean) =>
    uids.length === 1 ? autoEquip(save, uids[0], allow).save : autoEquipTeam(save, allow).save;
  return score(solo(true)) > score(solo(false)) + 1e-9;
}

// --- Compare ---

export interface StatDelta {
  stat: keyof Bonus;
  delta: number;
}

export interface GearComparison {
  stats: StatDelta[];
  gained: string[];
  lost: string[];
}

function setTiers(save: SaveData, unit: Unit): Map<string, number> {
  return new Map(setCounts(save, unit).map(({ set, pieces }) => [set.id, pieces >= 4 ? 4 : pieces >= 2 ? 2 : 0]));
}

function tierLabel(setId: string, tier: number): string {
  const set = getSet(setId);
  if (tier === 4 && set.effect) return `${set.name} 4-piece: ${GEAR_EFFECTS[set.effect].name}`;
  return `${set.name} ${tier}-piece`;
}

/** What putting `itemId` in `slot` would change for this fighter, compared with what's there now. */
export function compareSwap(save: SaveData, uid: string, slot: GearSlotKey, itemId: string): GearComparison {
  const before = findUnit(save, uid);
  const after = equip(save, uid, slot, itemId);
  const a = gearBonus(save, before);
  const b = gearBonus(after, findUnit(after, uid));
  const stats = (Object.keys(b) as (keyof Bonus)[])
    .map((stat) => ({ stat, delta: Math.round((b[stat] - a[stat]) * 1000) / 1000 }))
    .filter((d) => d.delta !== 0);
  const oldTiers = setTiers(save, before);
  const newTiers = setTiers(after, findUnit(after, uid));
  const gained: string[] = [];
  const lost: string[] = [];
  for (const setId of new Set([...oldTiers.keys(), ...newTiers.keys()])) {
    const was = oldTiers.get(setId) ?? 0;
    const now = newTiers.get(setId) ?? 0;
    if (now > was) gained.push(tierLabel(setId, now));
    if (now < was) lost.push(tierLabel(setId, was));
  }
  return { stats, gained, lost };
}

// --- Bulk salvage ---

export interface SalvageFilter {
  /** Salvage pieces at or below this rarity. */
  maxRarity: Rarity;
  /** Boss set pieces are kept unless this is set. */
  includeBossSets?: boolean;
}

/** Unworn pieces matching the filter. Worn gear is never included. */
export function salvageCandidates(save: SaveData, filter: SalvageFilter): GearItem[] {
  const cap = RARITIES.indexOf(filter.maxRarity);
  return save.items.filter(
    (item) =>
      !wearer(save, item.id) &&
      RARITIES.indexOf(item.rarity) <= cap &&
      (filter.includeBossSets || !isBossSetTemplate(item.templateId)),
  );
}

export function salvageFiltered(save: SaveData, filter: SalvageFilter): { save: SaveData; count: number; dust: number } {
  const picks = salvageCandidates(save, filter);
  const dust = picks.reduce((sum, i) => sum + dustFor(i), 0);
  const ids = new Set(picks.map((i) => i.id));
  return { save: { ...save, forgeDust: forgeDust(save) + dust, items: save.items.filter((i) => !ids.has(i.id)) }, count: picks.length, dust };
}

