import { type Bonus, addBonus, emptyBonus } from './bonus';
import { stageCoinReward } from './balance';
import { findUnit } from './progression';
import { type Rng, defaultRng, pickWeighted, seededRng } from './rng';
import { dayKey, hashString } from './time';
import type { GearItem, GearSlotKey, SaveData, Unit } from './types';

export type GearKind = 'weapon' | 'armor' | 'accessory';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};
/** Item stats scale with rarity. */
const RARITY_POWER: Record<Rarity, number> = { common: 1, uncommon: 1.6, rare: 2.4, epic: 3.5, legendary: 5 };

export const SLOT_KINDS: Record<GearSlotKey, GearKind> = { weapon: 'weapon', armor: 'armor', acc1: 'accessory', acc2: 'accessory' };
export const SLOT_LABEL: Record<GearSlotKey, string> = { weapon: 'Weapon', armor: 'Armor', acc1: 'Accessory', acc2: 'Accessory' };

export interface GearTemplate {
  id: string;
  name: string;
  kind: GearKind;
  setId: string;
  /** Stats at Common; multiplied by rarity. */
  base: Partial<Bonus>;
}

export interface GearSet {
  id: string;
  name: string;
  color: string;
  two: Partial<Bonus>;
  four: Partial<Bonus>;
}

// Every set has a weapon, armor and two different accessories, so one fighter can wear all four.
export const SETS: GearSet[] = [
  { id: 'ember', name: 'Ember', color: '#ff7a3d', two: { atk: 0.1 }, four: { charge: 1 } },
  { id: 'bulwark', name: 'Bulwark', color: '#7fb2ff', two: { hp: 0.15 }, four: { shield: 0.2 } },
  { id: 'tempest', name: 'Tempest', color: '#7fe7ff', two: { spd: 4 }, four: { crit: 0.15 } },
  { id: 'sage', name: 'Sage', color: '#8ef0a8', two: { heal: 0.2 }, four: { ki: 40 } },
  { id: 'void', name: 'Void', color: '#b794ff', two: { atk: 0.08 }, four: { edge: 0.2 } },
];

export const TEMPLATES: GearTemplate[] = [
  { id: 'ember-blade', name: 'Ember Blade', kind: 'weapon', setId: 'ember', base: { atk: 0.05 } },
  { id: 'ember-gi', name: 'Ember Gi', kind: 'armor', setId: 'ember', base: { hp: 0.04, shield: 0.01 } },
  { id: 'ember-band', name: 'Ember Band', kind: 'accessory', setId: 'ember', base: { crit: 0.02 } },
  { id: 'ember-charm', name: 'Ember Charm', kind: 'accessory', setId: 'ember', base: { ki: 5 } },
  { id: 'bulwark-hammer', name: 'Bulwark Hammer', kind: 'weapon', setId: 'bulwark', base: { atk: 0.03, def: 0.02 } },
  { id: 'bulwark-plate', name: 'Bulwark Plate', kind: 'armor', setId: 'bulwark', base: { hp: 0.06, shield: 0.015 } },
  { id: 'bulwark-ring', name: 'Bulwark Ring', kind: 'accessory', setId: 'bulwark', base: { def: 0.04 } },
  { id: 'bulwark-seal', name: 'Bulwark Seal', kind: 'accessory', setId: 'bulwark', base: { hp: 0.04 } },
  { id: 'tempest-staff', name: 'Tempest Staff', kind: 'weapon', setId: 'tempest', base: { atk: 0.04, crit: 0.01 } },
  { id: 'tempest-cloak', name: 'Tempest Cloak', kind: 'armor', setId: 'tempest', base: { hp: 0.04, shield: 0.01 } },
  { id: 'tempest-boots', name: 'Tempest Boots', kind: 'accessory', setId: 'tempest', base: { spd: 1 } },
  { id: 'tempest-earring', name: 'Tempest Earring', kind: 'accessory', setId: 'tempest', base: { crit: 0.02 } },
  { id: 'sage-rod', name: 'Sage Rod', kind: 'weapon', setId: 'sage', base: { atk: 0.03, heal: 0.03 } },
  { id: 'sage-robe', name: 'Sage Robe', kind: 'armor', setId: 'sage', base: { hp: 0.05, shield: 0.01 } },
  { id: 'sage-beads', name: 'Sage Beads', kind: 'accessory', setId: 'sage', base: { heal: 0.05 } },
  { id: 'sage-lotus', name: 'Sage Lotus', kind: 'accessory', setId: 'sage', base: { ki: 5 } },
  { id: 'void-edge', name: 'Void Edge', kind: 'weapon', setId: 'void', base: { atk: 0.06 } },
  { id: 'void-mantle', name: 'Void Mantle', kind: 'armor', setId: 'void', base: { hp: 0.04, shield: 0.01 } },
  { id: 'void-eye', name: 'Void Eye', kind: 'accessory', setId: 'void', base: { crit: 0.02 } },
  { id: 'void-fang', name: 'Void Fang', kind: 'accessory', setId: 'void', base: { atk: 0.03 } },
];

