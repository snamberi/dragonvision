import { enemyCountForStage, enemyLevelForStage, enemyStarForStage } from './balance';
import { FAMILIES } from './roster';
import { weekKey } from './time';
import type { EnemySpec } from './stages';
import type { SaveData } from './types';

const COIN_BASE = 40;
const COIN_PER_FLOOR = 15;
const GEM_MILESTONE = 10;

export function climbWeekKey(): string {
  return weekKey();
}

export function climbEnemies(floor: number): EnemySpec[] {
  const stageEq = Math.max(1, floor * 2);
  const level = enemyLevelForStage(stageEq);
  const star = enemyStarForStage(stageEq);
  const count = Math.min(enemyCountForStage(stageEq), 5);
  const pool = FAMILIES.filter((f) => !f.villain);
  return Array.from({ length: count }, (_, i) => {
    const fam = pool[(floor * 3 + i * 7) % pool.length];
    return { familyId: fam.id, star, level, rank: 'minion' as const };
  });
}

export function climbReward(floor: number): { coins: number; gems: number } {
  const coins = COIN_BASE + floor * COIN_PER_FLOOR;
  const gems = floor % GEM_MILESTONE === 0 ? floor / GEM_MILESTONE : 0;
  return { coins, gems };
}

export function recordClimbFloor(save: SaveData, floor: number): SaveData {
  const week = climbWeekKey();
  const resetWeek = save.climbWeek !== week;
  const prev = resetWeek ? 0 : (save.climbBest ?? 0);
  return {
    ...save,
    climbBest: Math.max(prev, floor),
    climbWeek: week,
  };
}
