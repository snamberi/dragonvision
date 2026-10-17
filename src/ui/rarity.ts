export interface Tier {
  id: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'ultimate';
  label: string;
  color: string;
  /** 0 = plain, higher tiers get more effects. */
  rank: number;
}

const TIERS: { maxStar: number; tier: Tier }[] = [
  { maxStar: 1, tier: { id: 'common', label: 'Common', color: '#9a94b8', rank: 0 } },
  { maxStar: 3, tier: { id: 'uncommon', label: 'Uncommon', color: '#4ade80', rank: 1 } },
  { maxStar: 6, tier: { id: 'rare', label: 'Rare', color: '#3fc6ff', rank: 2 } },
  { maxStar: 10, tier: { id: 'epic', label: 'Epic', color: '#b794ff', rank: 3 } },
  { maxStar: 15, tier: { id: 'legendary', label: 'Legendary', color: '#ffd23f', rank: 4 } },
  { maxStar: 20, tier: { id: 'mythic', label: 'Mythic', color: '#ff4a3d', rank: 5 } },
  { maxStar: 21, tier: { id: 'ultimate', label: 'Ultimate', color: '#ffffff', rank: 6 } },
];

export function tierFor(star: number): Tier {
  return (TIERS.find((t) => star <= t.maxStar) ?? TIERS[TIERS.length - 1]).tier;
}

export const ROLE_COLORS: Record<string, string> = {
  Tank: '#3fc6ff',
  Assassin: '#ff4a3d',
  Blaster: '#ff8a1f',
  Support: '#4ade80',
  Drainer: '#b794ff',
};
