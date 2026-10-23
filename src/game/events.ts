// Weekly events: a limited 10-stage chapter with its own story, arena, currency and shop.
// The calendar is the same for everyone and rotates every ISO week.
import { MAX_LEVEL, MAX_STARS, TOTAL_STAGES, enemyCountForStage, enemyLevelForStage, enemyStarForStage } from './balance';
import type { Weather } from './arenas';
import { FAMILIES } from './roster';
import { seededRng } from './rng';
import type { EnemySpec, Stage, StageKind } from './stages';
import type { Line } from './story';
import { dayKey, hashString, weekKey } from './time';
import type { EventProgress, SaveData } from './types';

export type { EventProgress };

export const EVENT_STAGES = 10;
const MINI_BOSS_STAGE = 5;
/** Event stages sit around the player's frontier: stage 1 is a little behind it, stage 10 a little past it. */
const FRONTIER_OFFSET = 5;
const FIRST_CLEAR_BASE = 20;
const FIRST_CLEAR_PER_STAGE = 4;
const BOSS_FIRST_CLEAR = 80;
const REPLAY_TOKENS = 10;
const BOSS_REPLAY_TOKENS = 20;
const BOSS_LEVEL_BONUS = 6;
const MINI_BOSS_LEVEL_BONUS = 3;
const LEVEL_JITTER = 5;
const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
/** Early event stages still field a few fighters even for brand-new players. */
const MIN_STAGE_PER_EVENT_STAGE = 2;
const JITTER_HALF = Math.floor(LEVEL_JITTER / 2);
const DAYS_PER_WEEK = 7;
const WEEKS_PER_YEAR = 53;

export interface EventDef {
  id: string;
  name: string;
  tagline: string;
  /** Name of the event currency. */
  currency: string;
  arenaId: string;
  weather: Weather;
  /** Rate-up fighter on the summon screen and in the event shop. */
  featured: string;
  /** Event-only skin sold in the event shop. */
  skinId: string;
  /** The first is the stage 10 boss; the rest lead the mini-boss and fill the ranks. */
  villains: string[];
  intro: Line[];
  finale: Line[];
}

export const EVENTS: EventDef[] = [
  {
    id: 'lantern',
    name: 'Lantern Festival',
    tagline: 'A thousand lanterns over Blossom Valley, and something hiding in their shadows.',
    currency: 'Lantern Tokens',
    arenaId: 'blossom',
    weather: 'rain',
    featured: 'mei',
    skinId: 'mei-lantern',
    villains: ['mogra', 'nyx'],
    intro: [
      { who: 'mei', text: 'The Lantern Festival! Food, fireworks, and no fighting. Probably.' },
      { who: 'tobi', text: 'Someone keeps stealing the lanterns. Big footprints. Very big.' },
      { who: 'kairo', text: 'Then we follow the footprints.' },
    ],
    finale: [
      { who: 'mogra', text: 'MOGRA... ONLY WANTED... PRETTY LIGHTS.' },
      { who: 'mei', text: 'You could have just asked. Here, keep one.' },
    ],
  },
  {
    id: 'frostfang',
    name: 'Frostfang Hunt',
    tagline: 'The Frozen Citadel wakes once a year. So does its keeper.',
    currency: 'Frost Fangs',
    arenaId: 'frost',
    weather: 'snow',
    featured: 'bruno',
    skinId: 'bruno-frostfang',
    villains: ['grimm', 'mogra'],
    intro: [
      { who: 'bruno', text: 'The ice is singing. That means the Hunt has begun.' },
      { who: 'grimm', text: 'Every winter, one champion freezes on my throne. This year, you.' },
    ],
    finale: [
      { who: 'grimm', text: 'Warm hands... and a colder will than mine.' },
      { who: 'bruno', text: 'Same time next year, Grimm. Bring a scarf.' },
    ],
  },
  {
    id: 'starfall',
    name: 'Starfall Regatta',
    tagline: 'Race the falling stars across the Pale Star Fleet.',
    currency: 'Star Shards',
    arenaId: 'space',
    weather: 'stars',
    featured: 'lyra',
    skinId: 'lyra-starfall',
    villains: ['vorg', 'nyx'],
    intro: [
      { who: 'lyra', text: 'Every falling star is a wish. Vorg wants all of them.' },
      { who: 'vorg', text: 'A tyrant needs a great many wishes, little singer.' },
    ],
    finale: [
      { who: 'vorg', text: 'Keep your stars. I will be back for the sky.' },
      { who: 'lyra', text: 'I wished you would say that.' },
    ],
  },
  {
    id: 'ember',
    name: 'Ember Carnival',
    tagline: 'Fire-dancers, lava rides and a host who never lets guests leave.',
    currency: 'Ember Tickets',
    arenaId: 'volcano',
    weather: 'embers',
    featured: 'jin',
    skinId: 'jin-ember',
    villains: ['sylas', 'mogra'],
    intro: [
      { who: 'sylas', text: 'Welcome to my carnival. Every ride ends in my collection.' },
      { who: 'jin', text: 'Then I will ride the last one and cut the track.' },
    ],
    finale: [
      { who: 'sylas', text: 'You were the best show of the season.' },
      { who: 'jin', text: 'And the last. The carnival is closed.' },
    ],
  },
  {
    id: 'masquerade',
    name: 'Echo Masquerade',
    tagline: 'In the Rift of Echoes, every mask hides an old rival.',
    currency: 'Echo Masks',
    arenaId: 'rift',
    weather: 'storm',
    featured: 'zeno',
    skinId: 'zeno-masque',
    villains: ['kael', 'sylas'],
    intro: [
      { who: 'zeno', text: 'The masquerade begins. Nobody here is who they seem.' },
      { who: 'kael', text: 'Least of all me, Kairo. Dance with me.' },
    ],
    finale: [
      { who: 'kael', text: 'The mask slips. Next time, I will not.' },
      { who: 'zeno', text: 'The echoes are quiet again. For now.' },
    ],
  },
];

