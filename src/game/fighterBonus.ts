import { awakeningBonus } from './awakening';
import { type Bonus, addBonus, emptyBonus } from './bonus';
import type { BattleOptions } from './battle';
import { gearBonus, gearEffects } from './gear';
import { gravityMultiplier } from './gravity';
import { masteryBonus, unitMastery } from './mastery';
import { getFamily, roleFor } from './roster';
import type { SaveData, Unit } from './types';

/** Gravity Chamber + gear + awakening for one of the player's fighters. */
export function unitBonus(save: SaveData, unit: Unit): Bonus {
  const g = gravityMultiplier(save, roleFor(getFamily(unit.familyId))) - 1;
  let total = addBonus(emptyBonus(), { atk: g, hp: g, def: g });
  total = addBonus(total, gearBonus(save, unit));
  total = addBonus(total, awakeningBonus(unit));
  total = addBonus(total, masteryBonus(unitMastery(unit)));
  return total;
}

/** Everything createBattle needs to know about the player's fighters. */
export function battleOptions(save: SaveData): BattleOptions {
  return { bonusFor: (u) => unitBonus(save, u), effectsFor: (u) => gearEffects(save, u) };
}
