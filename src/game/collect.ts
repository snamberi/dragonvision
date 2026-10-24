// Today's to-do list, "Collect all", and the red dots on buildings and tabs.
import { ACHIEVEMENTS, achievementState, claimAchievement } from './achievements';
import { BOUNTIES, bountyProgress, claimBounty, syncBounties } from './bounty';
import { collectTraining, dojoProgress } from './dojo';
import { canAttemptDungeon } from './dungeon';
import { EVENT_STAGES, eventProgress, replayTokensLeft } from './events';
import { claimExpedition, expeditionDone } from './expedition';
import { fortuneReady } from './fortune';
import { loginReady } from './login';
import { checkEvolve } from './progression';
import { raidAttemptsLeft } from './raid';
import { MILESTONES, attemptsLeft, bossProgress, claimMilestone, syncWorldBoss } from './worldBoss';
import { dayKey } from './time';
import type { SaveData } from './types';

/** Where a checklist row or badge leads. 'login' opens the daily chest on Home. */
export type PendingKey =
  | 'login'
  | 'bounty'
  | 'dungeon'
  | 'raid'
  | 'colosseum'
  | 'port'
  | 'dojo'
  | 'event'
  | 'fortune'
  | 'hall'
  | 'fighters';

export interface ChecklistRow {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  /** Something can be claimed right now (not just played). */
  claimable: boolean;
  target: PendingKey;
}

function claimableBounties(save: SaveData, period: 'daily' | 'weekly') {
  return BOUNTIES.filter((b) => b.period === period).filter((b) => {
    const p = bountyProgress(save, b);
    return !p.claimed && p.done >= b.goal;
  });
}

function openBounties(save: SaveData, period: 'daily' | 'weekly') {
  return BOUNTIES.filter((b) => b.period === period && !bountyProgress(save, b).claimed);
}

function claimableMilestones(save: SaveData): number[] {
  const progress = bossProgress(save);
  return MILESTONES.flatMap((m, i) => (progress >= m.share && !save.worldBoss.claimed.includes(i) ? [i] : []));
}

function claimableAchievements(save: SaveData): string[] {
  return ACHIEVEMENTS.filter((a) => {
    const st = achievementState(save, a);
    return st.complete && !st.claimed;
  }).map((a) => a.id);
}

/** Everything worth doing today, in the order players usually do it. */
export function dailyChecklist(save: SaveData, now = new Date()): ChecklistRow[] {
  const ms = now.getTime();
  const day = dayKey(now);
  const dailyReady = claimableBounties(save, 'daily').length;
  const dailyOpen = openBounties(save, 'daily').length;
  const weeklyReady = claimableBounties(save, 'weekly').length;
  const tripsBack = save.expeditions.filter((e) => expeditionDone(e, ms)).length;
  const dojoReady = save.dojo.reduce((sum, slot) => sum + dojoProgress(save, slot, ms).ready, 0);
  const bossLeft = attemptsLeft(save);
  const bossDone = bossProgress(save) >= 1;
  const milestones = claimableMilestones(save).length;
  const raidLeft = raidAttemptsLeft(save, undefined, day);
  const dungeonCleared = save.dungeon?.day === day && save.dungeon.cleared;
  const dungeonOpen = canAttemptDungeon(save, day);
  const event = eventProgress(save, now);
  const replayLeft = replayTokensLeft(save, now);
  const trophies = claimableAchievements(save).length;
  return [
    { id: 'login', label: 'Daily supplies', detail: loginReady(save, day) ? 'Ready to open' : 'Opened today', done: !loginReady(save, day), claimable: loginReady(save, day), target: 'login' },
    {
      id: 'daily-bounties',
      label: 'Daily bounties',
      detail: dailyReady ? `${dailyReady} ready to claim` : dailyOpen ? `${dailyOpen} in progress` : 'All claimed',
      done: dailyOpen === 0,
      claimable: dailyReady > 0,
      target: 'bounty',
    },
    { id: 'weekly-bounties', label: 'Weekly bounties', detail: weeklyReady ? `${weeklyReady} ready to claim` : 'Nothing to claim', done: weeklyReady === 0, claimable: weeklyReady > 0, target: 'bounty' },
    { id: 'fortune', label: 'Fortune Teller', detail: fortuneReady(save, day) ? 'Free summon waiting' : 'Used today', done: !fortuneReady(save, day), claimable: fortuneReady(save, day), target: 'fortune' },
    {
      id: 'dungeon',
      label: 'Daily Dungeon',
      detail: dungeonCleared ? 'Cleared today' : dungeonOpen ? `${save.materials.dungeonKey} key${save.materials.dungeonKey === 1 ? '' : 's'} ready` : 'No key or attempts left',
      done: dungeonCleared || !dungeonOpen,
      claimable: false,
      target: 'dungeon',
    },
    { id: 'raid', label: 'Boss Raid', detail: raidLeft ? `${raidLeft} attempt${raidLeft === 1 ? '' : 's'} left` : 'No attempts left today', done: raidLeft === 0, claimable: false, target: 'raid' },
    {
      id: 'world-boss',
      label: 'World Boss',
      detail: milestones ? `${milestones} reward${milestones === 1 ? '' : 's'} to claim` : bossDone ? 'Defeated this week' : `${bossLeft} attempt${bossLeft === 1 ? '' : 's'} left`,
      done: milestones === 0 && (bossDone || bossLeft === 0),
      claimable: milestones > 0,
      target: 'colosseum',
    },
    { id: 'streak-boss', label: 'Streak Boss', detail: save.login.bossReady ? 'Ready to fight' : 'Log in 7 days in a row', done: !save.login.bossReady, claimable: false, target: 'colosseum' },
    { id: 'expeditions', label: 'Expeditions', detail: tripsBack ? `${tripsBack} back home` : save.expeditions.length ? `${save.expeditions.length} away` : 'None sent', done: tripsBack === 0, claimable: tripsBack > 0, target: 'port' },
    { id: 'dojo', label: 'Training Dojo', detail: dojoReady ? `+${dojoReady} levels ready` : save.dojo.length ? 'Training…' : 'Nobody training', done: dojoReady === 0, claimable: dojoReady > 0, target: 'dojo' },
    {
      id: 'event',
      label: 'Weekly event',
      detail: event.cleared < EVENT_STAGES ? `${EVENT_STAGES - event.cleared} new stage${EVENT_STAGES - event.cleared === 1 ? '' : 's'}` : `${replayLeft} replay currency left today`,
      done: event.cleared >= EVENT_STAGES && replayLeft === 0,
      claimable: false,
      target: 'event',
    },
    { id: 'trophies', label: 'Trophies', detail: trophies ? `${trophies} earned` : 'Nothing new', done: trophies === 0, claimable: trophies > 0, target: 'hall' },
  ];
}