function parseWeek(week: string): number {
  const [year, w] = week.split('-W').map(Number);
  return year * WEEKS_PER_YEAR + w;
}

/** The event running in a given ISO week; consecutive weeks walk the list in order. */
export function eventForWeek(week: string): EventDef {
  return EVENTS[parseWeek(week) % EVENTS.length];
}

export function currentEvent(now = new Date()): EventDef {
  return eventForWeek(weekKey(now));
}

/** A local "YYYY-MM-DD" day key back to a date (for code that only has the day). */
export function dateFromDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Milliseconds until the event ends (next Monday, 00:00 local). */
export function eventTimeLeft(now = new Date()): number {
  const daysToMonday = ((DAYS_PER_WEEK + 1 - now.getDay()) % DAYS_PER_WEEK) || DAYS_PER_WEEK;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
  return Math.max(0, end.getTime() - now.getTime());
}

export function formatTimeLeft(ms: number): string {
  const days = Math.floor(ms / MS_PER_DAY);
  const hours = Math.floor((ms % MS_PER_DAY) / MS_PER_HOUR);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

export function freshEventProgress(week: string): EventProgress {
  return { week, cleared: 0, currency: 0, bought: {} };
}

/** A new week starts a new event: progress, currency and purchases reset; skins stay owned. */
export function syncEvent(save: SaveData, now = new Date()): SaveData {
  const week = weekKey(now);
  return save.event?.week === week ? save : { ...save, event: freshEventProgress(week) };
}

export function eventProgress(save: SaveData, now = new Date()): EventProgress {
  return syncEvent(save, now).event!;
}

function frontier(save: SaveData): number {
  return Math.max(1, Math.min(TOTAL_STAGES, save.clearedStage));
}

export function eventStage(save: SaveData, n: number, now = new Date()): Stage {
  if (n < 1 || n > EVENT_STAGES) throw new Error('No such event stage');
  const ev = currentEvent(now);
  const stageEq = Math.max(1, Math.min(TOTAL_STAGES, frontier(save) - FRONTIER_OFFSET + n));
  const kinds: Record<number, StageKind> = { [MINI_BOSS_STAGE]: 'miniBoss', [EVENT_STAGES]: 'boss' };
  const kind = kinds[n] ?? 'normal';
  const level = enemyLevelForStage(stageEq);
  const star = enemyStarForStage(stageEq);
  const rng = seededRng(hashString(`event:${ev.id}:${n}`));
  const enemies: EnemySpec[] = [];
  if (kind !== 'normal') {
    const leader = kind === 'boss' ? ev.villains[0] : ev.villains[1] ?? ev.villains[0];
    enemies.push({
      familyId: leader,
      star: Math.min(MAX_STARS, star + (kind === 'boss' ? 1 : 0)),
      level: Math.min(MAX_LEVEL, level + (kind === 'boss' ? BOSS_LEVEL_BONUS : MINI_BOSS_LEVEL_BONUS)),
      rank: kind,
    });
  }
  const pool = FAMILIES.filter((f) => !f.villain);
  const count = enemyCountForStage(Math.max(stageEq, n * MIN_STAGE_PER_EVENT_STAGE));
  const minions = Array.from({ length: Math.max(0, count - enemies.length) }, (): EnemySpec => {
    const family = pool[Math.floor(rng() * pool.length)];
    const jitter = Math.floor(rng() * LEVEL_JITTER) - JITTER_HALF;
    return { familyId: family.id, star, level: Math.max(1, Math.min(MAX_LEVEL, level + jitter)), rank: 'minion' };
  });
  enemies.push(...minions);
  return {
    number: stageEq,
    chapter: 0,
    chapterName: ev.name,
    kind,
    dominantRole: 'Tank',
    enemies,
    coins: 0,
    label: `${ev.name} · ${n}/${EVENT_STAGES}`,
    weather: ev.weather,
    arenaId: ev.arenaId,
  };
}

export function eventStageUnlocked(save: SaveData, n: number, now = new Date()): boolean {
  return n >= 1 && n <= EVENT_STAGES && n <= eventProgress(save, now).cleared + 1;
}

/** Event currency for a win: first clears pay more, replays pay a little. */
export function eventTokens(n: number, firstClear: boolean): number {
  if (n === EVENT_STAGES) return firstClear ? BOSS_FIRST_CLEAR : BOSS_REPLAY_TOKENS;
  return firstClear ? FIRST_CLEAR_BASE + FIRST_CLEAR_PER_STAGE * n : REPLAY_TOKENS;
}

/** Replays stop paying currency after this much in a day; first clears always pay. */
export const EVENT_REPLAY_DAILY_CAP = 100;

export function replayTokensLeft(save: SaveData, now = new Date()): number {
  const progress = eventProgress(save, now);
  const earned = progress.replayDay === dayKey(now) ? (progress.replayEarned ?? 0) : 0;
  return Math.max(0, EVENT_REPLAY_DAILY_CAP - earned);
}

export function winEventStage(save: SaveData, n: number, now = new Date()): { save: SaveData; tokens: number; firstClear: boolean } {
  if (!eventStageUnlocked(save, n, now)) throw new Error('That event stage is locked');
  const synced = syncEvent(save, now);
  const progress = synced.event!;
  const firstClear = n > progress.cleared;
  const tokens = firstClear ? eventTokens(n, true) : Math.min(eventTokens(n, false), replayTokensLeft(synced, now));
  const day = dayKey(now);
  const replayEarned = firstClear ? progress.replayEarned : (progress.replayDay === day ? (progress.replayEarned ?? 0) : 0) + tokens;
  const replayDay = firstClear ? progress.replayDay : day;
  return {
    save: { ...synced, event: { ...progress, cleared: Math.max(progress.cleared, n), currency: progress.currency + tokens, replayDay, replayEarned } },
    tokens,
    firstClear,
  };
}

/** Rate-up multiplier on the summon screen for this week's featured fighter. */
export const FEATURED_MULTIPLIER = 4;

export function featuredFamilyId(now = new Date()): string {
  return currentEvent(now).featured;
}

export function introSceneKey(save: SaveData, now = new Date()): string {
  return `event-${currentEvent(now).id}-${eventProgress(save, now).week}`;
}
