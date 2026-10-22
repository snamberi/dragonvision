import { findUnit } from './progression';
import type { SaveData } from './types';

export const TRANSCENDENCE_MAX = 10;
const TC_ATK_BONUS = 0.03;
const TC_DEF_BONUS = 0.03;
const TC_HP_BONUS = 0.03;
const TC_UNLOCK_LEVEL = 400;
const TC_PASSIVE_T5 = 5;
const TC_PASSIVE_T10 = TRANSCENDENCE_MAX;
const TC_REVIVE_PCTS = 30;
const PCT_DIVISOR = 100;

/** Crystal cost for tier index i = i + 1. */
export const TC_CRYSTAL_COST: readonly number[] = Array.from({ length: TRANSCENDENCE_MAX }, (_, i) => i + 1);

export function transcendUnit(save: SaveData, uid: string): SaveData {
  const unit = findUnit(save, uid);
  if (unit.level < TC_UNLOCK_LEVEL) throw new Error('Fighter must be level 400 to transcend');
  const tier = unit.transcendenceTier ?? 0;
  if (tier >= TRANSCENDENCE_MAX) throw new Error('Already at maximum transcendence tier');
  const cost = TC_CRYSTAL_COST[tier];
  if ((save.materials.transcendenceCrystal ?? 0) < cost) throw new Error('Not enough Transcendence Crystals');
  return {
    ...save,
    materials: { ...save.materials, transcendenceCrystal: save.materials.transcendenceCrystal - cost },
    units: save.units.map((u) => u.uid === uid ? { ...u, transcendenceTier: tier + 1 } : u),
  };
}

export function transcendenceBonuses(tier: number): { atkMult: number; defMult: number; hpMult: number } {
  const t = Math.max(0, Math.min(TRANSCENDENCE_MAX, tier));
  return {
    atkMult: 1 + t * TC_ATK_BONUS,
    defMult: 1 + t * TC_DEF_BONUS,
    hpMult: 1 + t * TC_HP_BONUS,
  };
}

export function transcendencePassive(tier: number): { name: string; description: string } | null {
  if (tier >= TC_PASSIVE_T10) return { name: 'Eternal Flame', description: `Revives once per battle at ${TC_REVIVE_PCTS}% HP` };
  if (tier >= TC_PASSIVE_T5) return { name: 'Dragon Pulse', description: 'Basic attacks have 15% chance to hit all enemies' };
  return null;
}

export function transcendenceReviveHp(maxHp: number): number {
  return Math.round(maxHp * (TC_REVIVE_PCTS / PCT_DIVISOR));
}
