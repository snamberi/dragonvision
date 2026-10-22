import { hashString } from './time';
import type { SaveData, WantedPoster } from './types';

const ROLES = ['Warrior', 'Mage', 'Assassin', 'Guardian', 'Trickster'];
const POSTER_DURATION_MS = 86_400_000; // 24 hours
const POSTER_COUNT = 3;

function makePosterId(day: string, idx: number): string {
  return `poster-${day}-${idx}`;
}

export function generateWantedPosters(day: string, clearedStage: number): WantedPoster[] {
  const base = Math.max(1, clearedStage - 2);
  const expires = new Date(day).getTime() + POSTER_DURATION_MS;
  return Array.from({ length: POSTER_COUNT }, (_, i) => {
    const seed = hashString(`${day}-poster-${i}`);
    const stage = base + (seed % 5);
    const useClass = seed % 4 !== 0;
    const requiredClass = useClass ? ROLES[seed % ROLES.length] : null;
    const coinMulti = 1 + i * 0.5;
    return {
      id: makePosterId(day, i),
      stage,
      requiredClass,
      coins: Math.round(stage * 50 * coinMulti),
      gems: 1 + i,
      expiresAt: expires,
      claimed: false,
    };
  });
}

export function refreshWantedPosters(save: SaveData, day: string): SaveData {
  const now = Date.now();
  const active = (save.wantedPosters ?? []).filter((p) => !p.claimed && p.expiresAt > now);
  if (active.length >= POSTER_COUNT) return save;
  const fresh = generateWantedPosters(day, save.clearedStage);
  const existing = (save.wantedPosters ?? []).filter((p) => !p.claimed && p.expiresAt > now);
  const needed = fresh.slice(0, POSTER_COUNT - existing.length);
  return { ...save, wantedPosters: [...existing, ...needed] };
}

export function claimWantedPoster(save: SaveData, posterId: string): SaveData {
  const poster = (save.wantedPosters ?? []).find((p) => p.id === posterId);
  if (!poster) throw new Error('Poster not found');
  if (poster.claimed) throw new Error('Already claimed');
  return {
    ...save,
    coins: save.coins + poster.coins,
    gems: save.gems + poster.gems,
    wantedPosters: (save.wantedPosters ?? []).map((p) => (p.id === posterId ? { ...p, claimed: true } : p)),
  };
}

export function activePosters(save: SaveData, day: string): WantedPoster[] {
  const now = Date.now();
  return (save.wantedPosters ?? []).filter((p) => {
    if (p.claimed) return false;
    if (p.expiresAt <= now) return false;
    if (!p.id.startsWith(`poster-${day}`)) return true;
    return true;
  });
}