/** Which places have something claimable or ready. Shared by the checklist, the city map and the tabs. */
export function pendingBadges(save: SaveData, now = new Date()): Partial<Record<PendingKey, boolean>> {
  const rows = dailyChecklist(save, now);
  const badges: Partial<Record<PendingKey, boolean>> = {};
  for (const row of rows) {
    // Rows that can be played (dungeon, raid, event, streak boss) light up too while they are open.
    if (!row.done && (row.claimable || row.target !== 'bounty')) badges[row.target] = true;
  }
  if (save.team.some((uid) => uid && checkEvolve(save, uid).ok)) badges.fighters = true;
  return badges;
}

const CITY_KEYS: PendingKey[] = ['bounty', 'dungeon', 'raid', 'colosseum', 'port', 'dojo', 'event', 'fortune', 'hall'];

/** Badges for the bottom tabs. */
export function tabBadges(save: SaveData, now = new Date()): { home: boolean; city: boolean; fighters: boolean } {
  const b = pendingBadges(save, now);
  return { home: Boolean(b.login), city: CITY_KEYS.some((k) => b[k]), fighters: Boolean(b.fighters) };
}

export interface CollectResult {
  save: SaveData;
  /** Short lines describing what was gained, e.g. "+1,200 coins". */
  gained: string[];
  /** How many separate rewards were claimed. */
  claims: number;
}

function tryApply(save: SaveData, fn: (s: SaveData) => SaveData): SaveData | null {
  try {
    return fn(save);
  } catch {
    return null;
  }
}

/** Claims every reward that needs no choice: bounties, trips, Dojo levels, World Boss milestones and trophies. */
export function collectAll(save: SaveData, now = new Date()): CollectResult {
  const ms = now.getTime();
  let current = syncWorldBoss(syncBounties(save, now), now);
  let claims = 0;
  const step = (fn: (s: SaveData) => SaveData) => {
    const next = tryApply(current, fn);
    if (next) {
      current = next;
      claims++;
    }
  };
  for (const b of [...claimableBounties(current, 'daily'), ...claimableBounties(current, 'weekly')]) step((s) => claimBounty(s, b.id));
  for (const e of current.expeditions.filter((x) => expeditionDone(x, ms))) step((s) => claimExpedition(s, e.id, ms));
  for (const slot of current.dojo.filter((d) => dojoProgress(current, d, ms).ready > 0)) step((s) => collectTraining(s, slot.uid, ms));
  for (const i of claimableMilestones(current)) step((s) => claimMilestone(s, i));
  for (const id of claimableAchievements(current)) step((s) => claimAchievement(s, id));
  return { save: current, gained: describeGains(save, current), claims };
}

function describeGains(before: SaveData, after: SaveData): string[] {
  const shards = (s: SaveData) => Object.values(s.shards).reduce((sum, n) => sum + (n ?? 0), 0);
  const levels = (s: SaveData) => s.units.reduce((sum, u) => sum + u.level, 0);
  const diffs: [number, string][] = [
    [after.coins - before.coins, 'coins'],
    [after.gems - before.gems, 'gems'],
    [after.spins - before.spins, 'Spin Orbs'],
    [shards(after) - shards(before), 'shards'],
    [after.items.length - before.items.length, 'gear'],
    [levels(after) - levels(before), 'Dojo levels'],
    [after.materials.sigMaterial - before.materials.sigMaterial, 'Signature Essence'],
    [after.materials.transcendenceCrystal - before.materials.transcendenceCrystal, 'Transcendence Crystals'],
  ];
  return diffs.filter(([n]) => n > 0).map(([n, label]) => `+${n.toLocaleString()} ${label}`);
}
