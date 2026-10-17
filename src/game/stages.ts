import {
  GEMS_BOSS,
  GEMS_MINI_BOSS,
  NORMAL_GEM_AMOUNT,
  NORMAL_GEM_CHANCE,
  REPLAY_COIN_SHARE,
  SPINS_BOSS,
  SPINS_MINI_BOSS,
  SPINS_NORMAL,
  STAGES_PER_CHAPTER,
  TOTAL_STAGES,
  enemyCountForStage,
  enemyLevelForStage,
  enemyStarForStage,
  stageCoinReward,
} from './balance';
import { RARITIES, type Rarity, TEMPLATES, addItem, rollRarity } from './gear';
import { type Weather, arenaForStage } from './arenas';
import { FAMILIES } from './roster';
import { type Rng, defaultRng, seededRng } from './rng';
import type { SaveData } from './types';

export type StageKind = 'normal' | 'miniBoss' | 'boss';

export interface EnemySpec {
  familyId: string;
  star: number;
  level: number;
  rank: 'minion' | 'miniBoss' | 'boss';
}

export interface Stage {
  number: number;
  chapter: number;
  chapterName: string;
  kind: StageKind;
  enemies: EnemySpec[];
  coins: number;
  /** Shown instead of "Stage N" (Rival Tower floors). */
  label?: string;
  /** Special battle rule (Rival Tower floors). */
  rule?: BattleRule;
  /** Arena weather; story stages take it from their chapter. */
  weather?: Weather;
}

/**
 * max3: only your first three fighters (by pad) take part · fullSpecials: enemies start with full special bars
 * enemyShields: enemies start shielded · tough: enemies have 50% more HP
 */
export type BattleRule = 'max3' | 'fullSpecials' | 'enemyShields' | 'tough';

/** One name per chapter; the last chapter ends the game at the Vision Gate. */
export const CHAPTER_NAMES = [
  // Act I: The Wandering Spark
  'Cliffside Trials',
  'Red Dune Raiders',
  'Iron Legion',
  'Pale Star Armada',
  'Android Foundry',
  'Mountain of Rage',
  'Shattered Moon',
  'Tyrant Ascendant',
  'Rift of Echoes',
  'Demon Gate Siege',
  // Act II: The Perfect Organism
  'Swamp of Larvae',
  'Hive Cathedral',
  'The Perfect Games Arena',
  'Blossom Valley Raid',
  'Thunder Peaks',
  'Tournament of Masters',
  'Echo Kael Rising',
  'Crimson Throne',
  // Act III: Beyond the Cap
  'Starfall Expanse',
  'Frozen Citadel',
  'Gravity Wells',
  'Island of Old Masters',
  'Void Shores',
  'Clockwork Empire',
  'Sky Temple Ruins',
  'Abyssal Colosseum',
  'Twin Sun Desert',
  'Grimm Reborn',
  // Act IV: The Vision Gate
  'Dimension Rift',
  'Mirror Realm',
  'Hall of Fallen Kings',
  'Instinct Peaks',
  'Eclipse Fortress',
  'Zenith Trial',
  'Edge of Creation',
  'The Last Tournament',
  'Gate Guardians',
  'The Vision Gate',
];

export const FINAL_STAGE = TOTAL_STAGES;

export function stageKind(stage: number): StageKind {
  const pos = ((stage - 1) % STAGES_PER_CHAPTER) + 1;
  if (pos === STAGES_PER_CHAPTER) return 'boss';
  if (pos === STAGES_PER_CHAPTER / 2) return 'miniBoss';
  return 'normal';
}

const villains = FAMILIES.filter((f) => f.villain);

/** Stages are generated from their number, so the same stage always has the same enemies. */
export function getStage(number: number): Stage {
  const rng = seededRng(number * 7919);
  const chapter = Math.ceil(number / STAGES_PER_CHAPTER);
  const kind = stageKind(number);
  const level = enemyLevelForStage(number);
  const star = enemyStarForStage(number);
  const count = enemyCountForStage(number);
  const enemies: EnemySpec[] = [];

  if (kind !== 'normal') {
    // The last stage is always Kael, the Corrupted Echo, guarding the Vision Gate.
    const leader = number === TOTAL_STAGES ? villains.find((v) => v.id === 'kael')! : villains[(chapter - 1) % villains.length];
    enemies.push({
      familyId: leader.id,
      star: Math.min(21, star + (kind === 'boss' ? 1 : 0)),
      level: Math.min(400, level + (kind === 'boss' ? 6 : 3)),
      rank: kind,
    });
  }
  while (enemies.length < count) {
    const family = FAMILIES[Math.floor(rng() * FAMILIES.length)];
    const jitter = Math.floor(rng() * 5) - 2;
    enemies.push({ familyId: family.id, star, level: Math.max(1, level + jitter), rank: 'minion' });
  }

  return {
    number,
    chapter,
    chapterName: CHAPTER_NAMES[(chapter - 1) % CHAPTER_NAMES.length],
    kind,
    enemies,
    coins: stageCoinReward(number),
    weather: arenaForStage(number).weather,
  };
}

export function allStageNumbers(): number[] {
  return Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1);
}

export function isUnlocked(save: SaveData, stage: number): boolean {
  return stage <= save.clearedStage + 1 && stage <= TOTAL_STAGES;
}

export interface Rewards {
  firstClear: boolean;
  coins: number;
  gems: number;
  spins: number;
  /** Bosses and mini-bosses drop a piece of gear on the first clear. */
  gear?: { templateId: string; rarity: Rarity };
}

/**
 * First clears pay full coins, spins (1 / 5 mini-boss / 10 boss) and gem chances.
 * Replays pay 25% of the coins and nothing else.
 */
export function rewardsFor(save: SaveData, stageNumber: number, rng: Rng = defaultRng): Rewards {
  const stage = getStage(stageNumber);
  const firstClear = stageNumber > save.clearedStage;
  if (!firstClear) {
    return { firstClear, coins: Math.round(stage.coins * REPLAY_COIN_SHARE), gems: 0, spins: 0 };
  }
  let gems = 0;
  let spins = SPINS_NORMAL;
  if (stage.kind === 'boss') {
    gems = GEMS_BOSS;
    spins = SPINS_BOSS;
  } else if (stage.kind === 'miniBoss') {
    gems = GEMS_MINI_BOSS;
    spins = SPINS_MINI_BOSS;
  } else if (rng() < NORMAL_GEM_CHANCE) {
    gems = NORMAL_GEM_AMOUNT;
  }
  const rewards: Rewards = { firstClear, coins: stage.coins, gems, spins };
  if (stage.kind !== 'normal') {
    const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    let rarity = rollRarity(save.clearedStage, rng);
    const floor: Rarity = stage.kind === 'boss' ? 'rare' : 'uncommon';
    if (RARITIES.indexOf(rarity) < RARITIES.indexOf(floor)) rarity = floor;
    rewards.gear = { templateId: template.id, rarity };
  }
  return rewards;
}

export function applyRewards(save: SaveData, stageNumber: number, rewards: Rewards): SaveData {
  if (rewards.gear) save = addItem(save, rewards.gear.templateId, rewards.gear.rarity).save;
  return {
    ...save,
    coins: save.coins + rewards.coins,
    gems: save.gems + rewards.gems,
    spins: save.spins + rewards.spins,
    clearedStage: rewards.firstClear ? Math.max(save.clearedStage, stageNumber) : save.clearedStage,
  };
}
