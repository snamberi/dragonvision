// Every tunable number in the game lives here so balancing never means hunting through logic.

export const MAX_LEVEL = 400;
export const MAX_STARS = 21;
/** Levels per star tier: a 2★ fighter is summoned between level 20 and 40, evolves at 40, etc. */
export const LEVELS_PER_STAR = 20;

/** Level wall: a fighter can't level past star × 20 until it evolves (21★ stays capped at 400). */
export function levelCap(star: number): number {
  return Math.min(MAX_LEVEL, star * LEVELS_PER_STAR);
}
export const DUPLICATES_TO_EVOLVE = 2;
export const MAX_TEAM_SIZE = 5;

export const STARTING_COINS = 500;
export const STARTING_GEMS = 20;
export const STARTING_SPINS = 5;

/** Coins to go from `level` to `level + 1`. */
export function levelUpCost(level: number): number {
  return Math.round(8 + 2 * Math.pow(level, 1.45));
}

/** Stat growth. Stars give a multiplier on top of levels. */
export const STAT_PER_LEVEL = 0.06;
export const STAT_PER_STAR = 0.12;

/** Gem price to reset a fighter's purchased levels. */
export const RESET_GEM_COST = 3;

// --- Summoning ---
/** Relative chance of each star tier: star s has weight STAR_DECAY^(s-1). */
export const SUMMON_STAR_DECAY = 0.62;
/** Focused character's family weight multiplier (others stay at 1). */
export const FOCUS_MULTIPLIER = 5;
/** The Fortune Teller's lucky fighter of the day is this much more likely. */
export const LUCKY_MULTIPLIER = 3;

// --- Stages ---
export const TOTAL_STAGES = 380;
/** Enemies hit the level 400 cap here; later stages grow through stars and raw strength instead. */
export const LEVEL_CAP_STAGE = 180;
export const STAGES_PER_CHAPTER = 10;
export const SPINS_NORMAL = 1;
export const SPINS_MINI_BOSS = 5;
export const SPINS_BOSS = 10;
export const GEMS_MINI_BOSS = 5;
export const GEMS_BOSS = 15;
export const NORMAL_GEM_CHANCE = 0.04;
export const NORMAL_GEM_AMOUNT = 1;
export const REPLAY_COIN_SHARE = 0.25;

// --- Collection cap ---
export const BASE_COLLECTION_CAP = 250;
export const UPGRADE_COLLECTION_COST = 500;
export const BASE_GEAR_SLOTS = 20;
export const UPGRADE_STORAGE_COST = 300;
export const MAX_COLLECTION_UPGRADES = 10;
export const MAX_STORAGE_UPGRADES = 10;
/** Extra slots per collection upgrade level. */
export const COLLECTION_SLOTS_PER_UPGRADE = 10;
/** Extra gear slots per storage upgrade level. */
export const GEAR_SLOTS_PER_UPGRADE = 5;

// --- Dragon Fate system ---
/** Fate bar starts here; rises each pull toward FATE_MAX. */
export const FATE_START = 0;
/** Fate bar ceiling. */
export const FATE_MAX = 100;
/** Points added per normal (non-Lucky, non-Rage) pull. */
export const FATE_PER_PULL = 4;
/** At this Fate level Dragon Rage triggers: next pull guaranteed Rare+. */
export const FATE_RAGE_THRESHOLD = 56;
/** Fate drained when Dragon Rage fires. */
export const FATE_RAGE_DRAIN = 56;
/** Base Lucky Pull chance per pull (7 %). */
export const LUCKY_PULL_CHANCE = 0.07;
/** Lucky Pull chance bonus per 5 pulls without one. */
export const LUCKY_PULL_BONUS_PER_5 = 0.005;
/** Lucky Pull: take the better of two star rolls. */
export const LUCKY_PULL_ROLLS = 2;
/** On a 10-pull, this pull index (0-based) gets a secret +10 Fate boost. */
export const TEN_PULL_FATE_BOOST_INDEX = 9;
export const TEN_PULL_FATE_BOOST = 10;
const TIER_RATE_COMMON = 68;
const TIER_RATE_RARE = 22;
const TIER_RATE_EPIC = 8.5;
const TIER_RATE_CRYSTAL = 1.5;
/** Tier drop rate weights: common / rare / epic / crystal. */
export const TIER_RATES: Record<string, number> = { common: TIER_RATE_COMMON, rare: TIER_RATE_RARE, epic: TIER_RATE_EPIC, crystal: TIER_RATE_CRYSTAL };
/** Dragon Rage minimum tier. */
export const RAGE_MIN_TIER: string = 'rare';

// --- Legacy pity (kept for migration reference) ---
export const PITY_THRESHOLD = 70;

export function enemyLevelForStage(stage: number): number {
  return Math.min(MAX_LEVEL, Math.round(1 + 2.2 * (stage - 1)));
}

/** Enemy star tier lags behind its level so players are not walled by duplicates. */
export function enemyStarForLevel(level: number): number {
  return Math.max(1, Math.min(MAX_STARS, Math.floor(level / 30)));
}

/** Past the level cap, enemies gain a star every 25 stages, reaching 21★ by the end. */
export function enemyStarForStage(stage: number): number {
  const fromLevel = enemyStarForLevel(enemyLevelForStage(stage));
  if (stage <= LEVEL_CAP_STAGE) return fromLevel;
  return Math.min(MAX_STARS, fromLevel + 1 + Math.floor((stage - LEVEL_CAP_STAGE - 1) / 25));
}

/** The first stages are gentler while the player only has one or two fighters. */
/**
 * Wall stages: act-gate bosses far stronger than the stages around them. Passing one takes a real
 * upgrade (an evolution, better gear, Gravity levels), not just another level-up.
 */
