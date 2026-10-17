import { stageCoinReward } from './balance';
import { TEMPLATES, addItem } from './gear';
import { type Rng, defaultRng } from './rng';
import { dayKey } from './time';
import type { SaveData } from './types';

export interface LoginReward {
  label: string;
  apply: (save: SaveData, rng: Rng) => SaveData;
}

const coins = (mult: number) => (s: SaveData) => s.coins + stageCoinReward(Math.max(1, s.clearedStage)) * mult;

/** A 7-day track that loops; one claim per calendar day, missing a day never resets it. */
export const LOGIN_TRACK: LoginReward[] = [
  { label: 'Coins ×2', apply: (s) => ({ ...s, coins: coins(2)(s) }) },
  { label: '2 spins', apply: (s) => ({ ...s, spins: s.spins + 2 }) },
  { label: 'Coins ×4', apply: (s) => ({ ...s, coins: coins(4)(s) }) },
  { label: '3 gems', apply: (s) => ({ ...s, gems: s.gems + 3 }) },
  { label: '5 spins', apply: (s) => ({ ...s, spins: s.spins + 5 }) },
  { label: 'Rare gear', apply: (s, rng) => addItem(s, TEMPLATES[Math.floor(rng() * TEMPLATES.length)].id, 'rare').save },
  {
    label: 'Shard + 5 gems',
    apply: (s) => {
      const star = Math.max(1, ...s.units.map((u) => u.star));
      return { ...s, gems: s.gems + 5, shards: { ...s.shards, [star]: (s.shards[star] ?? 0) + 1 } };
    },
  },
];

export function loginReady(save: SaveData, day = dayKey()): boolean {
  return save.login.day !== day;
}

/** Which day of the track is next (0–6). */
export function loginIndex(save: SaveData): number {
  return save.login.claims % LOGIN_TRACK.length;
}

export function claimLogin(save: SaveData, rng: Rng = defaultRng, day = dayKey()): SaveData {
  if (!loginReady(save, day)) throw new Error('Already claimed today');
  const reward = LOGIN_TRACK[loginIndex(save)];
  const next = reward.apply(save, rng);
  return { ...next, login: { day, claims: save.login.claims + 1 } };
}
