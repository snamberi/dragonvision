import { FOCUS_MULTIPLIER, LUCKY_MULTIPLIER, MAX_STARS, SUMMON_STAR_DECAY, spinPrice } from './balance';
import { addPieces, rollSummonPiece } from './legendary';
import { addUnit, bump, summonLevelRange } from './progression';
import { FAMILIES } from './roster';
import { type Rng, defaultRng, pickWeighted, randInt } from './rng';
import { dayKey, hashString } from './time';
import type { SaveData, Unit } from './types';

/** Highest star the player has unlocked for a family (0 if they own none). */
export function highestOwnedStar(save: SaveData, familyId: string): number {
  return save.units.reduce((max, u) => (u.familyId === familyId ? Math.max(max, u.star) : max), 0);
}

/** One tier above the highest unlocked form; a family you don't own starts at 1★. */
export function summonStarCap(save: SaveData, familyId: string): number {
  return Math.min(MAX_STARS, highestOwnedStar(save, familyId) + 1);
}

/** The Fortune Teller's lucky fighter for a day: same for everyone, changes daily. */
export function luckyFamilyId(day = dayKey()): string {
  return FAMILIES[hashString(day) % FAMILIES.length].id;
}

export function familyWeight(save: SaveData, familyId: string, day = dayKey()): number {
  const focus = save.focusFamilyId === familyId ? FOCUS_MULTIPLIER : 1;
  return focus * (luckyFamilyId(day) === familyId ? LUCKY_MULTIPLIER : 1);
}

export function starWeight(star: number): number {
  return Math.pow(SUMMON_STAR_DECAY, star - 1);
}

/** Probability of each family and star, for the odds panel and tests. */
export function summonOdds(save: SaveData, day = dayKey()): { familyId: string; star: number; chance: number }[] {
  const rows: { familyId: string; star: number; weight: number }[] = [];
  for (const family of FAMILIES) {
    const cap = summonStarCap(save, family.id);
    const starTotal = Array.from({ length: cap }, (_, i) => starWeight(i + 1)).reduce((a, b) => a + b, 0);
    for (let star = 1; star <= cap; star++) {
      rows.push({ familyId: family.id, star, weight: (familyWeight(save, family.id, day) * starWeight(star)) / starTotal });
    }
  }
  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  return rows.map((r) => ({ familyId: r.familyId, star: r.star, chance: r.weight / total }));
}

export interface Pull {
  save: SaveData;
  unit: Unit;
  /** A legendary piece that dropped with this pull (0.5% a pull). */
  piece: string | null;
}

/** Spends one spin: pick a family (focus raises its weight), then a star up to that family's cap. */
export function summon(save: SaveData, rng: Rng = defaultRng, day = dayKey()): Pull {
  if (save.spins <= 0) throw new Error('No Spin Orbs left');
  const family = pickWeighted(rng, FAMILIES, (f) => familyWeight(save, f.id, day));
  const cap = summonStarCap(save, family.id);
  const stars = Array.from({ length: cap }, (_, i) => i + 1);
  return give(save, family.id, pickWeighted(rng, stars, starWeight), rng);
}

function give(save: SaveData, familyId: string, star: number, rng: Rng): Pull {
  const [min, max] = summonLevelRange(star);
  const level = randInt(rng, min, max);
  const result = addUnit({ ...save, spins: save.spins - 1 }, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
  const piece = rollSummonPiece(rng);
  const after = bump(result.save, 'summons');
  return { save: piece ? addPieces(after, piece) : after, unit: result.unit, piece };
}

/**
 * Ten summons for ten spins. The last one is guaranteed to be one star above your best copy
 * of a fighter you already own (focus and the lucky fighter still raise who it lands on).
 */
export function summonTen(save: SaveData, rng: Rng = defaultRng, day = dayKey()): { save: SaveData; units: Unit[]; pieces: string[] } {
  if (save.spins < 10) throw new Error('A 10× summon needs 10 Spin Orbs');
  let current = save;
  const units: Unit[] = [];
  const pieces: string[] = [];
  for (let i = 0; i < 9; i++) {
    const r = summon(current, rng, day);
    current = r.save;
    units.push(r.unit);
    if (r.piece) pieces.push(r.piece);
  }
  // Only characters owned before this 10× count, so the guarantee is a real upgrade.
  const upgradable = FAMILIES.filter((f) => {
    const owned = highestOwnedStar(save, f.id);
    return owned > 0 && highestOwnedStar(current, f.id) < MAX_STARS;
  });
  const r =
    upgradable.length > 0
      ? (() => {
          const family = pickWeighted(rng, upgradable, (f) => familyWeight(current, f.id, day));
          return give(current, family.id, summonStarCap(current, family.id), rng);
        })()
      : summon(current, rng, day);
  units.push(r.unit);
  if (r.piece) pieces.push(r.piece);
  return { save: r.save, units, pieces };
}

/** Buys summon spins with coins at the Summoning Shrine. */
export function buySpins(save: SaveData, count: number): SaveData {
  const cost = spinPrice(save.clearedStage) * count;
  if (count <= 0) throw new Error('Pick how many Spin Orbs to buy');
  if (cost > save.coins) throw new Error('Not enough coins');
  return { ...save, coins: save.coins - cost, spins: save.spins + count };
}
