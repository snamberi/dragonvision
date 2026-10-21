import { FATE_MAX, FATE_PER_PULL, FATE_RAGE_DRAIN, FATE_RAGE_THRESHOLD, LUCKY_PULL_BONUS_PER_5, LUCKY_PULL_CHANCE, LUCKY_PULL_ROLLS, RAGE_MIN_TIER, TEN_PULL_FATE_BOOST, TEN_PULL_FATE_BOOST_INDEX, TIER_RATES, spinPrice } from './balance';
import { addPieces, rollSummonPiece } from './legendary';
import { addUnit, bump, summonLevelRange } from './progression';
import { collectionCap } from './upgrades';
import { FAMILIES, GOLDEN_FAMILIES, getFamily } from './roster';
import { type Rng, defaultRng, pickWeighted, randInt } from './rng';
import { dayKey, hashString } from './time';
import type { FamilyTier, SaveData, Unit } from './types';

const LUCKY_BONUS_BRACKET_SIZE = 5;

/** Highest star the player has unlocked for a family (0 if they own none). */
export function highestOwnedStar(save: SaveData, familyId: string): number {
  return save.units.reduce((max, u) => (u.familyId === familyId ? Math.max(max, u.star) : max), 0);
}

/** One tier above the highest unlocked form; a family you don't own starts at 1★. */
export function summonStarCap(save: SaveData, familyId: string): number {
  const MAX_STARS_CAP = 21;
  return Math.min(MAX_STARS_CAP, highestOwnedStar(save, familyId) + 1);
}

/** The Fortune Teller's lucky fighter for a day: same for everyone, changes daily. */
export function luckyFamilyId(day = dayKey()): string {
  return FAMILIES[hashString(day) % FAMILIES.length].id;
}

const FOCUS_MULTIPLIER = 5;
const LUCKY_MULTIPLIER = 3;
const SUMMON_STAR_DECAY = 0.55;

export function familyWeight(save: SaveData, familyId: string, day = dayKey()): number {
  const focus = save.focusFamilyId === familyId ? FOCUS_MULTIPLIER : 1;
  return focus * (luckyFamilyId(day) === familyId ? LUCKY_MULTIPLIER : 1);
}

export function starWeight(star: number): number {
  return Math.pow(SUMMON_STAR_DECAY, star - 1);
}

function starOptions(cap: number): number[] {
  return Array.from({ length: cap }, (_, i) => i + 1);
}

/** Probability of each family and star, for the odds panel and tests. */
export function summonOdds(save: SaveData, day = dayKey()): { familyId: string; star: number; chance: number }[] {
  const rows = FAMILIES.flatMap((family) => {
    const cap = summonStarCap(save, family.id);
    const starTotal = starOptions(cap).reduce((a, s) => a + starWeight(s), 0);
    return starOptions(cap).map((star) => ({
      familyId: family.id,
      star,
      weight: (familyWeight(save, family.id, day) * starWeight(star)) / starTotal,
    }));
  });
  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  return rows.map((r) => ({ familyId: r.familyId, star: r.star, chance: r.weight / total }));
}

// --- Dragon Fate tier system ---

const TIER_ORDER: FamilyTier[] = ['common', 'rare', 'epic', 'crystal'];

function tierAtLeast(tier: FamilyTier, min: string): boolean {
  return TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf(min as FamilyTier);
}

function familyTier(familyId: string): FamilyTier {
  return getFamily(familyId).tier ?? 'common';
}

function tierBaseWeight(familyId: string): number {
  return TIER_RATES[familyTier(familyId)] ?? TIER_RATES.common;
}

/** Pick a family constrained to at least `minTier`. */
function pickFamilyByTier(save: SaveData, rng: Rng, day: string, minTier: string): (typeof FAMILIES)[0] {
  const eligible = FAMILIES.filter((f) => tierAtLeast(familyTier(f.id), minTier));
  const pool = eligible.length > 0 ? eligible : FAMILIES;
  return pickWeighted(rng, pool, (f) => tierBaseWeight(f.id) * familyWeight(save, f.id, day));
}

function pickFamilyNormal(save: SaveData, rng: Rng, day: string): (typeof FAMILIES)[0] {
  return pickWeighted(rng, FAMILIES, (f) => tierBaseWeight(f.id) * familyWeight(save, f.id, day));
}

/** Whether this pull fires as a Lucky Pull (rolls twice, takes the better star). */
function isLuckyPull(save: SaveData, rng: Rng): boolean {
  const pullsSince = save.pullsSinceLastLucky ?? 0;
  const bonusBrackets = Math.floor(pullsSince / LUCKY_BONUS_BRACKET_SIZE);
  const chance = Math.min(1, LUCKY_PULL_CHANCE + bonusBrackets * LUCKY_PULL_BONUS_PER_5);
  return rng() < chance;
}

export interface Pull {
  save: SaveData;
  unit: Unit;
  /** A legendary piece that dropped with this pull (0.5% a pull). */
  piece: string | null;
  /** Whether this pull fired as a Lucky Pull. */
  lucky: boolean;
  /** Whether Dragon Rage triggered on this pull. */
  rage: boolean;
}