const templateById = new Map(TEMPLATES.map((t) => [t.id, t]));
const setById = new Map(SETS.map((s) => [s.id, s]));

export function getTemplate(id: string): GearTemplate {
  const t = templateById.get(id);
  if (!t) throw new Error(`Unknown gear: ${id}`);
  return t;
}

export function getSet(id: string): GearSet {
  return setById.get(id)!;
}

/** An item's own stats after rarity. Flat stats round to whole numbers. */
export function itemBonus(item: Pick<GearItem, 'templateId' | 'rarity'>): Partial<Bonus> {
  const power = RARITY_POWER[item.rarity];
  const out: Partial<Bonus> = {};
  for (const [key, value] of Object.entries(getTemplate(item.templateId).base) as [keyof Bonus, number][]) {
    out[key] = key === 'spd' || key === 'ki' ? Math.round(value * power) : Math.round(value * power * 1000) / 1000;
  }
  return out;
}

export function findItem(save: SaveData, id: string): GearItem {
  const item = save.items.find((i) => i.id === id);
  if (!item) throw new Error('No such item');
  return item;
}

/** Which fighter has an item on, if any. */
export function wearer(save: SaveData, itemId: string): Unit | undefined {
  return save.units.find((u) => u.gear && Object.values(u.gear).includes(itemId));
}

export function equippedItems(save: SaveData, unit: Unit): GearItem[] {
  return Object.values(unit.gear ?? {})
    .filter((id): id is string => Boolean(id))
    .map((id) => save.items.find((i) => i.id === id))
    .filter((i): i is GearItem => Boolean(i));
}

/** Sets a fighter is wearing and how many pieces of each. */
export function setCounts(save: SaveData, unit: Unit): { set: GearSet; pieces: number }[] {
  const counts = new Map<string, number>();
  for (const item of equippedItems(save, unit)) {
    const setId = getTemplate(item.templateId).setId;
    counts.set(setId, (counts.get(setId) ?? 0) + 1);
  }
  return [...counts.entries()].map(([id, pieces]) => ({ set: getSet(id), pieces }));
}

/** Item stats plus 2- and 4-piece set bonuses. */
export function gearBonus(save: SaveData, unit: Unit): Bonus {
  let total = emptyBonus();
  for (const item of equippedItems(save, unit)) total = addBonus(total, itemBonus(item));
  for (const { set, pieces } of setCounts(save, unit)) {
    if (pieces >= 2) total = addBonus(total, set.two);
    if (pieces >= 4) total = addBonus(total, set.four);
  }
  return total;
}

/** Puts an item in a slot, taking it off whoever had it. */
export function equip(save: SaveData, uid: string, slot: GearSlotKey, itemId: string): SaveData {
  findUnit(save, uid);
  const item = findItem(save, itemId);
  if (getTemplate(item.templateId).kind !== SLOT_KINDS[slot]) throw new Error(`That doesn't go in the ${SLOT_LABEL[slot]} slot.`);
  const units = save.units.map((u) => {
    let gear = { ...(u.gear ?? {}) };
    for (const key of Object.keys(gear) as GearSlotKey[]) if (gear[key] === itemId) delete gear[key];
    if (u.uid === uid) gear = { ...gear, [slot]: itemId };
    return { ...u, gear };
  });
  return { ...save, units };
}

export function unequip(save: SaveData, uid: string, slot: GearSlotKey): SaveData {
  return {
    ...save,
    units: save.units.map((u) => {
      if (u.uid !== uid || !u.gear) return u;
      const gear = { ...u.gear };
      delete gear[slot];
      return { ...u, gear };
    }),
  };
}

// --- Getting and selling gear ---

const SELL_BASE: Record<Rarity, number> = { common: 100, uncommon: 250, rare: 700, epic: 2000, legendary: 6000 };

