// Everything in the Inventory that isn't gear: Spin Orbs, materials, evolution shards and legendary pieces.
import { RARITY_LABEL, getTemplate } from './gear';
import { PIECES_TO_FORGE } from './legendary';
import type { MarketGood } from './market';
import { LEGENDARIES, getFamily } from './roster';
import type { MaterialId, SaveData } from './types';

export type ItemCategory = 'items' | 'materials' | 'shards' | 'pieces';
export type ItemIconId = 'spinOrb' | 'shard' | 'piece' | 'refreshTicket' | 'respecScroll';

export interface InventoryEntry {
  key: string;
  name: string;
  count: number;
  /** Every entry shows under Items; this is its own tab too ('items' = no other tab). */
  category: ItemCategory;
  icon: ItemIconId;
  text: string;
  /** Legendary pieces: whose they are. */
  familyId?: string;
}

export const MATERIALS: Record<MaterialId, { name: string; text: string }> = {
  refreshTicket: { name: 'Refresh Ticket', text: 'Restocks the Shop or the Armory for free (used before gems).' },
  respecScroll: { name: 'Respec Scroll', text: "Resets a fighter's awakening points for free (used before gems)." },
};

export function inventoryEntries(save: SaveData): InventoryEntry[] {
  const entries: InventoryEntry[] = [];
  if (save.spins > 0) {
    entries.push({
      key: 'spins',
      name: 'Spin Orb',
      count: save.spins,
      category: 'items',
      icon: 'spinOrb',
      text: 'Summons one fighter at the Summoning Shrine in the City.',
    });
  }
  for (const id of Object.keys(MATERIALS) as MaterialId[]) {
    if (save.materials[id] > 0) {
      entries.push({ key: id, name: MATERIALS[id].name, count: save.materials[id], category: 'materials', icon: id, text: MATERIALS[id].text });
    }
  }
  for (const [star, count] of Object.entries(save.shards)) {
    if (count > 0) {
      entries.push({
        key: `shard-${star}`,
        name: `${star}★ Evolution Shard`,
        count,
        category: 'shards',
        icon: 'shard',
        text: `Counts as one duplicate when evolving a ${star}★ fighter. Made in the Fusion Lab.`,
      });
    }
  }
  for (const family of LEGENDARIES) {
    const count = save.pieces[family.id] ?? 0;
    if (count > 0) {
      entries.push({
        key: `piece-${family.id}`,
        name: `${family.name} Piece`,
        count,
        category: 'pieces',
        icon: 'piece',
        familyId: family.id,
        text: `${count}/${PIECES_TO_FORGE} to forge ${family.name}, ${family.title}.`,
      });
    }
  }
  return entries;
}

export function goodName(good: MarketGood): string {
  switch (good.kind) {
    case 'spins':
      return `${good.count} Spin Orb${good.count === 1 ? '' : 's'}`;
    case 'shard':
      return `${good.star}★ Evolution Shard`;
    case 'gear':
      return `${RARITY_LABEL[good.rarity]} ${getTemplate(good.templateId).name}`;
    case 'material':
      return MATERIALS[good.id].name;
    case 'piece':
      return `${getFamily(good.familyId).name} Piece`;
  }
}
