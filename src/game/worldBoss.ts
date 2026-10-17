import { MAX_LEVEL, MAX_STARS, enemyLevelForStage, enemyStarForStage } from './balance';
import { addItem, TEMPLATES } from './gear';
import { statsFor } from './progression';
import { type Rng, defaultRng } from './rng';
import type { Stage } from './stages';
import { dayKey, hashString, weekKey } from './time';
import type { SaveData } from './types';

export const BOSS_ATTEMPTS_PER_DAY = 3;
export const BOSS_ROUNDS = 8;
/** The pool is this many times the boss's normal HP. */
const POOL_SIZE = 40;
const ROSTER = ['vorg', 'grimm', 'sylas', 'kael', 'mogra', 'nyx', 'grylas'];

export interface Milestone {
  share: number;
  label: string;
  reward: { spins?: number; gems?: number; gear?: 'epic' | 'legendary'; shards?: number };
}

export const MILESTONES: Milestone[] = [
  { share: 0.25, label: '25%', reward: { spins: 5 } },
  { share: 0.5, label: '50%', reward: { gems: 10 } },
  { share: 0.75, label: '75%', reward: { gear: 'epic', spins: 5 } },
  { share: 1, label: 'Defeated', reward: { gear: 'legendary', gems: 15, shards: 2 } },
];

/** This week's boss: the same for everyone, scaled to how far you are in the story. */
export function weeklyBoss(save: SaveData, week = weekKey()) {
  const familyId = ROSTER[hashString(week) % ROSTER.length];
  const stage = Math.max(10, save.clearedStage);
  const level = Math.min(MAX_LEVEL, enemyLevelForStage(stage) + 10);
  const star = Math.min(MAX_STARS, enemyStarForStage(stage) + 2);
  const pool = statsFor(familyId, star, level).hp * POOL_SIZE;
  return { familyId, level, star, pool };
}

/** Starts a new week or day when the calendar moves on. */
export function syncWorldBoss(save: SaveData, now = new Date()): SaveData {
  let wb = save.worldBoss;
  if (wb.week !== weekKey(now)) wb = { week: weekKey(now), damage: 0, day: dayKey(now), attempts: 0, claimed: [] };
  if (wb.day !== dayKey(now)) wb = { ...wb, day: dayKey(now), attempts: 0 };
  return wb === save.worldBoss ? save : { ...save, worldBoss: wb };
}

export function bossStage(save: SaveData): Stage {
  const boss = weeklyBoss(save, save.worldBoss.week || weekKey());
  const left = Math.max(1, boss.pool - save.worldBoss.damage);
  return {
    number: Math.max(10, save.clearedStage),
    chapter: 0,
    chapterName: 'Colosseum',
    kind: 'boss',
    enemies: [{ familyId: boss.familyId, star: boss.star, level: boss.level, rank: 'boss', hpPool: { max: boss.pool, left } }],
    coins: 0,
    label: 'World Boss',
    roundLimit: BOSS_ROUNDS,
    weather: 'clear',
  };
}

export function attemptsLeft(save: SaveData): number {
  return Math.max(0, BOSS_ATTEMPTS_PER_DAY - save.worldBoss.attempts);
}

/** Records one attempt's damage against the weekly pool. */
export function recordBossAttempt(save: SaveData, damage: number): SaveData {
  const boss = weeklyBoss(save, save.worldBoss.week);
  return {
    ...save,
    worldBoss: {
      ...save.worldBoss,
      attempts: save.worldBoss.attempts + 1,
      damage: Math.min(boss.pool, save.worldBoss.damage + Math.max(0, damage)),
    },
  };
}

export function bossProgress(save: SaveData): number {
  const boss = weeklyBoss(save, save.worldBoss.week || weekKey());
  return Math.min(1, save.worldBoss.damage / boss.pool);
}

export function claimMilestone(save: SaveData, index: number, rng: Rng = defaultRng): SaveData {
  const m = MILESTONES[index];
  if (!m) throw new Error('No such reward');
  if (save.worldBoss.claimed.includes(index)) throw new Error('Already claimed');
  if (bossProgress(save) < m.share) throw new Error('Not reached yet');
  let next: SaveData = {
    ...save,
    spins: save.spins + (m.reward.spins ?? 0),
    gems: save.gems + (m.reward.gems ?? 0),
    worldBoss: { ...save.worldBoss, claimed: [...save.worldBoss.claimed, index] },
  };
  if (m.reward.gear) next = addItem(next, TEMPLATES[Math.floor(rng() * TEMPLATES.length)].id, m.reward.gear).save;
  if (m.reward.shards) {
    const star = Math.max(2, ...next.units.map((u) => u.star));
    next = { ...next, shards: { ...next.shards, [star]: (next.shards[star] ?? 0) + m.reward.shards } };
  }
  return next;
}
