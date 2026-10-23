import { RARITIES, type Rarity, findItem, isBossSetTemplate, rollSub, wearer } from './gear';
import { type Rng, defaultRng } from './rng';
import type { GearItem, SaveData } from './types';

/** Forge Dust from salvaging one piece; boss set pieces give double. */
export const DUST_PER_RARITY: Record<Rarity, number> = { common: 1, uncommon: 3, rare: 8, epic: 20, legendary: 50 };
const BOSS_DUST_MULTIPLIER = 2;
/** Forge Dust to reroll one sub-stat. */
export const REROLL_COST: Record<Rarity, number> = { common: 2, uncommon: 4, rare: 10, epic: 25, legendary: 60 };

export function forgeDust(save: SaveData): number {
  return save.forgeDust ?? 0;
}

export function dustFor(item: GearItem): number {
  return DUST_PER_RARITY[item.rarity] * (isBossSetTemplate(item.templateId) ? BOSS_DUST_MULTIPLIER : 1);
}

export function salvageItem(save: SaveData, itemId: string): SaveData {
  const item = findItem(save, itemId);
  if (wearer(save, itemId)) throw new Error('Take it off first.');
  return { ...save, forgeDust: forgeDust(save) + dustFor(item), items: save.items.filter((i) => i.id !== itemId) };
}

function subTotal(item: GearItem): number {
  return (item.subs ?? []).reduce((sum, s) => sum + s.value, 0);
}

/** Higher rarity first, then the bigger sub-stat roll. */
function better(a: GearItem, b: GearItem): number {
  return RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || subTotal(b) - subTotal(a);
}

/**
 * Spare copies: for each piece, everything except worn copies and the single best unworn one.
 * When a copy is already worn, unworn copies that aren't rarer than it are spares too.
 */
export function duplicateItems(save: SaveData): GearItem[] {
  const groups = new Map<string, GearItem[]>();
  for (const item of save.items) groups.set(item.templateId, [...(groups.get(item.templateId) ?? []), item]);
  return [...groups.values()].flatMap((items) => {
    const worn = items.filter((i) => wearer(save, i.id));
    const loose = items.filter((i) => !wearer(save, i.id)).sort(better);
    const bestWorn = Math.max(-1, ...worn.map((i) => RARITIES.indexOf(i.rarity)));
    const keep = worn.length === 0 ? loose.slice(0, 1) : loose.filter((i) => RARITIES.indexOf(i.rarity) > bestWorn).slice(0, 1);
    return loose.filter((i) => !keep.includes(i));
  });
}

export function salvageDuplicates(save: SaveData): { save: SaveData; count: number; dust: number } {
  const spares = duplicateItems(save);
  const dust = spares.reduce((sum, i) => sum + dustFor(i), 0);
  const ids = new Set(spares.map((i) => i.id));
  return { save: { ...save, forgeDust: forgeDust(save) + dust, items: save.items.filter((i) => !ids.has(i.id)) }, count: spares.length, dust };
}

/** Rerolls one chosen sub-stat into a fresh stat and value (never a copy of the piece's other sub-stat). */
export function rerollSub(save: SaveData, itemId: string, index: number, rng: Rng = defaultRng): SaveData {
  const item = findItem(save, itemId);
  const subs = item.subs ?? [];
  if (!subs[index]) throw new Error('That piece has no such stat to reroll.');
  const cost = REROLL_COST[item.rarity];
  if (forgeDust(save) < cost) throw new Error('Not enough Forge Dust');
  const others = subs.filter((_, i) => i !== index).map((s) => s.stat);
  const next = subs.map((s, i) => (i === index ? rollSub(item.rarity, rng, [...others, s.stat]) : s));
  return {
    ...save,
    forgeDust: forgeDust(save) - cost,
    items: save.items.map((i) => (i.id === itemId ? { ...i, subs: next } : i)),
  };
}

export function rerollable(item: GearItem): boolean {
  return (item.subs ?? []).length > 0;
}
