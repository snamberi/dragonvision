import { type Bonus, emptyBonus } from './bonus';
import type { Unit } from './types';

// Filled in with each character's own tree.
export function awakeningBonus(_unit: Unit): Bonus {
  return emptyBonus();
}
