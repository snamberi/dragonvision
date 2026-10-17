import {
  DUPLICATES_TO_EVOLVE,
  LEVELS_PER_STAR,
  MAX_LEVEL,
  MAX_STARS,
  MAX_TEAM_SIZE,
  RESET_GEM_COST,
  levelCap,
  STARTING_COINS,
  STARTING_GEMS,
  STARTING_SPINS,
  STAT_PER_LEVEL,
  STAT_PER_STAR,
  levelUpCost,
} from './balance';
import { STARTER_FAMILY_ID, formForStar, getFamily } from './roster';
import type { SaveData, Unit } from './types';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export function statsFor(familyId: string, star: number, level: number): Stats {
  const { base } = getFamily(familyId);
  const scale = (1 + STAT_PER_LEVEL * (level - 1)) * (1 + STAT_PER_STAR * (star - 1));
  return {
    hp: Math.round(base.hp * scale),
    atk: Math.round(base.atk * scale),
    def: Math.round(base.def * scale),
    // Speed only orders turns, so it grows slowly.
    spd: Math.round(base.spd + level * 0.05 + star),
  };
}

export function power(familyId: string, star: number, level: number): number {
  const s = statsFor(familyId, star, level);
  return Math.round(s.hp / 4 + s.atk + s.def);
}

export function unitName(unit: Pick<Unit, 'familyId' | 'star'>): string {
  return formForStar(getFamily(unit.familyId), unit.star).name;
}

/** Summoned level range for a star tier: 2★ fighters arrive between level 20 and 40. */
export function summonLevelRange(star: number): [number, number] {
  const min = Math.max(1, (star - 1) * LEVELS_PER_STAR);
  const max = Math.min(MAX_LEVEL, star * LEVELS_PER_STAR);
  return [Math.min(min, MAX_LEVEL), max];
}

/** Level a fighter must reach before evolving out of `star`. */
export function evolveLevelRequirement(star: number): number {
  return Math.min(MAX_LEVEL, star * LEVELS_PER_STAR);
}

export function newSave(): SaveData {
  return {
    version: 1,
    coins: STARTING_COINS,
    gems: STARTING_GEMS,
    spins: STARTING_SPINS,
    units: [{ uid: 'u1', familyId: STARTER_FAMILY_ID, star: 1, level: 1, baseLevel: 1, coinsSpent: 0 }],
    team: ['u1', null, null, null, null],
    clearedStage: 0,
    focusFamilyId: null,
    nextUid: 2,
    dojo: [],
    shards: {},
  };
}

export function findUnit(save: SaveData, uid: string): Unit {
  const unit = save.units.find((u) => u.uid === uid);
  if (!unit) throw new Error(`No unit ${uid}`);
  return unit;
}

function replaceUnit(save: SaveData, unit: Unit): SaveData {
  return { ...save, units: save.units.map((u) => (u.uid === unit.uid ? unit : u)) };
}

export function addUnit(save: SaveData, unit: Omit<Unit, 'uid'>): { save: SaveData; unit: Unit } {
  const created: Unit = { ...unit, uid: `u${save.nextUid}` };
  return { save: { ...save, units: [...save.units, created], nextUid: save.nextUid + 1 }, unit: created };
}

// --- Level upgrades ---

/** Coins needed to buy `count` levels starting from `level`. */
export function upgradeCost(level: number, count: number): number {
  let total = 0;
  for (let l = level; l < Math.min(MAX_LEVEL, level + count); l++) total += levelUpCost(l);
  return total;
}

/** Most levels affordable right now, capped at `limit`. */
export function affordableLevels(level: number, coins: number, limit = MAX_LEVEL): number {
  let count = 0;
  let spent = 0;
  while (level + count < MAX_LEVEL && count < limit) {
    const next = levelUpCost(level + count);
    if (spent + next > coins) break;
    spent += next;
    count++;
  }
  return count;
}

export function upgradeUnit(save: SaveData, uid: string, count: number): SaveData {
  const unit = findUnit(save, uid);
  const cap = levelCap(unit.star);
  const levels = Math.min(count, cap - unit.level);
  if (levels <= 0) {
    throw new Error(cap >= MAX_LEVEL ? 'Already at max level' : `Level ${cap} is the cap for ${unit.star}★. Evolve to keep leveling.`);
  }
  const cost = upgradeCost(unit.level, levels);
  if (cost > save.coins) throw new Error('Not enough coins');
  const next = replaceUnit(save, { ...unit, level: unit.level + levels, coinsSpent: unit.coinsSpent + cost });
  return { ...next, coins: save.coins - cost };
}

// --- Gem reset ---

/** Levels that can't be refunded: summoned levels plus Dojo training. */
export function freeLevel(unit: Unit): number {
  return unit.baseLevel + (unit.trainedLevels ?? 0);
}

export function purchasedLevels(unit: Unit): number {
  return Math.max(0, unit.level - freeLevel(unit));
}

export function canReset(save: SaveData, unit: Unit): boolean {
  return purchasedLevels(unit) > 0 && save.gems >= RESET_GEM_COST;
}

/** Drops purchased levels back to the summoned level and refunds their coins. */
export function resetUnit(save: SaveData, uid: string): SaveData {
  const unit = findUnit(save, uid);
  if (purchasedLevels(unit) <= 0) throw new Error('Nothing to reset');
  if (save.gems < RESET_GEM_COST) throw new Error('Not enough gems');
  const next = replaceUnit(save, { ...unit, level: freeLevel(unit), coinsSpent: 0 });
  return { ...next, coins: save.coins + unit.coinsSpent, gems: save.gems - RESET_GEM_COST };
}

