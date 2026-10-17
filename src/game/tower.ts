import { MAX_LEVEL, MAX_STARS, TOWER_FLOORS, stageCoinReward } from './balance';
import type { BattleRule, EnemySpec, Stage } from './stages';
import type { SaveData } from './types';

interface Theme {
  name: string;
  families: string[];
}

// Hand-picked rival squads; each floor uses one with a twist rule.
const THEMES: Theme[] = [
  { name: 'Cliff Temple Monks', families: ['tobi', 'kenji', 'jin', 'orrin', 'mei'] },
  { name: 'Pale Star Court', families: ['vorg', 'nyx', 'kael', 'grimm', 'sylas'] },
  { name: 'Brawler Gang', families: ['mogra', 'bruno', 'mei', 'aya', 'jin'] },
  { name: 'Star Rangers', families: ['lyra', 'aya', 'sora', 'mei', 'zeno'] },
  { name: 'Royal Guard', families: ['varek', 'bruno', 'orrin', 'kairo', 'jin'] },
  { name: 'Hive Swarm', families: ['sylas', 'grimm', 'mogra', 'nyx', 'vorg'] },
  { name: 'Prodigies', families: ['sora', 'kairo', 'varek', 'lyra', 'aya'] },
  { name: 'Undying Sages', families: ['zeno', 'orrin', 'kenji', 'bruno', 'tobi'] },
  { name: 'Echo Legion', families: ['kael', 'varek', 'kairo', 'sora', 'grimm'] },
  { name: 'The Vision Masters', families: ['kairo', 'varek', 'kael', 'zeno', 'grimm'] },
];

const RULES: (BattleRule | undefined)[] = [undefined, 'max3', 'fullSpecials', 'enemyShields', 'tough'];

export const RULE_TEXT: Record<BattleRule, string> = {
  max3: 'Only your first 3 fighters (by pad) can fight.',
  fullSpecials: 'Enemies start with their specials fully charged.',
  enemyShields: 'Enemies start with shields.',
  tough: 'Enemies have 50% more HP.',
};

/** Rival Tower floor as a battle. Floors climb from Lv 20 to near the level cap. */
export function towerStage(floor: number): Stage {
  const theme = THEMES[(floor - 1) % THEMES.length];
  const level = Math.min(MAX_LEVEL, 20 + (floor - 1) * 13);
  const star = Math.min(MAX_STARS, Math.ceil(level / 20));
  const kind = floor % 10 === 0 ? 'boss' : floor % 5 === 0 ? 'miniBoss' : 'normal';
  const enemies: EnemySpec[] = theme.families.map((familyId, i) => ({
    familyId,
    star,
    level,
    rank: i === 0 && kind !== 'normal' ? kind : 'minion',
  }));
  return {
    // Battle strength scales off a matching stage number.
    number: 10 + floor * 12,
    chapter: 0,
    chapterName: theme.name,
    kind,
    enemies,
    coins: towerRewards(floor).coins,
    label: `Tower ${floor}F`,
    rule: RULES[(floor - 1) % RULES.length],
  };
}

export function towerRewards(floor: number): { coins: number; spins: number; gems: number; shardStar: number | null } {
  const milestone = floor % 5 === 0;
  return {
    coins: 3 * stageCoinReward(Math.min(380, floor * 12)),
    spins: 2,
    gems: milestone ? 5 : 0,
    // Every fifth floor pays a shard, rarer the higher you climb.
    shardStar: milestone ? Math.min(MAX_STARS, 2 + floor / 5) : null,
  };
}

/** Floors pay out once, the first time they are cleared. */
export function applyTowerWin(save: SaveData, floor: number): SaveData {
  if (floor !== save.towerFloor + 1 || floor > TOWER_FLOORS) return save;
  const r = towerRewards(floor);
  const shards = r.shardStar ? { ...save.shards, [r.shardStar]: (save.shards[r.shardStar] ?? 0) + 1 } : save.shards;
  return { ...save, coins: save.coins + r.coins, spins: save.spins + r.spins, gems: save.gems + r.gems, shards, towerFloor: floor };
}
