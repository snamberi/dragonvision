import {
  DAILY_BOOST_MULT,
  DAILY_BOOST_WINS,
  ESSENCE_PER_BOSS,
  GEMS_BOSS,
  GEMS_MINI_BOSS,
  NORMAL_GEM_AMOUNT,
  NORMAL_GEM_CHANCE,
  REPLAY_COIN_SHARE,
  SPINS_BOSS,
  SPINS_MINI_BOSS,
  SPINS_NORMAL,
  LEVEL_CAP_STAGE,
  POST_CAP_BOSS_CRYSTALS,
  STAGES_PER_CHAPTER,
  TOTAL_STAGES,
  WALL_CRYSTALS,
  WALL_ESSENCE,
  enemyCountForStage,
  enemyLevelForStage,
  enemyStarForStage,
  isWallStage,
  stageCoinReward,
} from './balance';
import { type MaterialReward, grantMaterials } from './materials';
import { type TraitId, chapterTrait } from './encounters';
import { RARITIES, type Rarity, TEMPLATES, addItem, rollRarity, rollSetPiece } from './gear';
import { wallSetFor } from './bossSets';
import { type Weather, arenaForStage } from './arenas';
import { PIECE_BOSS_CHANCE, addPieces, randomLegendId } from './legendary';
import { FAMILIES, type Role, roleFor } from './roster';
import { type Rng, defaultRng, seededRng } from './rng';
import { dayKey } from './time';
import type { SaveData } from './types';

export type StageKind = 'normal' | 'miniBoss' | 'boss';

export interface EnemySpec {
  familyId: string;
  star: number;
  level: number;
  rank: 'minion' | 'miniBoss' | 'boss';
  /** Shared HP pool (world boss): max and what's left. */
  hpPool?: { max: number; left: number };
}

export interface Stage {
  number: number;
  chapter: number;
  chapterName: string;
  kind: StageKind;
  /** The enemy class that dominates this chapter — tells players what counter to bring. */
  dominantRole: Role;
  /** Chapter-wide enemy trait (story stages only, from chapter 3). */
  trait?: TraitId;
  enemies: EnemySpec[];
  coins: number;
  /** Shown instead of "Stage N" (Rival Tower floors). */
  label?: string;
  /** Special battle rule (Rival Tower floors). */
  rule?: BattleRule;
  /** Arena weather; story stages take it from their chapter. */
  weather?: Weather;
  /** Timed fights end after this many rounds. */
  roundLimit?: number;
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

const ROLE_CYCLE: Role[] = ['Tank', 'Assassin', 'Blaster', 'Drainer', 'Support'];
function chapterDominantRole(chapter: number): Role {
  return ROLE_CYCLE[(chapter - 1) % ROLE_CYCLE.length];
}

/** Stages are generated from their number, so the same stage always has the same enemies. */
export function getStage(number: number): Stage {
  const rng = seededRng(number * 7919);
  const chapter = Math.ceil(number / STAGES_PER_CHAPTER);
  const dominantRole = chapterDominantRole(chapter);
  const dominantFamilies = FAMILIES.filter((f) => !f.villain && roleFor(f) === dominantRole);
  const otherFamilies = FAMILIES.filter((f) => !f.villain && roleFor(f) !== dominantRole);
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
    // 65% chance to pick from this chapter's dominant role for composition pressure.
    const pool = dominantFamilies.length > 0 && rng() < 0.65 ? dominantFamilies : otherFamilies;
    const family = pool[Math.floor(rng() * pool.length)];
    const jitter = Math.floor(rng() * 5) - 2;
    enemies.push({ familyId: family.id, star, level: Math.max(1, level + jitter), rank: 'minion' });
  }

