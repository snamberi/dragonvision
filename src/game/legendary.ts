import { addUnit, summonLevelRange } from './progression';
import { LEGENDARIES, getFamily } from './roster';
import { type Rng, defaultRng } from './rng';
import type { SaveData, Unit } from './types';

export const PIECES_TO_FORGE = 10;
/** Chance per summon of a bonus legendary piece. Focus and the lucky fighter don't change it. */
export const PIECE_SUMMON_CHANCE = 0.005;
/** Chance of a piece from winning a stage boss (first clear or replay). */
export const PIECE_BOSS_CHANCE = 0.05;

export function isLegendary(familyId: string): boolean {
  return getFamily(familyId).legendary === true;
}

export function randomLegendId(rng: Rng = defaultRng): string {
  return LEGENDARIES[Math.floor(rng() * LEGENDARIES.length)].id;
}

export function addPieces(save: SaveData, familyId: string, count = 1): SaveData {
  if (!isLegendary(familyId)) throw new Error('Only legendary fighters have pieces');
  return { ...save, pieces: { ...save.pieces, [familyId]: (save.pieces[familyId] ?? 0) + count } };
}

/** Rolls the summon bonus: a random legendary's piece, or null. */
export function rollSummonPiece(rng: Rng = defaultRng): string | null {
  return rng() < PIECE_SUMMON_CHANCE ? randomLegendId(rng) : null;
}

/** Ten pieces become the fighter at their first star (again later for a duplicate to evolve with). */
export function forgeLegend(save: SaveData, familyId: string): { save: SaveData; unit: Unit } {
  const family = getFamily(familyId);
  if (!family.legendary) throw new Error('Only legendary fighters can be forged');
  if ((save.pieces[familyId] ?? 0) < PIECES_TO_FORGE) throw new Error(`Needs ${PIECES_TO_FORGE} pieces`);
  const star = family.firstStar ?? 1;
  const [level] = summonLevelRange(star);
  const paid = { ...save, pieces: { ...save.pieces, [familyId]: save.pieces[familyId] - PIECES_TO_FORGE } };
  return addUnit(paid, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
}
