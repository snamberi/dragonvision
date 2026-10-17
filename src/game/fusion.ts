import { SHARD_FUSION_COST, levelCap, sellValue } from './balance';
import { addUnit, isBusy, power } from './progression';
import { FUSION_RECIPES, type FusionRecipe, getFamily } from './roster';
import type { SaveData, Unit } from './types';

/** The strongest copy of each character, which the Lab never touches. */
function bestCopies(save: SaveData): Set<string> {
  const best = new Map<string, Unit>();
  for (const u of save.units) {
    const b = best.get(u.familyId);
    if (!b || power(u.familyId, u.star, u.level) > power(b.familyId, b.star, b.level)) best.set(u.familyId, u);
  }
  return new Set([...best.values()].map((u) => u.uid));
}

export interface Spare {
  unit: Unit;
  /** Same star as the best copy, so it could still be used to evolve it. */
  usefulForEvolving: boolean;
}

/** Copies that are not on the team, not training, and not a character's best copy. */
export function spareUnits(save: SaveData): Spare[] {
  const best = bestCopies(save);
  const bestStar = new Map(save.units.filter((u) => best.has(u.uid)).map((u) => [u.familyId, u.star]));
  return save.units
    .filter((u) => !best.has(u.uid) && !save.team.includes(u.uid) && !isBusy(save, u.uid))
    .map((unit) => ({ unit, usefulForEvolving: bestStar.get(unit.familyId) === unit.star }))
    .sort((a, b) => a.unit.star - b.unit.star || Number(a.usefulForEvolving) - Number(b.usefulForEvolving) || a.unit.level - b.unit.level);
}

function takeSpares(save: SaveData, uids: string[]): Unit[] {
  const spare = new Map(spareUnits(save).map((s) => [s.unit.uid, s.unit]));
  return uids.map((uid) => {
    const unit = spare.get(uid);
    if (!unit) throw new Error('Only spare copies can go into the Lab.');
    return unit;
  });
}

/** Fuses three spare copies of the same star into one shard of that star. */
export function fuseShard(save: SaveData, uids: string[]): SaveData {
  if (new Set(uids).size !== SHARD_FUSION_COST) throw new Error(`Pick ${SHARD_FUSION_COST} copies to fuse.`);
  const units = takeSpares(save, uids);
  const star = units[0].star;
  if (units.some((u) => u.star !== star)) throw new Error('All copies must have the same star.');
  const gone = new Set(uids);
  return {
    ...save,
    units: save.units.filter((u) => !gone.has(u.uid)),
    shards: { ...save.shards, [star]: (save.shards[star] ?? 0) + 1 },
  };
}

export function sellPrice(units: Unit[]): number {
  return units.reduce((sum, u) => sum + sellValue(u.star, u.level) + u.coinsSpent, 0);
}

/** Trades spare copies for coins, refunding any coins spent leveling them. */
export function sellSpares(save: SaveData, uids: string[]): SaveData {
  if (uids.length === 0) throw new Error('Pick copies to sell.');
  const units = takeSpares(save, [...new Set(uids)]);
  const gone = new Set(uids);
  return { ...save, coins: save.coins + sellPrice(units), units: save.units.filter((u) => !gone.has(u.uid)) };
}

// --- Fighter fusion ---

/** Best copy of a character that isn't busy (highest star, then level). */
function bestFree(save: SaveData, familyId: string): Unit | null {
  return (
    save.units
      .filter((u) => u.familyId === familyId && !isBusy(save, u.uid))
      .sort((a, b) => b.star - a.star || b.level - a.level)[0] ?? null
  );
}

export function fusionParts(save: SaveData, recipe: FusionRecipe): [Unit | null, Unit | null] {
  return [bestFree(save, recipe.parts[0]), bestFree(save, recipe.parts[1])];
}

export function canFuse(save: SaveData, recipe: FusionRecipe): { ok: boolean; reason?: string } {
  const [a, b] = fusionParts(save, recipe);
  if (!a || !b) return { ok: false, reason: `Needs ${getFamily(recipe.parts[0]).name} and ${getFamily(recipe.parts[1]).name}` };
  if (a.star < recipe.minStar || b.star < recipe.minStar) return { ok: false, reason: `Both need ${recipe.minStar}★ or more` };
  return { ok: true };
}

/**
 * Permanently fuses the best copies of two fighters into the fusion character.
 * It keeps the lower star and level of the two; gear they wore goes back to the inventory.
 */
export function fuseFighters(save: SaveData, resultId: string): { save: SaveData; unit: Unit } {
  const recipe = FUSION_RECIPES.find((r) => r.result === resultId);
  if (!recipe) throw new Error('Unknown fusion');
  const check = canFuse(save, recipe);
  if (!check.ok) throw new Error(check.reason);
  const [a, b] = fusionParts(save, recipe) as [Unit, Unit];
  const star = Math.min(a.star, b.star);
  const level = Math.min(a.level, b.level, levelCap(star));
  const created = addUnit(save, { familyId: recipe.result, star, level, baseLevel: level, coinsSpent: 0 });
  const gone = new Set([a.uid, b.uid]);
  // The fusion takes the first part's pad; the second part's pad empties.
  const team = save.team.map((t) => (t === a.uid || (t === b.uid && !save.team.includes(a.uid)) ? created.unit.uid : t && gone.has(t) ? null : t));
  const next = { ...created.save, units: created.save.units.filter((u) => !gone.has(u.uid)), team };
  return { save: next, unit: created.unit };
}
