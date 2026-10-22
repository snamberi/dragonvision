import { bump } from './progression';
import { dayKey, weekKey } from './time';
import { type MaterialReward, grantMaterials } from './materials';
import type { BountyPeriod, Counters, SaveData } from './types';

export interface Bounty {
  id: string;
  period: 'daily' | 'weekly';
  label: string;
  counter: keyof Counters;
  goal: number;
  reward: { coins?: number; spins?: number; gems?: number } & MaterialReward;
}

export const BOUNTIES: Bounty[] = [
  { id: 'd-wins', period: 'daily', label: 'Win 10 battles', counter: 'wins', goal: 10, reward: { spins: 2, essence: 1 } },
  { id: 'd-summons', period: 'daily', label: 'Summon 10 fighters', counter: 'summons', goal: 10, reward: { gems: 1 } },
  { id: 'd-clear', period: 'daily', label: 'Clear a new stage', counter: 'firstClears', goal: 1, reward: { spins: 1 } },
  { id: 'w-wins', period: 'weekly', label: 'Win 75 battles', counter: 'wins', goal: 75, reward: { spins: 10, crystals: 2 } },
  { id: 'w-evolve', period: 'weekly', label: 'Evolve 3 fighters', counter: 'evolves', goal: 3, reward: { gems: 5, crystals: 2 } },
  { id: 'w-bosses', period: 'weekly', label: 'Beat 3 bosses or mini-bosses', counter: 'bossWins', goal: 3, reward: { spins: 5, essence: 2 } },
  {
    id: 'w-flawless',
    period: 'weekly',
    label: 'Beat a boss or mini-boss with nobody falling',
    counter: 'flawlessBossWins',
    goal: 1,
    reward: { gems: 5 },
  },
];

function period(save: SaveData, key: string, current: BountyPeriod | null): BountyPeriod {
  return current && current.key === key ? current : { key, start: { ...save.counters }, claimed: [] };
}

/** Starts a fresh day or week when the calendar has moved on. */
export function syncBounties(save: SaveData, now = new Date()): SaveData {
  const daily = period(save, dayKey(now), save.bounties.daily);
  const weekly = period(save, weekKey(now), save.bounties.weekly);
  if (daily === save.bounties.daily && weekly === save.bounties.weekly) return save;
  return { ...save, bounties: { daily, weekly } };
}

export function bountyProgress(save: SaveData, bounty: Bounty): { done: number; claimed: boolean } {
  const p = save.bounties[bounty.period];
  if (!p) return { done: 0, claimed: false };
  return { done: Math.min(bounty.goal, save.counters[bounty.counter] - (p.start[bounty.counter] ?? 0)), claimed: p.claimed.includes(bounty.id) };
}

export function claimBounty(save: SaveData, id: string): SaveData {
  const bounty = BOUNTIES.find((b) => b.id === id);
  if (!bounty) throw new Error('Unknown bounty');
  const { done, claimed } = bountyProgress(save, bounty);
  if (claimed) throw new Error('Already claimed');
  if (done < bounty.goal) throw new Error('Not finished yet');
  const p = save.bounties[bounty.period]!;
  return {
    ...grantMaterials(save, bounty.reward),
    coins: save.coins + (bounty.reward.coins ?? 0),
    spins: save.spins + (bounty.reward.spins ?? 0),
    gems: save.gems + (bounty.reward.gems ?? 0),
    bounties: { ...save.bounties, [bounty.period]: { ...p, claimed: [...p.claimed, id] } },
  };
}

/** Counts a won battle for the Bounty Board. */
export function recordWin(save: SaveData, outcome: { firstClear: boolean; boss: boolean; flawless: boolean }): SaveData {
  let next = bump(save, 'wins');
  if (outcome.firstClear) next = bump(next, 'firstClears');
  if (outcome.boss) next = bump(next, 'bossWins');
  if (outcome.boss && outcome.flawless) next = bump(next, 'flawlessBossWins');
  return next;
}
