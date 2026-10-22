const BOND_ATK_BONUS = 0.10;
const BOND_DEF_BONUS = 0.10;

export interface BondPair {
  ids: [string, string];
  name: string;
  bonus: { atkBonus: number; defBonus: number };
}

export const BOND_PAIRS: BondPair[] = [
  { ids: ['kairo', 'varek'], name: 'Rival Sparks', bonus: { atkBonus: BOND_ATK_BONUS, defBonus: BOND_DEF_BONUS } },
  { ids: ['kairo', 'sora'], name: 'Eternal Rivals', bonus: { atkBonus: BOND_ATK_BONUS, defBonus: BOND_DEF_BONUS } },
  { ids: ['orrin', 'zeno'], name: 'Ancient Wisdom', bonus: { atkBonus: BOND_ATK_BONUS, defBonus: BOND_DEF_BONUS } },
  { ids: ['mei', 'aya'], name: 'Storm Blossoms', bonus: { atkBonus: BOND_ATK_BONUS, defBonus: BOND_DEF_BONUS } },
  { ids: ['jin', 'kenji'], name: 'Steel and Sage', bonus: { atkBonus: BOND_ATK_BONUS, defBonus: BOND_DEF_BONUS } },
  { ids: ['bruno', 'lyra'], name: 'Star Wall', bonus: { atkBonus: BOND_ATK_BONUS, defBonus: BOND_DEF_BONUS } },
];

export function activeBonds(teamFamilyIds: string[]): BondPair[] {
  return BOND_PAIRS.filter((pair) => pair.ids.every((id) => teamFamilyIds.includes(id)));
}

export function bondBonus(familyId: string, teamFamilyIds: string[]): { atkBonus: number; defBonus: number } {
  const active = activeBonds(teamFamilyIds);
  const relevant = active.filter((pair) => pair.ids.includes(familyId));
  return relevant.reduce(
    (acc, pair) => ({ atkBonus: acc.atkBonus + pair.bonus.atkBonus, defBonus: acc.defBonus + pair.bonus.defBonus }),
    { atkBonus: 0, defBonus: 0 },
  );
}
