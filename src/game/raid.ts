import type { SaveData } from './types';

export const RAID_PHASES = 5;
export const RAID_HP_PER_PHASE = 50_000;
const RAID_GEMS_PER_PHASE = 5;
const RAID_DAILY_ATTEMPTS = 3;
const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;
const WEEK_PAD_LEN = 2;
const ISO_DATE_LEN = 10;

const RAID_BOSS_NAMES = ['Inferno Titan', 'Void Colossus', 'Glacial Warden', 'Storm Sovereign'] as const;
const RAID_BOSS_COUNT = RAID_BOSS_NAMES.length;

export function weekKey(date: Date): string {
  const year = date.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((date.getTime() - jan1.getTime()) / MS_PER_DAY + jan1.getDay() + 1) / DAYS_PER_WEEK);
  return `${year}-W${week.toString().padStart(WEEK_PAD_LEN, '0')}`;
}

export function raidBossName(week: string): string {
  const hash = week.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return RAID_BOSS_NAMES[hash % RAID_BOSS_COUNT];
}

export function canRaid(save: SaveData): boolean {
  const today = new Date().toISOString().slice(0, ISO_DATE_LEN);
  const week = weekKey(new Date());
  const state = save.raid;
  if (!state || state.week !== week) return true;
  const ext = state as typeof state & { attemptsDay?: string; attemptsCount?: number };
  if (ext.attemptsDay !== today) return true;
  return (ext.attemptsCount ?? 0) < RAID_DAILY_ATTEMPTS;
}

export function attemptRaid(save: SaveData, damageDealt: number): SaveData {
  const week = weekKey(new Date());
  const today = new Date().toISOString().slice(0, ISO_DATE_LEN);
  const prev = save.raid?.week === week ? save.raid : null;
  const prevExt = prev as (typeof prev) & { attemptsDay?: string; attemptsCount?: number } | null;
  const prevDmg = prev?.totalDamage ?? 0;
  const prevCleared = prev?.clearedPhases ?? [];
  const prevPhase = prev?.phase ?? 0;

  const newTotal = prevDmg + damageDealt;
  const newPhase = Math.min(RAID_PHASES, Math.floor(newTotal / RAID_HP_PER_PHASE));

  const newlyCleared = Array.from(
    { length: Math.max(0, newPhase - prevPhase) },
    (_, k) => prevPhase + k + 1,
  ).filter((p) => !prevCleared.includes(p));

  const gemsEarned = newlyCleared.length * RAID_GEMS_PER_PHASE;
  const attemptsCount = prevExt?.attemptsDay === today ? (prevExt.attemptsCount ?? 0) : 0;

  return {
    ...save,
    gems: save.gems + gemsEarned,
    raid: {
      week,
      phase: newPhase,
      totalDamage: newTotal,
      clearedPhases: [...prevCleared, ...newlyCleared],
      attemptsDay: today,
      attemptsCount: attemptsCount + 1,
    } as typeof save.raid,
  };
}
