// Every tunable number in the game lives here so balancing never means hunting through logic.

export const MAX_LEVEL = 400;
export const MAX_STARS = 21;
/** Levels per star tier: a 2★ fighter is summoned between level 20 and 40, evolves at 40, etc. */
export const LEVELS_PER_STAR = 20;
export const DUPLICATES_TO_EVOLVE = 2;
export const MAX_TEAM_SIZE = 5;

export const STARTING_COINS = 0;
export const STARTING_GEMS = 0;
export const STARTING_SPINS = 0;

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
export const SUMMON_STAR_DECAY = 0.55;
/** Focused character's family weight multiplier (others stay at 1). */
export const FOCUS_MULTIPLIER = 5;

// --- Stages ---
export const TOTAL_STAGES = 180;
export const STAGES_PER_CHAPTER = 10;
export const SPINS_NORMAL = 1;
export const SPINS_MINI_BOSS = 5;
export const SPINS_BOSS = 10;
export const GEMS_MINI_BOSS = 5;
export const GEMS_BOSS = 15;
export const NORMAL_GEM_CHANCE = 0.01;
export const NORMAL_GEM_AMOUNT = 1;
export const REPLAY_COIN_SHARE = 0.25;

export function enemyLevelForStage(stage: number): number {
  return Math.min(MAX_LEVEL, Math.round(1 + 2.2 * (stage - 1)));
}

/** Enemy star tier lags behind its level so players are not walled by duplicates. */
export function enemyStarForLevel(level: number): number {
  return Math.max(1, Math.min(MAX_STARS, Math.floor(level / 30)));
}

/** The first stages are gentler while the player only has one or two fighters. */
export function enemyStrengthForStage(stage: number): number {
  if (stage <= 5) return 0.6 + stage * 0.06;
  return 1;
}

export function enemyCountForStage(stage: number): number {
  return Math.min(MAX_TEAM_SIZE, stage);
}

export function stageCoinReward(stage: number): number {
  return Math.round(6 * levelUpCost(enemyLevelForStage(stage)) + 40);
}

// --- Battle ---
export const KI_MAX = 100;
export const KI_START = 20;
export const KI_CHARGE = 40;
export const KI_PER_ATTACK = 10;
export const KI_BLAST_COST = 30;
export const SPECIAL_COST = 60;
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
export const STRIKER_SINGLE_BONUS = 1.15;
export const BLASTER_WAVE_BONUS = 1.15;
export const SUPPORT_HEAL_BONUS = 1.2;
export const DRAIN_SHARE = 0.5;
export const DRAINER_DRAIN_SHARE = 0.75;
