import { getFamily, roleFor, type Role } from './roster';
import { hashString } from './time';
import type { SaveData, Unit, WantedPoster } from './types';

const ROLES: Role[] = ['Tank', 'Assassin', 'Blaster', 'Drainer', 'Support'];
const POSTER_DURATION_MS = 86_400_000;
const POSTER_COUNT = 3;
/** Posters pick from your last few cleared stages so they're always beatable. */
const STAGE_SPREAD = 5;
const COINS_PER_STAGE = 50;
const COIN_STEP = 0.5;
/** One in this many posters accepts any team. */
const OPEN_POSTER_ODDS = 4;

export function generateWantedPosters(day: string, clearedStage: number): WantedPoster[] {
  const top = Math.max(1, clearedStage);
  const low = Math.max(1, top - STAGE_SPREAD + 1);
  const expires = new Date(day).getTime() + POSTER_DURATION_MS;
  return Array.from({ length: POSTER_COUNT }, (_, i) => {
    const seed = hashString(`${day}-poster-${i}`);
    const stage = low + (seed % (top - low + 1));
    const requiredClass = seed % OPEN_POSTER_ODDS === 0 ? null : ROLES[seed % ROLES.length];
    return {
      id: `poster-${day}-${i}`,
      stage,
      requiredClass,
      coins: Math.round(stage * COINS_PER_STAGE * (1 + i * COIN_STEP)),
      gems: 1 + i,
      expiresAt: expires,
      done: false,
      claimed: false,
    };
  });
}

/** Posts one set of posters per day. Claimed posters stay up (marked claimed) until the day changes. */
export function refreshWantedPosters(save: SaveData, day: string): SaveData {
  if (save.wantedDay === day) return save;
  return { ...save, wantedDay: day, wantedPosters: generateWantedPosters(day, save.clearedStage) };
}

/** Marks today's posters for this stage as done when the winning team meets the class requirement. */
export function recordWantedWin(save: SaveData, stage: number, team: Unit[], day: string): SaveData {
  const synced = refreshWantedPosters(save, day);
  const roles = new Set(team.map((u) => roleFor(getFamily(u.familyId))));
  const posters = synced.wantedPosters ?? [];
  const meets = (p: WantedPoster) => !p.claimed && !p.done && p.stage === stage && (!p.requiredClass || roles.has(p.requiredClass as Role));
  if (!posters.some(meets)) return synced;
  return { ...synced, wantedPosters: posters.map((p) => (meets(p) ? { ...p, done: true } : p)) };
}

export function claimWantedPoster(save: SaveData, posterId: string): SaveData {
  const poster = (save.wantedPosters ?? []).find((p) => p.id === posterId);
  if (!poster) throw new Error('Poster not found');
  if (poster.claimed) throw new Error('Already claimed');
  if (!poster.done) throw new Error(`Win Stage ${poster.stage}${poster.requiredClass ? ` with a ${poster.requiredClass} on your team` : ''} first`);
  return {
    ...save,
    coins: save.coins + poster.coins,
    gems: save.gems + poster.gems,
    wantedPosters: (save.wantedPosters ?? []).map((p) => (p.id === posterId ? { ...p, claimed: true } : p)),
  };
}

/** Today's posters, claimed ones included so the board doesn't refill. */
export function todaysPosters(save: SaveData, day: string): WantedPoster[] {
  return save.wantedDay === day ? (save.wantedPosters ?? []) : generateWantedPosters(day, save.clearedStage);
}