/** Spends one spin with the Dragon Fate system. */
export function summon(save: SaveData, rng: Rng = defaultRng, day = dayKey(), extraFate = 0): Pull {
  if (save.spins <= 0) throw new Error('No Spin Orbs left');

  const fate = Math.min(FATE_MAX, (save.fate ?? 0) + extraFate);
  const rage = fate >= FATE_RAGE_THRESHOLD;
  const lucky = !rage && isLuckyPull(save, rng);

  let family: (typeof FAMILIES)[0];
  let star: number;

  if (rage) {
    family = pickFamilyByTier(save, rng, day, RAGE_MIN_TIER);
    const cap = summonStarCap(save, family.id);
    star = pickWeighted(rng, starOptions(cap), starWeight);
  } else if (lucky) {
    family = pickFamilyNormal(save, rng, day);
    const cap = summonStarCap(save, family.id);
    const rolls = Array.from({ length: LUCKY_PULL_ROLLS }, () => pickWeighted(rng, starOptions(cap), starWeight));
    star = Math.max(...rolls);
  } else {
    family = pickFamilyNormal(save, rng, day);
    const cap = summonStarCap(save, family.id);
    star = pickWeighted(rng, starOptions(cap), starWeight);
  }

  const nextFate = rage
    ? Math.max(0, fate - FATE_RAGE_DRAIN)
    : Math.min(FATE_MAX, fate + FATE_PER_PULL);

  const nextPullsSince = lucky ? 0 : (save.pullsSinceLastLucky ?? 0) + 1;

  return give({ ...save, fate: nextFate, pullsSinceLastLucky: nextPullsSince }, family.id, star, rng, lucky, rage);
}

function give(save: SaveData, familyId: string, star: number, rng: Rng, lucky: boolean, rage: boolean): Pull {
  const [min, max] = summonLevelRange(star);
  const level = randInt(rng, min, max);
  const cap = collectionCap(save);
  const atCap = save.units.length >= cap;
  const spent = { ...save, spins: save.spins - 1 };
  if (atCap) {
    const after = bump(spent, 'summons');
    const piece = rollSummonPiece(rng);
    return { save: piece ? addPieces(after, piece) : after, unit: { uid: '', familyId, star, level, baseLevel: level, coinsSpent: 0 }, piece, lucky, rage };
  }
  const result = addUnit(spent, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
  const piece = rollSummonPiece(rng);
  const after = bump(result.save, 'summons');
  return { save: piece ? addPieces(after, piece) : after, unit: result.unit, piece, lucky, rage };
}

const TEN_PULL_COUNT = 10;

/** Ten summons for ten spins. Fate carries; the last pull gets a Fate boost. */
export function summonTen(save: SaveData, rng: Rng = defaultRng, day = dayKey()): { save: SaveData; units: Unit[]; pieces: string[] } {
  if (save.spins < TEN_PULL_COUNT) throw new Error('A 10× summon needs 10 Spin Orbs');
  return Array.from({ length: TEN_PULL_COUNT }).reduce<{ save: SaveData; units: Unit[]; pieces: string[] }>(
    (acc, _, i) => {
      const extra = i === TEN_PULL_FATE_BOOST_INDEX ? TEN_PULL_FATE_BOOST : 0;
      const r = summon(acc.save, rng, day, extra);
      return { save: r.save, units: [...acc.units, r.unit], pieces: r.piece ? [...acc.pieces, r.piece] : acc.pieces };
    },
    { save, units: [], pieces: [] },
  );
}

/** Buys summon spins with coins at the Summoning Shrine. */
export function buySpins(save: SaveData, count: number): SaveData {
  const cost = spinPrice(save.clearedStage) * count;
  if (count <= 0) throw new Error('Pick how many Spin Orbs to buy');
  if (cost > save.coins) throw new Error('Not enough coins');
  return { ...save, coins: save.coins - cost, spins: save.spins + count };
}

/** Golden currency never substitutes for normal orbs or spends gems implicitly. */
export const GOLDEN_ORB_PRICE = 60;
export function buyGoldenOrbs(save: SaveData, count: number): SaveData {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(count * GOLDEN_ORB_PRICE)) throw new Error('Pick a whole number of Golden Orbs');
  const cost = count * GOLDEN_ORB_PRICE;
  if (save.gems < cost) throw new Error('Not enough gems');
  return { ...save, gems: save.gems - cost, goldenOrbs: (save.goldenOrbs ?? 0) + count };
}

export function goldenSummonOdds(save: SaveData) {
  return GOLDEN_FAMILIES.flatMap((f) => {
    const cap = summonStarCap(save, f.id);
    const total = starOptions(cap).reduce((a, s) => a + starWeight(s), 0);
    return starOptions(cap).map((_, i) => ({ familyId: f.id, star: i + 1, chance: starWeight(i + 1) / total / GOLDEN_FAMILIES.length }));
  });
}

const GOLDEN_ONE = 1;
export function summonGolden(save: SaveData, count: typeof GOLDEN_ONE | typeof TEN_PULL_COUNT = GOLDEN_ONE, rng: Rng = defaultRng): { save: SaveData; units: Unit[]; pieces: string[] } {
  if (count !== GOLDEN_ONE && count !== TEN_PULL_COUNT) throw new Error('Choose one or ten summons');
  if ((save.goldenOrbs ?? 0) < count) throw new Error('Not enough Golden Orbs');
  const initial = { ...save, goldenOrbs: (save.goldenOrbs ?? 0) - count };
  const result = Array.from({ length: count }).reduce<{ current: SaveData; units: Unit[] }>(
    (acc) => {
      const family = pickWeighted(rng, GOLDEN_FAMILIES, () => 1);
      const cap = summonStarCap(acc.current, family.id);
      const star = pickWeighted(rng, starOptions(cap), starWeight);
      const [min, max] = summonLevelRange(star);
      const level = randInt(rng, min, max);
      const added = addUnit(acc.current, { familyId: family.id, star, level, baseLevel: level, coinsSpent: 0 });
      return { current: { ...bump(added.save, 'summons'), goldenOrbs: acc.current.goldenOrbs }, units: [...acc.units, added.unit] };
    },
    { current: initial, units: [] },
  );
  return { save: result.current, units: result.units, pieces: [] };
}