// --- Evolution ---

export interface EvolveCheck {
  ok: boolean;
  levelNeeded: number;
  levelMet: boolean;
  duplicates: Unit[];
  /** Evolution shards that will stand in for missing copies. */
  shardsUsed: number;
  duplicatesMet: boolean;
  maxed: boolean;
  /** Chosen duplicates that carry purchased levels the player would lose. */
  investedDuplicates: Unit[];
}

/** Same family and same star: the exact current form. */
export function isTraining(save: SaveData, uid: string): boolean {
  return save.dojo.some((d) => d.uid === uid);
}

export function duplicatesFor(save: SaveData, unit: Unit): Unit[] {
  return save.units
    // Fighters training in the Dojo are never used up.
    .filter((u) => u.uid !== unit.uid && u.familyId === unit.familyId && u.star === unit.star && !isTraining(save, u.uid))
    // Spend the cheapest copies first: not on the team, then fewest coins invested.
    .sort(
      (a, b) =>
        Number(save.team.includes(a.uid)) - Number(save.team.includes(b.uid)) ||
        a.coinsSpent - b.coinsSpent ||
        a.level - b.level,
    );
}

export function checkEvolve(save: SaveData, uid: string): EvolveCheck {
  const unit = findUnit(save, uid);
  const maxed = unit.star >= MAX_STARS;
  const levelNeeded = evolveLevelRequirement(unit.star);
  const duplicates = duplicatesFor(save, unit).slice(0, DUPLICATES_TO_EVOLVE);
  // Shards of the same star fill in for missing copies.
  const shardsUsed = Math.min(save.shards[unit.star] ?? 0, DUPLICATES_TO_EVOLVE - duplicates.length);
  const levelMet = unit.level >= levelNeeded;
  const duplicatesMet = duplicates.length + shardsUsed >= DUPLICATES_TO_EVOLVE;
  return {
    ok: !maxed && levelMet && duplicatesMet,
    levelNeeded,
    levelMet,
    duplicates,
    shardsUsed,
    duplicatesMet,
    maxed,
    investedDuplicates: duplicates.filter((d) => d.coinsSpent > 0),
  };
}

/** Raises the star, keeps the level, and consumes two copies of the current form. */
export function evolveUnit(save: SaveData, uid: string): SaveData {
  const check = checkEvolve(save, uid);
  if (!check.ok) throw new Error('Evolution requirements not met');
  const unit = findUnit(save, uid);
  const consumed = new Set(check.duplicates.map((d) => d.uid));
  let team = save.team.map((t) => (t && consumed.has(t) ? null : t));
  // A consumed copy may have been the only team member; the evolved fighter takes its pad.
  if (!team.some(Boolean)) {
    const pad = save.team.findIndex((t) => t !== null);
    team = team.map((t, i) => (i === Math.max(0, pad) ? uid : t));
  }
  const shards = { ...save.shards, [unit.star]: (save.shards[unit.star] ?? 0) - check.shardsUsed };
  return {
    ...save,
    units: save.units
      .filter((u) => !consumed.has(u.uid))
      .map((u) => (u.uid === uid ? { ...u, star: unit.star + 1 } : u)),
    team,
    shards,
  };
}

// --- Team ---

/** Fighters on the team in slot order, skipping empty pads. */
export function teamUnits(save: SaveData): Unit[] {
  return teamSlots(save).filter((u): u is Unit => u !== null);
}

/** The five formation pads, with null for empty ones. */
export function teamSlots(save: SaveData): (Unit | null)[] {
  return Array.from({ length: MAX_TEAM_SIZE }, (_, i) => {
    const uid = save.team[i];
    return uid ? findUnit(save, uid) : null;
  });
}

export function isBackRow(slot: number): boolean {
  return slot % 2 === 1;
}

/** Swaps two pads; moving onto an empty pad just moves the fighter. */
export function moveTeamMember(save: SaveData, from: number, to: number): SaveData {
  if (from === to) return save;
  const team = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => save.team[i] ?? null);
  [team[from], team[to]] = [team[to], team[from]];
  return { ...save, team };
}

export type TeamToggleResult = { ok: true; save: SaveData } | { ok: false; reason: string };

export function toggleTeamMember(save: SaveData, uid: string): TeamToggleResult {
  const team = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => save.team[i] ?? null);
  if (team.includes(uid)) {
    if (team.filter(Boolean).length === 1) return { ok: false, reason: 'Your team needs at least one fighter.' };
    return { ok: true, save: { ...save, team: team.map((t) => (t === uid ? null : t)) } };
  }
  const pad = team.indexOf(null);
  if (pad < 0) return { ok: false, reason: 'Your team is full (5 fighters).' };
  if (isTraining(save, uid)) return { ok: false, reason: 'This fighter is training in the Dojo. Collect them first.' };
  const unit = findUnit(save, uid);
  const clash = teamUnits(save).find((u) => u.familyId === unit.familyId);
  if (clash) {
    return { ok: false, reason: `${unitName(clash)} is already on the team. Only one version of a fighter can join.` };
  }
  team[pad] = uid;
  return { ok: true, save: { ...save, team } };
}
