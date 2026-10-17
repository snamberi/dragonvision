import { SHARD_FUSION_COST, sellValue } from './balance';
import { isBusy, power } from './progression';
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
