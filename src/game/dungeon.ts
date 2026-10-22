import type { SaveData } from './types';

export const DUNGEON_KEY_COST = 1;
export const DUNGEON_DAILY_ATTEMPTS = 3;
const DUNGEON_REWARD_GEMS = 10;
const DUNGEON_REWARD_RELIC = 1;

const DUNGEON_RULES = ['Healers Only', 'No Specials', 'Double Speed', 'Iron Defense', 'Glass Cannon'] as const;
const DUNGEON_RULES_LEN = DUNGEON_RULES.length;

export const dungeonRewards = { gems: DUNGEON_REWARD_GEMS, relicShard: DUNGEON_REWARD_RELIC } as const;

export function dailyDungeonRule(day: string): string {
  const hash = day.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return DUNGEON_RULES[hash % DUNGEON_RULES_LEN];
}

export function canAttemptDungeon(save: SaveData, day: string): boolean {
  if (save.materials.dungeonKey < DUNGEON_KEY_COST) return false;
  const state = save.dungeon;
  if (!state || state.day !== day) return true;
  if (state.cleared) return false;
  return state.attempts < DUNGEON_DAILY_ATTEMPTS;
}

export function startDungeon(save: SaveData, day: string): SaveData {
  if (!canAttemptDungeon(save, day)) throw new Error('Cannot attempt dungeon now');
  const prev = save.dungeon;
  const attempts = (prev?.day === day ? prev.attempts : 0) + 1;
  return {
    ...save,
    materials: { ...save.materials, dungeonKey: save.materials.dungeonKey - DUNGEON_KEY_COST },
    dungeon: { day, rule: dailyDungeonRule(day), cleared: false, attempts },
  };
}

export function clearDungeon(save: SaveData, day: string): SaveData {
  const state = save.dungeon;
  if (!state || state.day !== day || state.cleared) throw new Error('No active dungeon run to clear');
  return {
    ...save,
    gems: save.gems + DUNGEON_REWARD_GEMS,
    materials: { ...save.materials, relicShard: save.materials.relicShard + DUNGEON_REWARD_RELIC },
    dungeon: { ...state, cleared: true },
  };
}
