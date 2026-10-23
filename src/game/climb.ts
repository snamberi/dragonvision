import { enemyCountForStage, enemyLevelForStage, enemyStarForStage } from './balance';
import { FAMILIES } from './roster';
import { weekKey } from './time';
import type { EnemySpec, Stage } from './stages';
import type { SaveData } from './types';

const COIN_BASE = 40;
const COIN_PER_FLOOR = 15;
const GEM_MILESTONE = 10;
export const CLIMB_HISTORY_WEEKS = 8;
/** Paid once a week, on the floor that passes last week's best. */
export const BEAT_LAST_WEEK_REWARD = { gems: 10, spins: 5 } as const;

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

export function climbStage(floor: number): Stage {
  return {
    number: Math.max(1, floor * 2),
    chapter: 0,
    chapterName: 'Infinite Climb',
    kind: 'normal',
    dominantRole: 'Tank',
    enemies: climbEnemies(floor),
    coins: climbReward(floor).coins,
    label: `Climb ${floor}F`,
    weather: 'clear',
  };
}

export function climbReward(floor: number): { coins: number; gems: number } {
  const coins = COIN_BASE + floor * COIN_PER_FLOOR;
  const gems = floor % GEM_MILESTONE === 0 ? floor / GEM_MILESTONE : 0;
  return { coins, gems };
}

/** Rolls a finished week into the history when a new week starts. */
export function syncClimbWeek(save: SaveData, week = climbWeekKey()): SaveData {
  if (save.climbWeek === week) return save;
  const best = save.climbBest ?? 0;
  const history = save.climbHistory ?? [];
  const nextHistory = save.climbWeek && best > 0 ? [...history, { week: save.climbWeek, best }].slice(-CLIMB_HISTORY_WEEKS) : history;
  return { ...save, climbWeek: week, climbBest: 0, climbHistory: nextHistory };
}

export function lastWeekBest(save: SaveData): number {
  return save.climbHistory?.at(-1)?.best ?? 0;
}

/** A won floor: new floors raise this week's best and pay out; replays pay nothing. */
export function winClimbFloor(save: SaveData, floor: number, week = climbWeekKey()): SaveData {
  const s = syncClimbWeek(save, week);
  const best = s.climbBest ?? 0;
  if (floor <= best) return s;
  const r = climbReward(floor);
  const target = lastWeekBest(s);
  const beat = target > 0 && best <= target && floor > target;
  return {
    ...s,
    climbBest: floor,
    coins: s.coins + r.coins,
    gems: s.gems + r.gems + (beat ? BEAT_LAST_WEEK_REWARD.gems : 0),
    spins: s.spins + (beat ? BEAT_LAST_WEEK_REWARD.spins : 0),
  };
}