export function sellValueOf(item: GearItem): number {
  return SELL_BASE[item.rarity];
}

export function addItem(save: SaveData, templateId: string, rarity: Rarity): { save: SaveData; item: GearItem } {
  const item: GearItem = { id: `g${save.nextItemId}`, templateId, rarity };
  return { save: { ...save, items: [...save.items, item], nextItemId: save.nextItemId + 1 }, item };
}

export function sellItem(save: SaveData, itemId: string): SaveData {
  const item = findItem(save, itemId);
  if (wearer(save, itemId)) throw new Error('Take it off first.');
  return { ...save, coins: save.coins + sellValueOf(item), items: save.items.filter((i) => i.id !== itemId) };
}

/** Better rarities show up more the further you are in the story. */
export function rarityWeights(clearedStage: number): Record<Rarity, number> {
  const p = Math.min(1, clearedStage / 300);
  return { common: 50 * (1 - p) + 5, uncommon: 30, rare: 14 + 20 * p, epic: 5 + 14 * p, legendary: 1 + 6 * p };
}

export function rollRarity(clearedStage: number, rng: Rng = defaultRng): Rarity {
  const w = rarityWeights(clearedStage);
  return pickWeighted(rng, RARITIES, (r) => w[r]);
}

export function rollItem(save: SaveData, rng: Rng = defaultRng, minRarity: Rarity = 'common'): { save: SaveData; item: GearItem } {
  const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
  let rarity = rollRarity(save.clearedStage, rng);
  if (RARITIES.indexOf(rarity) < RARITIES.indexOf(minRarity)) rarity = minRarity;
  return addItem(save, template.id, rarity);
}

// --- Armory shop ---

export const SHOP_SIZE = 6;
export const SHOP_REFRESH_GEMS = 5;

export interface ShopOffer {
  templateId: string;
  rarity: Rarity;
  coins: number;
  /** Epic and Legendary also cost gems. */
  gems: number;
}

const PRICE_SCALE: Record<Rarity, number> = { common: 0.6, uncommon: 1.2, rare: 3, epic: 8, legendary: 20 };
const GEM_PRICE: Record<Rarity, number> = { common: 0, uncommon: 0, rare: 0, epic: 3, legendary: 10 };

/** Today's stock: the same all day, changing at midnight or when refreshed with gems. */
export function shopStock(save: SaveData, day = dayKey()): ShopOffer[] {
  const rng = seededRng(hashString(`${day}:${save.shop.refreshes}`));
  const base = stageCoinReward(Math.max(1, save.clearedStage));
  return Array.from({ length: SHOP_SIZE }, () => {
    const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    const rarity = rollRarity(save.clearedStage, rng);
    return { templateId: template.id, rarity, coins: Math.round(base * PRICE_SCALE[rarity]), gems: GEM_PRICE[rarity] };
  });
}

/** Keeps the shop's day current; refreshes reset at midnight. */
export function syncShop(save: SaveData, day = dayKey()): SaveData {
  return save.shop.day === day ? save : { ...save, shop: { day, refreshes: 0, bought: [] } };
}

export function buyOffer(save: SaveData, index: number, day = dayKey()): SaveData {
  const synced = syncShop(save, day);
  const offer = shopStock(synced, day)[index];
  if (!offer) throw new Error('No such offer');
  if (synced.shop.bought.includes(index)) throw new Error('Already bought today.');
  if (synced.coins < offer.coins) throw new Error('Not enough coins');
  if (synced.gems < offer.gems) throw new Error('Not enough gems');
  const { save: withItem } = addItem(synced, offer.templateId, offer.rarity);
  return {
    ...withItem,
    coins: withItem.coins - offer.coins,
    gems: withItem.gems - offer.gems,
    shop: { ...withItem.shop, bought: [...withItem.shop.bought, index] },
  };
}

/** New stock: a Refresh Ticket if you have one, otherwise gems. */
export function refreshShop(save: SaveData, day = dayKey()): SaveData {
  const synced = syncShop(save, day);
  const shop = { day, refreshes: synced.shop.refreshes + 1, bought: [] };
  if (synced.materials.refreshTicket > 0) {
    return { ...synced, shop, materials: { ...synced.materials, refreshTicket: synced.materials.refreshTicket - 1 } };
  }
  if (synced.gems < SHOP_REFRESH_GEMS) throw new Error('Not enough gems');
  return { ...synced, gems: synced.gems - SHOP_REFRESH_GEMS, shop };
}
