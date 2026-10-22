import type { RelicItem, SaveData } from './types';

export interface RelicTemplate {
  id: string;
  name: string;
  effect: string;
  atkBonus: number;
  defBonus: number;
  hpBonus: number;
}

export const RELIC_CRAFT_COST = 3;

export const RELIC_TEMPLATES: RelicTemplate[] = [
  { id: 'dragon-heart', name: "Dragon's Heart", effect: '+8% ATK for all allies', atkBonus: 0.08, defBonus: 0, hpBonus: 0 },
  { id: 'iron-bastion', name: 'Iron Bastion', effect: '+8% DEF for all allies', atkBonus: 0, defBonus: 0.08, hpBonus: 0 },
  { id: 'life-crystal', name: 'Life Crystal', effect: '+10% HP for all allies', atkBonus: 0, defBonus: 0, hpBonus: 0.1 },
  { id: 'war-totem', name: 'War Totem', effect: '+5% ATK and +5% DEF', atkBonus: 0.05, defBonus: 0.05, hpBonus: 0 },
  { id: 'vitality-stone', name: 'Vitality Stone', effect: '+5% ATK and +5% HP', atkBonus: 0.05, defBonus: 0, hpBonus: 0.05 },
  { id: 'bulwark-gem', name: 'Bulwark Gem', effect: '+5% DEF and +5% HP', atkBonus: 0, defBonus: 0.05, hpBonus: 0.05 },
];

let nextRelicId = 1;

export function craftRelic(save: SaveData): SaveData {
  const shards = save.materials.relicShard ?? 0;
  if (shards < RELIC_CRAFT_COST) throw new Error('Not enough Relic Shards');
  const idx = Math.floor(Math.random() * RELIC_TEMPLATES.length);
  const tmpl = RELIC_TEMPLATES[idx];
  const relic: RelicItem = { id: `relic-${nextRelicId++}`, templateId: tmpl.id, effect: tmpl.effect };
  return {
    ...save,
    materials: { ...save.materials, relicShard: shards - RELIC_CRAFT_COST },
    relics: [...(save.relics ?? []), relic],
  };
}

export function equipRelic(save: SaveData, relicId: string): SaveData {
  const relic = (save.relics ?? []).find((r) => r.id === relicId);
  if (!relic) throw new Error('Relic not found');
  return { ...save, equippedRelic: relicId };
}

export function unequipRelic(save: SaveData): SaveData {
  return { ...save, equippedRelic: null };
}

export function equippedRelicTemplate(save: SaveData): RelicTemplate | null {
  if (!save.equippedRelic) return null;
  const relic = (save.relics ?? []).find((r) => r.id === save.equippedRelic);
  if (!relic) return null;
  return RELIC_TEMPLATES.find((t) => t.id === relic.templateId) ?? null;
}