  return {
    number,
    chapter,
    chapterName: CHAPTER_NAMES[(chapter - 1) % CHAPTER_NAMES.length],
    kind,
    dominantRole,
    ...(chapterTrait(chapter) && { trait: chapterTrait(chapter) }),
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

export interface Rewards extends MaterialReward {
  firstClear: boolean;
  coins: number;
  gems: number;
  spins: number;
  /** Bosses and mini-bosses drop a piece of gear on the first clear. */
  gear?: { templateId: string; rarity: Rarity };
  /** Stage bosses sometimes drop a legendary piece, on any win. */
  piece?: string;
  /** Set when the daily boost doubled the coins; the day it counts against. */
  boostDay?: string;
}

/** Extra gems awarded on first clear of key milestone stages to celebrate progress. */
const MILESTONE_GEMS: Record<number, number> = {
  10: 5, 20: 10, 50: 15, 100: 25, 180: 35, 230: 35, 280: 45, 330: 45, 380: 60,
};

/**
 * First clears pay full coins, spins (1 / 5 mini-boss / 10 boss) and gem chances.
 * Replays pay REPLAY_COIN_SHARE of the coins and nothing else.
 */
/** Chance a wall boss drops a piece of its set on a replay. */
export const WALL_SET_REPLAY_CHANCE = 0.25;

export function rewardsFor(save: SaveData, stageNumber: number, rng: Rng = defaultRng): Rewards {
  const stage = getStage(stageNumber);
  const firstClear = stageNumber > save.clearedStage;
  const piece = stage.kind === 'boss' && rng() < PIECE_BOSS_CHANCE ? randomLegendId(rng) : undefined;
  // Wall bosses drop their own set: always on the first clear, sometimes on replays.
  const wallSet = wallSetFor(stageNumber);
  const setPiece = wallSet && (firstClear || rng() < WALL_SET_REPLAY_CHANCE) ? rollSetPiece(wallSet, save.clearedStage, rng) : undefined;
  if (!firstClear) {
    return { firstClear, coins: Math.round(stage.coins * REPLAY_COIN_SHARE), gems: 0, spins: 0, ...(piece && { piece }), ...(setPiece && { gear: setPiece }) };
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
  gems += MILESTONE_GEMS[stageNumber] ?? 0;
  const rewards: Rewards = { firstClear, coins: stage.coins, gems, spins, ...(piece && { piece }) };
  if (setPiece) rewards.gear = setPiece;
  else if (stage.kind !== 'normal') {
    const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    let rarity = rollRarity(save.clearedStage, rng);
    const floor: Rarity = stage.kind === 'boss' ? 'rare' : 'uncommon';
    if (RARITIES.indexOf(rarity) < RARITIES.indexOf(floor)) rarity = floor;
    rewards.gear = { templateId: template.id, rarity };
  }
  if (stage.kind === 'boss') rewards.essence = ESSENCE_PER_BOSS + (isWallStage(stageNumber) ? WALL_ESSENCE : 0);
  const crystals = (isWallStage(stageNumber) ? WALL_CRYSTALS : 0) + (stage.kind === 'boss' && stageNumber > LEVEL_CAP_STAGE ? POST_CAP_BOSS_CRYSTALS : 0);
  if (crystals > 0) rewards.crystals = crystals;
  return rewards;
}

/** Story wins left today that still pay double coins. */
export function dailyBoostLeft(save: SaveData, day = dayKey()): number {
  const used = save.dailyBoost?.day === day ? save.dailyBoost.wins : 0;
  return Math.max(0, DAILY_BOOST_WINS - used);
}

/** Doubles the coins of the first few story wins each day, first clears and replays alike. */
export function withDailyBoost(save: SaveData, rewards: Rewards, day = dayKey()): Rewards {
  if (dailyBoostLeft(save, day) === 0) return rewards;
  return { ...rewards, coins: rewards.coins * DAILY_BOOST_MULT, boostDay: day };
}

export function applyRewards(save: SaveData, stageNumber: number, rewards: Rewards): SaveData {
  if (rewards.boostDay) {
    const wins = save.dailyBoost?.day === rewards.boostDay ? save.dailyBoost.wins : 0;
    save = { ...save, dailyBoost: { day: rewards.boostDay, wins: wins + 1 } };
  }
  if (rewards.gear) save = addItem(save, rewards.gear.templateId, rewards.gear.rarity).save;
  if (rewards.piece) save = addPieces(save, rewards.piece);
  save = grantMaterials(save, rewards);
  return {
    ...save,
    coins: save.coins + rewards.coins,
    gems: save.gems + rewards.gems,
    spins: save.spins + rewards.spins,
    clearedStage: rewards.firstClear ? Math.max(save.clearedStage, stageNumber) : save.clearedStage,
  };
}
