import { KI_MAX, MAX_LEVEL, MAX_STARS, enemyLevelForStage, enemyStarForStage } from './balance';
import { type BattleState, specialNeed } from './battle';
import { FAMILIES, getFamily, roleFor } from './roster';
import { seededRng } from './rng';
import type { EnemySpec, Stage } from './stages';
import { hashString } from './time';
import type { SaveData, Unit } from './types';

export const DUNGEON_KEY_COST = 1;
export const DUNGEON_DAILY_ATTEMPTS = 3;
const DUNGEON_REWARD_GEMS = 10;
const DUNGEON_REWARD_RELIC = 1;

const DUNGEON_RULES = ['Healers Only', 'No Specials', 'Double Speed', 'Iron Defense', 'Glass Cannon'] as const;
const DUNGEON_RULES_LEN = DUNGEON_RULES.length;

export const dungeonRewards = { gems: DUNGEON_REWARD_GEMS, relicShard: DUNGEON_REWARD_RELIC } as const;

export type DungeonRule = (typeof DUNGEON_RULES)[number];

export const DUNGEON_RULE_TEXT: Record<DungeonRule, string> = {
  'Healers Only': 'Only your Support and Drainer fighters may enter.',
  'No Specials': 'Nobody can use specials or combos — basics and Ki only.',
  'Double Speed': 'Everyone starts with +40 Ki and specials half charged.',
  'Iron Defense': 'Enemies have double defense.',
  'Glass Cannon': 'Everyone hits 50% harder but has 40% less HP.',
};

const HEALER_ROLES = new Set(['Support', 'Drainer']);
const DUNGEON_ENEMIES = 5;
const DUNGEON_LEVEL_BONUS = 4;
const DOUBLE_SPEED_KI = 40;
const IRON_DEFENSE_MULT = 2;
const GLASS_ATK_MULT = 1.5;
const GLASS_HP_MULT = 0.6;

export function dailyDungeonRule(day: string): DungeonRule {
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

/** The day's dungeon: a villain leader and four guards, a little above your story progress. */
export function dungeonStage(save: SaveData, day: string): Stage {
  const rng = seededRng(hashString(`dungeon:${day}`));
  const stageEq = Math.max(5, save.clearedStage);
  const level = Math.min(MAX_LEVEL, enemyLevelForStage(stageEq) + DUNGEON_LEVEL_BONUS);
  const star = Math.min(MAX_STARS, enemyStarForStage(stageEq));
  const villains = FAMILIES.filter((f) => f.villain);
  const guards = FAMILIES.filter((f) => !f.villain);
  const leader = villains[Math.floor(rng() * villains.length)];
  const enemies: EnemySpec[] = [
    { familyId: leader.id, star, level, rank: 'miniBoss' },
    ...Array.from({ length: DUNGEON_ENEMIES - 1 }, () => ({
      familyId: guards[Math.floor(rng() * guards.length)].id,
      star,
      level,
      rank: 'minion' as const,
    })),
  ];
  return {
    number: stageEq,
    chapter: 0,
    chapterName: 'Daily Dungeon',
    kind: 'miniBoss',
    dominantRole: 'Tank',
    enemies,
    coins: 0,
    label: `Dungeon · ${dailyDungeonRule(day)}`,
    weather: 'clear',
  };
}

/** Healers Only keeps just Support and Drainer fighters on their pads. */
export function dungeonSquad(team: (Unit | null)[], rule: DungeonRule): (Unit | null)[] {
  if (rule !== 'Healers Only') return team;
  return team.map((u) => (u && HEALER_ROLES.has(roleFor(getFamily(u.familyId))) ? u : null));
}

export function applyDungeonRule(state: BattleState, rule: DungeonRule): BattleState {
  const fighters = state.fighters.map((f) => {
    switch (rule) {
      case 'No Specials':
        return { ...f, charge: 0, specialSpent: true };
      case 'Double Speed':
        return { ...f, ki: Math.min(KI_MAX, f.ki + DOUBLE_SPEED_KI), charge: Math.max(f.charge, Math.ceil(specialNeed(f) / 2)) };
      case 'Iron Defense':
        return f.side === 'enemy' ? { ...f, def: f.def * IRON_DEFENSE_MULT } : f;
      case 'Glass Cannon': {
        const maxHp = Math.max(1, Math.round(f.maxHp * GLASS_HP_MULT));
        return { ...f, atk: Math.round(f.atk * GLASS_ATK_MULT), maxHp, hp: Math.min(f.hp, maxHp), shield: Math.min(f.shield, maxHp) };
      }
      default:
        return f;
    }
  });
  return { ...state, fighters };
}