export const WALL_STAGES: Record<number, number> = { 50: 1.2, 100: 1.3, 180: 1.4, 230: 1.3, 280: 1.45, 330: 1.35, 380: 1.6 };

export function isWallStage(stage: number): boolean {
  return stage in WALL_STAGES;
}

/** Past the level cap, enemies get stronger in a step at the start of every chapter. */
const POST_CAP_STEP_PER_CHAPTER = 0.04;

export function enemyStrengthForStage(stage: number): number {
  return baseEnemyStrength(stage) * (WALL_STAGES[stage] ?? 1);
}

export function baseEnemyStrength(stage: number): number {
  if (stage <= 5) return 0.6 + stage * 0.06;
  if (stage > LEVEL_CAP_STAGE) {
    const chaptersPastCap = Math.floor((stage - LEVEL_CAP_STAGE - 1) / STAGES_PER_CHAPTER) + 1;
    return 1.5 + chaptersPastCap * POST_CAP_STEP_PER_CHAPTER;
  }
  // Scales from 1.0 at stage 6 up to 1.5 at LEVEL_CAP_STAGE for mid-game difficulty.
  return 1 + (stage - 5) * (0.5 / (LEVEL_CAP_STAGE - 5));
}

export function enemyCountForStage(stage: number): number {
  if (stage <= 2) return 1;
  if (stage <= 5) return 2;
  if (stage <= 8) return 3;
  if (stage <= 11) return 4;
  return MAX_TEAM_SIZE;
}

export function stageCoinReward(stage: number): number {
  const postGame = 1 + Math.max(0, stage - LEVEL_CAP_STAGE) * 0.01;
  return Math.round((6 * levelUpCost(enemyLevelForStage(stage)) + 40) * postGame);
}

// --- Battle ---
export const KI_MAX = 100;
export const KI_START = 20;
export const KI_CHARGE = 40;
export const KI_PER_ATTACK = 10;
export const KI_BLAST_COST = 30;
export const ATTACK_POWER = 1;
export const KI_BLAST_POWER = 1.7;
export const GUARD_REDUCTION = 0.5;
export const CRIT_CHANCE = 0.1;
export const CRIT_MULTIPLIER = 1.5;
export const BOSS_HP_MULTIPLIER = 2.5;
export const BOSS_ATK_MULTIPLIER = 1.25;
export const MINI_BOSS_HP_MULTIPLIER = 2;
export const MINI_BOSS_ATK_MULTIPLIER = 1.1;

// --- Formation and roles ---
/** Back-row fighters take less damage from hit-all attacks. */
export const BACK_ROW_WAVE_REDUCTION = 0.8;
export const TANK_DAMAGE_TAKEN = 0.85;
export const ASSASSIN_SINGLE_BONUS = 1.15;
export const BLASTER_WAVE_BONUS = 1.15;
export const SUPPORT_HEAL_BONUS = 1.2;
export const DRAIN_SHARE = 0.5;
export const DRAINER_DRAIN_SHARE = 0.75;
/** Shields can't stack past this share of max HP. */
export const MAX_SHIELD_SHARE = 0.4;
/** Own turns a rally bonus lasts. */
export const RALLY_TURNS = 2;

// --- Buying spins ---
/** A spin costs this share of your latest stage's first-clear coins, so replays can always earn more. */
export const SPIN_PRICE_SHARE = 0.5;
export const MIN_SPIN_PRICE = 100;

export function spinPrice(clearedStage: number): number {
  return Math.max(MIN_SPIN_PRICE, Math.round(stageCoinReward(Math.max(1, clearedStage)) * SPIN_PRICE_SHARE));
}

// --- Training Dojo ---
export const DOJO_SLOTS = 3;
/** Real minutes of training per level gained. */
export const DOJO_MINUTES_PER_LEVEL = 10;

// --- Fusion Lab ---
export const SHARD_FUSION_COST = 3;
/** Coins for selling a spare copy (plus any coins spent leveling it). */
export function sellValue(star: number, level: number): number {
  return Math.round(20 * star * star + level * 2);
}

// --- Gravity Chamber ---
export const GRAVITY_MAX_LEVEL = 25;
/** HP, attack and defense bonus per Gravity level for every fighter of that role. */
export const GRAVITY_PER_LEVEL = 0.02;
export function gravityCost(level: number): number {
  return Math.round(2000 * Math.pow(1.3, level));
}

// --- Expedition Port ---
export const EXPEDITION_SLOTS = 2;
export const EXPEDITION_HOURS = [1, 4, 8] as const;
export const EXPEDITION_MAX_PARTY = 3;

// --- Rival Tower ---
export const TOWER_FLOORS = 30;

// --- Class advantage ---
/** Damage multiplier when attacking the class you beat, and when hit by the class that beats you. */
export const CLASS_ADVANTAGE = 1.25;
export const CLASS_DISADVANTAGE = 0.85;

// --- Star milestone passives ---
/** Cumulative passive bonuses unlocked by evolving a fighter to higher star tiers. */
export function starMilestoneBonus(star: number): Partial<import('./bonus').Bonus> {
  const b: Partial<import('./bonus').Bonus> = {};
  if (star >= 2) b.crit = 0.05;
  if (star >= 3) b.shield = 0.08;
  if (star >= 4) b.specialPower = 0.12;
  if (star >= 5) b.spd = 8;
  if (star >= 6) b.secondWind = 0.15;
  if (star >= 7) b.atk = 0.10;
  if (star >= 8) b.charge = 1;
  if (star >= 9) b.lastStand = 0.20;
  if (star >= 10) b.ki = 15;
  return b;
}
