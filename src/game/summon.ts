import { FOCUS_MULTIPLIER, MAX_STARS, SUMMON_STAR_DECAY, spinPrice } from './balance';
import { addUnit, summonLevelRange } from './progression';
import { FAMILIES } from './roster';
import { type Rng, defaultRng, pickWeighted, randInt } from './rng';
import type { SaveData, Unit } from './types';

/** Highest star the player has unlocked for a family (0 if they own none). */
export function highestOwnedStar(save: SaveData, familyId: string): number {
  return save.units.reduce((max, u) => (u.familyId === familyId ? Math.max(max, u.star) : max), 0);
}

/** One tier above the highest unlocked form; a family you don't own starts at 1★. */
export function summonStarCap(save: SaveData, familyId: string): number {
  return Math.min(MAX_STARS, highestOwnedStar(save, familyId) + 1);
}

export function familyWeight(save: SaveData, familyId: string): number {
  return save.focusFamilyId === familyId ? FOCUS_MULTIPLIER : 1;
}

export function starWeight(star: number): number {
  return Math.pow(SUMMON_STAR_DECAY, star - 1);
}

/** Probability of each family and star, for the odds panel and tests. */
export function summonOdds(save: SaveData): { familyId: string; star: number; chance: number }[] {
  const rows: { familyId: string; star: number; weight: number }[] = [];
  for (const family of FAMILIES) {
    const cap = summonStarCap(save, family.id);
    const starTotal = Array.from({ length: cap }, (_, i) => starWeight(i + 1)).reduce((a, b) => a + b, 0);
    for (let star = 1; star <= cap; star++) {
      rows.push({ familyId: family.id, star, weight: (familyWeight(save, family.id) * starWeight(star)) / starTotal });
    }
  }
  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  return rows.map((r) => ({ familyId: r.familyId, star: r.star, chance: r.weight / total }));
}

/** Spends one spin: pick a family (focus raises its weight), then a star up to that family's cap. */
export function summon(save: SaveData, rng: Rng = defaultRng): { save: SaveData; unit: Unit } {
  if (save.spins <= 0) throw new Error('No summon spins left');
  const family = pickWeighted(rng, FAMILIES, (f) => familyWeight(save, f.id));
  const cap = summonStarCap(save, family.id);
  const stars = Array.from({ length: cap }, (_, i) => i + 1);
  const star = pickWeighted(rng, stars, starWeight);
  const [min, max] = summonLevelRange(star);
  const level = randInt(rng, min, max);
  const result = addUnit({ ...save, spins: save.spins - 1 }, { familyId: family.id, star, level, baseLevel: level, coinsSpent: 0 });
  return result;
}

/** Buys summon spins with coins at the Summoning Shrine. */
export function buySpins(save: SaveData, count: number): SaveData {
  const cost = spinPrice(save.clearedStage) * count;
  if (count <= 0) throw new Error('Pick how many spins to buy');
  if (cost > save.coins) throw new Error('Not enough coins');
  return { ...save, coins: save.coins - cost, spins: save.spins + count };
}
