import { findUnit } from './progression';
import type { SaveData } from './types';

export const SIG_MAX_TIER = 3;
const SIG_MAT_COST_T1 = 3;
const SIG_MAT_COST_T2 = 6;
const SIG_MAT_COST_T3 = 10;
const SIG_MAT_COST: readonly number[] = [SIG_MAT_COST_T1, SIG_MAT_COST_T2, SIG_MAT_COST_T3];
const SIG_POWER_T1 = 0.20;
const SIG_POWER_T2 = 0.40;
const SIG_POWER_T3 = 0.60;
const SIG_POWER_BONUSES: readonly number[] = [SIG_POWER_T1, SIG_POWER_T2, SIG_POWER_T3];
const SIG_NAME_SUFFIX = ' Ω';

export function upgradeSignature(save: SaveData, uid: string): SaveData {
  const unit = findUnit(save, uid);
  const tier = unit.sigTier ?? 0;
  if (tier >= SIG_MAX_TIER) throw new Error('Signature already at maximum tier');
  const cost = SIG_MAT_COST[tier];
  if (save.materials.sigMaterial < cost) throw new Error('Not enough Signature Essence');
  return {
    ...save,
    materials: { ...save.materials, sigMaterial: save.materials.sigMaterial - cost },
    units: save.units.map((u) => u.uid === uid ? { ...u, sigTier: tier + 1 } : u),
  };
}

export function signaturePower(basePower: number, tier: number): number {
  if (tier <= 0 || tier > SIG_MAX_TIER) return basePower;
  return basePower * (1 + SIG_POWER_BONUSES[tier - 1]);
}

export function sigName(baseName: string, tier: number): string {
  return tier >= SIG_MAX_TIER ? baseName + SIG_NAME_SUFFIX : baseName;
}
