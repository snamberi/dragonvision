import type { SaveData, Unit } from './types';
import { runesOnUnit } from './rune';

export interface SetBonus {
  setId: string;
  name: string;
  pieces2: string;
  pieces4: string;
  atkBonus2?: number;
  defBonus2?: number;
  hpBonus2?: number;
  atkBonus4?: number;
  defBonus4?: number;
  hpBonus4?: number;
}

const ATK_2PC_SM = 0.10;
const ATK_2PC_MD = 0.12;
const ATK_2PC_XS = 0.06;
const DEF_2PC_MD = 0.12;
const DEF_2PC_XS = 0.06;
const HP_2PC_MD = 0.12;
const ATK_4PC_MD = 0.20;
const ATK_4PC_LG = 0.25;
const ATK_4PC_XS = 0.12;
const DEF_4PC_MD = 0.25;
const DEF_4PC_XS = 0.12;
const HP_4PC_SM = 0.10;
const HP_4PC_LG = 0.25;

export const TWO_PIECE_THRESHOLD = 2;
export const FOUR_PIECE_THRESHOLD = 4;

export const SET_BONDS: SetBonus[] = [
  {
    setId: 'shadow_reaper',
    name: 'Shadow Reaper',
    pieces2: '+12% ATK',
    pieces4: '+25% ATK',
    atkBonus2: ATK_2PC_MD,
    atkBonus4: ATK_4PC_LG,
  },
  {
    setId: 'iron_sentinel',
    name: 'Iron Sentinel',
    pieces2: '+12% DEF',
    pieces4: '+25% DEF',
    defBonus2: DEF_2PC_MD,
    defBonus4: DEF_4PC_MD,
  },
  {
    setId: 'dragons_wrath',
    name: "Dragon's Wrath",
    pieces2: '+10% ATK',
    pieces4: '+20% ATK, +10% HP',
    atkBonus2: ATK_2PC_SM,
    atkBonus4: ATK_4PC_MD,
    hpBonus4: HP_4PC_SM,
  },
  {
    setId: 'sacred_light',
    name: 'Sacred Light',
    pieces2: '+12% HP',
    pieces4: '+25% HP',
    hpBonus2: HP_2PC_MD,
    hpBonus4: HP_4PC_LG,
  },
  {
    setId: 'storm_wanderer',
    name: 'Storm Wanderer',
    pieces2: '+6% ATK, +6% DEF',
    pieces4: '+12% ATK, +12% DEF',
    atkBonus2: ATK_2PC_XS,
    defBonus2: DEF_2PC_XS,
    atkBonus4: ATK_4PC_XS,
    defBonus4: DEF_4PC_XS,
  },
];

function runeSetCounts(save: SaveData, unit: Unit): Record<string, number> {
  return runesOnUnit(save, unit).reduce<Record<string, number>>((acc, rune) => {
    if (!rune.setId) return acc;
    return { ...acc, [rune.setId]: (acc[rune.setId] ?? 0) + 1 };
  }, {});
}

type ActiveSetTier = typeof TWO_PIECE_THRESHOLD | typeof FOUR_PIECE_THRESHOLD;
type ActiveSet = { bonus: SetBonus; tier: ActiveSetTier };

export function activeSets(save: SaveData, unit: Unit): ActiveSet[] {
  const counts = runeSetCounts(save, unit);
  return SET_BONDS.flatMap<ActiveSet>((bonus) => {
    const count = counts[bonus.setId] ?? 0;
    if (count >= FOUR_PIECE_THRESHOLD) return [{ bonus, tier: FOUR_PIECE_THRESHOLD }];
    if (count >= TWO_PIECE_THRESHOLD) return [{ bonus, tier: TWO_PIECE_THRESHOLD }];
    return [];
  });
}

export function setStatMultipliers(save: SaveData, unit: Unit): { atk: number; def: number; hp: number } {
  return activeSets(save, unit).reduce(
    (acc, { bonus, tier }) => ({
      atk: acc.atk + (tier >= TWO_PIECE_THRESHOLD ? (bonus.atkBonus2 ?? 0) : 0) + (tier >= FOUR_PIECE_THRESHOLD ? (bonus.atkBonus4 ?? 0) : 0),
      def: acc.def + (tier >= TWO_PIECE_THRESHOLD ? (bonus.defBonus2 ?? 0) : 0) + (tier >= FOUR_PIECE_THRESHOLD ? (bonus.defBonus4 ?? 0) : 0),
      hp: acc.hp + (tier >= TWO_PIECE_THRESHOLD ? (bonus.hpBonus2 ?? 0) : 0) + (tier >= FOUR_PIECE_THRESHOLD ? (bonus.hpBonus4 ?? 0) : 0),
    }),
    { atk: 1, def: 1, hp: 1 },
  );
}
