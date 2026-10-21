import type { SaveData, Unit } from './types';

export interface Rune {
  id: string;
  name: string;
  slot: 'offense' | 'defense';
  effect: string;
  atkBonus?: number;
  defBonus?: number;
  hpBonus?: number;
  setId?: string;
}

export const RUNE_FRAG_COST = 3;
export const RUNE_SLOT_COUNT = 2;

const ATK_SM = 0.05;
const ATK_MD = 0.10;
const ATK_COMBO = 0.08;
const ATK_LG = 0.15;
const DEF_SM = 0.05;
const DEF_MD = 0.10;
const DEF_COMBO = 0.08;
const DEF_LG = 0.15;
const HP_XS = 0.03;
const HP_SM = 0.08;
const HP_MD = 0.12;
const RUNE_ID_RADIX = 36;
const RUNE_ID_SLICE = 2;

export const RUNE_TEMPLATES: Omit<Rune, 'id'>[] = [
  { name: 'Rough Edge',     slot: 'offense', effect: '+5% ATK',          atkBonus: ATK_SM },
  { name: 'Cut Edge',       slot: 'offense', effect: '+10% ATK',         atkBonus: ATK_MD },
  { name: 'Polished Fang',  slot: 'offense', effect: '+8% ATK, +3% HP',  atkBonus: ATK_COMBO, hpBonus: HP_XS },
  { name: 'Radiant Claw',   slot: 'offense', effect: '+15% ATK',         atkBonus: ATK_LG },
  { name: 'Iron Scale',     slot: 'defense', effect: '+5% DEF',          defBonus: DEF_SM },
  { name: 'Tempered Scale', slot: 'defense', effect: '+10% DEF',         defBonus: DEF_MD },
  { name: 'Dragon Hide',    slot: 'defense', effect: '+8% DEF, +3% HP',  defBonus: DEF_COMBO, hpBonus: HP_XS },
  { name: 'Radiant Shield', slot: 'defense', effect: '+15% DEF',         defBonus: DEF_LG },
  { name: 'Life Crystal',   slot: 'offense', effect: '+8% HP',           hpBonus: HP_SM },
  { name: 'Vital Core',     slot: 'defense', effect: '+12% HP',          hpBonus: HP_MD },
];

export function craftRune(save: SaveData, templateIdx: number): SaveData {
  if (templateIdx < 0 || templateIdx >= RUNE_TEMPLATES.length) throw new Error('Invalid rune template');
  const frags = save.runeFragments ?? 0;
  if (frags < RUNE_FRAG_COST) throw new Error(`Need ${RUNE_FRAG_COST} rune fragments to craft a rune`);
  const id = `rune_${Date.now()}_${Math.random().toString(RUNE_ID_RADIX).slice(RUNE_ID_SLICE)}`;
  const rune: Rune = { ...RUNE_TEMPLATES[templateIdx], id };
  return { ...save, runeFragments: frags - RUNE_FRAG_COST, runes: [...(save.runes ?? []), rune] };
}

export function equipRune(save: SaveData, unitUid: string, slot: 0 | 1, runeId: string): SaveData {
  const rune = (save.runes ?? []).find((r) => r.id === runeId);
  if (!rune) throw new Error('Rune not found');
  return {
    ...save,
    units: save.units.map((u) => {
      if (u.uid !== unitUid) return u;
      const slots = [...(u.runeSlots ?? [null, null])];
      slots[slot] = runeId;
      return { ...u, runeSlots: slots };
    }),
  };
}

export function unequipRune(save: SaveData, unitUid: string, slot: 0 | 1): SaveData {
  return {
    ...save,
    units: save.units.map((u) => {
      if (u.uid !== unitUid) return u;
      const slots = [...(u.runeSlots ?? [null, null])];
      slots[slot] = null;
      return { ...u, runeSlots: slots };
    }),
  };
}

export function runesOnUnit(save: SaveData, unit: Unit): Rune[] {
  return (unit.runeSlots ?? [])
    .filter(Boolean)
    .map((id) => (save.runes ?? []).find((r) => r.id === id))
    .filter(Boolean) as Rune[];
}
