import { GRAVITY_MAX_LEVEL, GRAVITY_PER_LEVEL, gravityCost } from './balance';
import type { Role } from './roster';
import type { SaveData } from './types';

export const ROLES: Role[] = ['Tank', 'Assassin', 'Blaster', 'Support', 'Drainer'];

export function gravityLevel(save: SaveData, role: Role): number {
  return save.gravity[role] ?? 0;
}

/** Stat multiplier the Gravity Chamber gives every fighter of a role. */
export function gravityMultiplier(save: SaveData, role: Role): number {
  return 1 + gravityLevel(save, role) * GRAVITY_PER_LEVEL;
}

export function roleBonuses(save: SaveData): Record<Role, number> {
  return Object.fromEntries(ROLES.map((r) => [r, gravityMultiplier(save, r)])) as Record<Role, number>;
}

export function upgradeGravity(save: SaveData, role: Role): SaveData {
  const level = gravityLevel(save, role);
  if (level >= GRAVITY_MAX_LEVEL) throw new Error('Already at max gravity');
  const cost = gravityCost(level);
  if (cost > save.coins) throw new Error('Not enough coins');
  return { ...save, coins: save.coins - cost, gravity: { ...save.gravity, [role]: level + 1 } };
}
