import { roleFor, getFamily } from './roster';
import type { Unit } from './types';

export type FormationKind = 'AllAttack' | 'AllDefend' | 'Balanced' | 'SwiftStrike' | 'MixedArts';

export interface FormationAbility {
  kind: FormationKind;
  name: string;
  description: string;
  atkMult: number;
  defMult: number;
  spdBonus: number;
}

const NEUTRAL = 1.0;
const DOMINANT_THRESHOLD = 4;
const DIVERSE_THRESHOLD = 4;
const FORMATION_ATK_UP = 1.10;
const FORMATION_DEF_UP = 1.10;
const FORMATION_ATK_DOWN = 0.90;
const FORMATION_DEF_DOWN = 0.90;
const FORMATION_SPD_UP = 3;
const BALANCED_BONUS = 1.05;
const MIXED_BONUS = 1.07;

const FORMATION_TABLE: Record<FormationKind, FormationAbility> = {
  AllAttack: { kind: 'AllAttack', name: 'All-Out Assault', description: '+10% ATK for all fighters, -10% DEF', atkMult: FORMATION_ATK_UP, defMult: FORMATION_DEF_DOWN, spdBonus: 0 },
  AllDefend: { kind: 'AllDefend', name: 'Iron Fortress', description: '+10% DEF for all fighters, -10% ATK', atkMult: FORMATION_ATK_DOWN, defMult: FORMATION_DEF_UP, spdBonus: 0 },
  SwiftStrike: { kind: 'SwiftStrike', name: 'Swift Strike', description: '+3 SPD for all fighters', atkMult: NEUTRAL, defMult: NEUTRAL, spdBonus: FORMATION_SPD_UP },
  Balanced: { kind: 'Balanced', name: 'Balanced Squad', description: '+5% ATK and DEF for all fighters', atkMult: BALANCED_BONUS, defMult: BALANCED_BONUS, spdBonus: 0 },
  MixedArts: { kind: 'MixedArts', name: 'Mixed Arts', description: '+7% ATK and DEF from varied roles', atkMult: MIXED_BONUS, defMult: MIXED_BONUS, spdBonus: 0 },
};

export function detectFormation(teamUnits: Unit[]): FormationKind {
  const roles = teamUnits.map((u) => roleFor(getFamily(u.familyId)));
  const roleSet = new Set(roles);
  const counts = new Map<string, number>();
  roles.forEach((r) => counts.set(r, (counts.get(r) ?? 0) + 1));

  const maxCount = Math.max(...counts.values());
  const dominantRole = [...counts.entries()].find(([, c]) => c === maxCount)?.[0];

  if (maxCount >= DOMINANT_THRESHOLD && dominantRole === 'Assassin') return 'AllAttack';
  if (maxCount >= DOMINANT_THRESHOLD && dominantRole === 'Tank') return 'AllDefend';
  if (maxCount >= DOMINANT_THRESHOLD && (dominantRole === 'Assassin' || dominantRole === 'Blaster')) return 'SwiftStrike';
  if (roleSet.size >= DIVERSE_THRESHOLD) return 'MixedArts';
  return 'Balanced';
}

export function formationAbility(kind: FormationKind): FormationAbility {
  return FORMATION_TABLE[kind];
}
