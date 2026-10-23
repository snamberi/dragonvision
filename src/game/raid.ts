import { MAX_LEVEL, MAX_STARS, enemyLevelForStage, enemyStarForStage } from './balance';
import { statsFor } from './progression';
import type { Stage } from './stages';
import { raidSetFor } from './bossSets';
import { addItem, rollSetPiece } from './gear';
import { seededRng } from './rng';
import { hashString } from './time';
import type { RaidState, SaveData } from './types';

export const RAID_PHASES = 5;
export const RAID_ROUNDS = 6;
export const RAID_GEMS_PER_PHASE = 5;
const RAID_DAILY_ATTEMPTS = 3;
/** The pool is this many times the boss's normal HP. */
const RAID_POOL_SIZE = 30;
const RAID_LEVEL_BONUS = 5;
const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const WEEK_PAD_LEN = 2;
const ISO_DATE_LEN = 10;

const RAID_BOSSES = [
  { name: 'Inferno Titan', familyId: 'vorg' },
  { name: 'Void Colossus', familyId: 'nyx' },
  { name: 'Glacial Warden', familyId: 'mogra' },
  { name: 'Storm Sovereign', familyId: 'grylas' },
] as const;

export function weekKey(date: Date): string {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((date.getTime() - jan1.getTime()) / MS_PER_DAY + jan1.getDay() + 1) / DAYS_PER_WEEK);
  return `${year}-W${week.toString().padStart(WEEK_PAD_LEN, '0')}`;
}

function raidBossOf(week: string) {
  const hash = week.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return RAID_BOSSES[hash % RAID_BOSSES.length];
}

export function raidBossName(week: string): string {
  return raidBossOf(week).name;
}

function today(): string {
  return new Date().toISOString().slice(0, ISO_DATE_LEN);
}

function raidState(save: SaveData, week: string): RaidState | null {
  return save.raid?.week === week ? save.raid : null;
}

/** This week's boss, scaled to story progress. The HP pool is locked in at the first attempt. */
export function raidBoss(save: SaveData, week = weekKey(new Date())) {
  const { familyId, name } = raidBossOf(week);
  const stage = Math.max(10, save.clearedStage);
  const level = Math.min(MAX_LEVEL, enemyLevelForStage(stage) + RAID_LEVEL_BONUS);
  const star = Math.min(MAX_STARS, enemyStarForStage(stage) + 1);
  const pool = raidState(save, week)?.pool ?? statsFor(familyId, star, level).hp * RAID_POOL_SIZE;
  return { familyId, name, level, star, pool };
}

export function raidStage(save: SaveData, week = weekKey(new Date())): Stage {
  const boss = raidBoss(save, week);
  const dealt = raidState(save, week)?.totalDamage ?? 0;
  return {
    number: Math.max(10, save.clearedStage),
    chapter: 0,
    chapterName: 'Boss Raid',
    kind: 'boss',
    dominantRole: 'Tank',
    enemies: [{ familyId: boss.familyId, star: boss.star, level: boss.level, rank: 'boss', hpPool: { max: boss.pool, left: Math.max(1, boss.pool - dealt) } }],
    coins: 0,
    label: `Boss Raid · ${boss.name}`,
    roundLimit: RAID_ROUNDS,
    weather: 'clear',
  };
}

export function raidAttemptsLeft(save: SaveData, week = weekKey(new Date()), day = today()): number {
  const state = raidState(save, week);
  const used = state?.attemptsDay === day ? (state.attemptsCount ?? 0) : 0;
  return Math.max(0, RAID_DAILY_ATTEMPTS - used);
}

export function canRaid(save: SaveData): boolean {
  return raidAttemptsLeft(save) > 0;
}

/** The week's raid boss set. */
export function raidSet(week = weekKey(new Date())) {
  return raidSetFor(raidBossName(week));
}

/** Each newly cleared phase drops one piece of the week's raid set (seeded per week and phase). */
function raidSetPieces(save: SaveData, week: string, phases: number[]): SaveData {
  const set = raidSet(week);
  if (!set) return save;
  return phases.reduce((acc, phase) => {
    const drop = rollSetPiece(set, acc.clearedStage, seededRng(hashString(`raid:${week}:${phase}`)));
    return addItem(acc, drop.templateId, drop.rarity).save;
  }, save);
}

/** Adds one attempt's damage; every fifth of the pool is a phase worth gems. */
export function attemptRaid(save: SaveData, damageDealt: number, week = weekKey(new Date()), day = today()): SaveData {
  const prev = raidState(save, week);
  const pool = raidBoss(save, week).pool;
  const newTotal = Math.min(pool, (prev?.totalDamage ?? 0) + damageDealt);
  const newPhase = Math.min(RAID_PHASES, Math.floor(newTotal / (pool / RAID_PHASES)));
  const prevCleared = prev?.clearedPhases ?? [];
  const newlyCleared = Array.from({ length: RAID_PHASES }, (_, i) => i + 1).filter((p) => p <= newPhase && !prevCleared.includes(p));
  const attemptsCount = prev?.attemptsDay === day ? (prev.attemptsCount ?? 0) : 0;
  const withGear = raidSetPieces(save, week, newlyCleared);
  return {
    ...withGear,
    gems: save.gems + newlyCleared.length * RAID_GEMS_PER_PHASE,
    raid: {
      week,
      phase: newPhase,
      totalDamage: newTotal,
      clearedPhases: [...prevCleared, ...newlyCleared],
      pool,
      attemptsDay: day,
      attemptsCount: attemptsCount + 1,
    },
  };
}
