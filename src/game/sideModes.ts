// Daily Dungeon, Boss Raid, Infinite Climb and the Streak Boss all fight through the normal battle
// screen; this module builds their stages and settles their results.
import { MAX_LEVEL, MAX_STARS, enemyLevelForStage, enemyStarForStage } from './balance';
import type { BattleState } from './battle';
import { recordWin } from './bounty';
import { climbReward, climbStage, lastWeekBest, syncClimbWeek, winClimbFloor, BEAT_LAST_WEEK_REWARD } from './climb';
import { applyDungeonRule, clearDungeon, dailyDungeonRule, dungeonRewards, dungeonSquad, dungeonStage } from './dungeon';
import { RAID_GEMS_PER_PHASE, attemptRaid, raidStage } from './raid';
import { EVENT_STAGES, currentEvent, eventStage, winEventStage } from './events';
import { FAMILIES } from './roster';
import type { Stage } from './stages';
import { dayKey, hashString } from './time';
import type { SaveData, Unit } from './types';

export type SideMode = 'dungeon' | 'raid' | 'climb' | 'streak' | 'event';

const SIDE_MODES: readonly string[] = ['dungeon', 'raid', 'climb', 'streak', 'event'];
const STREAK_LEVEL_BONUS = 5;

export function isSideMode(mode: string | undefined): mode is SideMode {
  return mode !== undefined && SIDE_MODES.includes(mode);
}

function dungeonDay(save: SaveData): string {
  return save.dungeon?.day ?? dayKey();
}

/** The bonus boss unlocked by every 7th consecutive login. */
export function streakBossStage(save: SaveData): Stage {
  const villains = FAMILIES.filter((f) => f.villain);
  const boss = villains[hashString(`streak:${save.login.day}`) % villains.length];
  const stageEq = Math.max(10, save.clearedStage);
  return {
    number: stageEq,
    chapter: 0,
    chapterName: 'Streak Boss',
    kind: 'boss',
    dominantRole: 'Tank',
    enemies: [{
      familyId: boss.id,
      star: Math.min(MAX_STARS, enemyStarForStage(stageEq) + 1),
      level: Math.min(MAX_LEVEL, enemyLevelForStage(stageEq) + STREAK_LEVEL_BONUS),
      rank: 'boss',
    }],
    coins: 0,
    label: 'Streak Boss',
    weather: 'clear',
  };
}

export function bestStar(save: SaveData): number {
  return Math.max(1, ...save.units.map((u) => u.star));
}

/** Pays the guaranteed best-star shard and uses up the fight. */
export function winStreakBoss(save: SaveData): SaveData {
  if (!save.login.bossReady) throw new Error('No Streak Boss waiting');
  const star = bestStar(save);
  return {
    ...save,
    shards: { ...save.shards, [star]: (save.shards[star] ?? 0) + 1 },
    login: { ...save.login, bossReady: false },
  };
}

export function sideStage(mode: SideMode, save: SaveData, floor: number): Stage {
  switch (mode) {
    case 'dungeon':
      return dungeonStage(save, dungeonDay(save));
    case 'raid':
      return raidStage(save);
    case 'climb':
      return climbStage(floor);
    case 'streak':
      return streakBossStage(save);
    case 'event':
      return eventStage(save, floor);
  }
}

export function sideSquad(mode: SideMode, save: SaveData, team: (Unit | null)[]): (Unit | null)[] {
  return mode === 'dungeon' ? dungeonSquad(team, dailyDungeonRule(dungeonDay(save))) : team;
}

export function prepareSideBattle(mode: SideMode, save: SaveData, state: BattleState): BattleState {
  return mode === 'dungeon' ? applyDungeonRule(state, dailyDungeonRule(dungeonDay(save))) : state;
}

/** The save after the fight and the lines to show on the result card. Pure, so it can run on any save. */
export function settleSideBattle(mode: SideMode, save: SaveData, stage: Stage, battle: BattleState, floor: number): { save: SaveData; lines: string[] } {
  const won = battle.result === 'won';
  const flawless = battle.fighters.every((f) => f.side !== 'player' || f.hp > 0);
  const counted = (s: SaveData, boss: boolean) => (won ? recordWin(s, { firstClear: false, boss, flawless }) : s);
  switch (mode) {
    case 'dungeon':
      if (!won) return { save, lines: ['The dungeon threw you out. No reward this run.'] };
      return { save: counted(clearDungeon(save, dungeonDay(save)), false), lines: [`◆ ${dungeonRewards.gems} gems`, `+${dungeonRewards.relicShard} Relic Shard`] };
    case 'raid': {
      const start = stage.enemies[0].hpPool?.left ?? 0;
      const left = battle.fighters.find((f) => f.side === 'enemy')?.hp ?? 0;
      const dealt = Math.max(0, start - left);
      const next = attemptRaid(save, dealt);
      const phases = (next.raid?.clearedPhases.length ?? 0) - (save.raid?.clearedPhases.length ?? 0);
      const lines = [`You dealt ${dealt.toLocaleString()} damage.`];
      if (phases > 0) lines.push(`${phases} phase${phases === 1 ? '' : 's'} cleared · ◆ ${phases * RAID_GEMS_PER_PHASE}`);
      return { save: counted(next, true), lines };
    }
    case 'climb': {
      if (!won) return { save, lines: [`Floor ${floor} held. Your best stays where it was.`] };
      const before = syncClimbWeek(save);
      const isNew = floor > (before.climbBest ?? 0);
      const target = lastWeekBest(before);
      const beat = isNew && target > 0 && (before.climbBest ?? 0) <= target && floor > target;
      const r = climbReward(floor);
      const lines = isNew ? [`Floor ${floor} cleared · ● ${r.coins.toLocaleString()}${r.gems ? ` · ◆ ${r.gems}` : ''}`] : [`Floor ${floor} was already cleared this week.`];
      if (beat) lines.push(`You beat last week's best (${target}F)! ◆ ${BEAT_LAST_WEEK_REWARD.gems} · ${BEAT_LAST_WEEK_REWARD.spins} Spin Orbs`);
      return { save: counted(winClimbFloor(save, floor), false), lines };
    }
    case 'streak':
      if (!won) return { save, lines: ['The Streak Boss is still waiting. Try again.'] };
      return { save: counted(winStreakBoss(save), true), lines: [`Guaranteed ${bestStar(save)}★ evolution shard`] };
    case 'event': {
      if (!won) return { save, lines: ['The event stage held. Regroup and try again.'] };
      const ev = currentEvent();
      const result = winEventStage(save, floor);
      const lines = [`+${result.tokens} ${ev.currency}${result.firstClear ? ' (first clear)' : ''}`];
      if (result.firstClear && floor === EVENT_STAGES) lines.push(`${ev.name} complete! Spend your ${ev.currency} in the event shop.`);
      return { save: counted(result.save, stage.kind !== 'normal'), lines };
    }
  }
}

/** The building to return to after the fight. */
export const SIDE_MODE_HOME: Record<SideMode, 'dungeon' | 'raid' | 'climb' | 'colosseum' | 'event'> = {
  dungeon: 'dungeon',
  raid: 'raid',
  climb: 'climb',
  streak: 'colosseum',
  event: 'event',
};
