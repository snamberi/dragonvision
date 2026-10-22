// The Shop: six random offers and one legendary offer a day, refreshed at midnight or for gems / a Refresh Ticket.
import { SHARD_PRICE_BASE, SHARD_PRICE_GROWTH, spinPrice, stageCoinReward } from './balance';
import { RARITIES, type Rarity, SHOP_REFRESH_GEMS, TEMPLATES, addItem, rollRarity } from './gear';
import { addPieces, randomLegendId } from './legendary';
import { type Rng, seededRng } from './rng';
import { dayKey, hashString } from './time';
import type { MaterialId, SaveData } from './types';

export type MarketGood =
  | { kind: 'spins'; count: number }
  | { kind: 'shard'; star: number }
  | { kind: 'gear'; templateId: string; rarity: Rarity }
  | { kind: 'material'; id: MaterialId; count: number }
  | { kind: 'piece'; familyId: string };

export interface MarketOffer {
  good: MarketGood;
  coins: number;
  gems: number;
  /** The seventh, gold slot. */
  legendary: boolean;
}

export const MARKET_RANDOM = 6;
/** Index of the legendary offer in the stock. */
export const LEGENDARY_SLOT = MARKET_RANDOM;

function bestStar(save: SaveData): number {
  return Math.max(1, ...save.units.map((u) => u.star));
}

/** A shard of star s stands in for 3^(s-1) one-star copies, so its price climbs with the star. */
export function shardPrice(stageCoins: number, star: number): number {
  return Math.round(stageCoins * SHARD_PRICE_BASE * Math.pow(SHARD_PRICE_GROWTH, star - 1));
}

function randomOffer(save: SaveData, rng: Rng): MarketOffer {
  const coin = stageCoinReward(Math.max(1, save.clearedStage));
  const spin = spinPrice(save.clearedStage);
  const roll = rng();
  if (roll < 0.25) {
    const count = rng() < 0.6 ? 1 : 5;
    return { good: { kind: 'spins', count }, coins: Math.round(spin * count * 0.9), gems: 0, legendary: false };
  }
  if (roll < 0.45) {
    const star = 1 + Math.floor(rng() * bestStar(save));
    return { good: { kind: 'shard', star }, coins: shardPrice(coin, star), gems: 0, legendary: false };
  }
  if (roll < 0.75) {
    const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
    let rarity = rollRarity(save.clearedStage, rng);
    if (rarity === 'legendary') rarity = 'epic';
    const scale = 0.8 + RARITIES.indexOf(rarity) * 1.4;
    return { good: { kind: 'gear', templateId: template.id, rarity }, coins: Math.round(coin * scale), gems: 0, legendary: false };
  }
  const id: MaterialId = rng() < 0.5 ? 'refreshTicket' : 'respecScroll';
  return { good: { kind: 'material', id, count: 1 }, coins: Math.round(coin * 1.5), gems: 0, legendary: false };
}

/** 20 Spin Orbs, one legendary piece (never more than one at a time) or a Legendary piece of gear. */
function legendaryOffer(rng: Rng): MarketOffer {
  const roll = rng();
  if (roll < 1 / 3) return { good: { kind: 'spins', count: 20 }, coins: 0, gems: 60, legendary: true };
  if (roll < 2 / 3) return { good: { kind: 'piece', familyId: randomLegendId(rng) }, coins: 0, gems: 80, legendary: true };
  const template = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
  return { good: { kind: 'gear', templateId: template.id, rarity: 'legendary' }, coins: 0, gems: 100, legendary: true };
}

export function marketStock(save: SaveData, day = dayKey()): MarketOffer[] {
  const rng = seededRng(hashString(`market:${day}:${save.market.refreshes}`));
  const offers = Array.from({ length: MARKET_RANDOM }, () => randomOffer(save, rng));
  return [...offers, legendaryOffer(rng)];
}

export function syncMarket(save: SaveData, day = dayKey()): SaveData {
  return save.market.day === day ? save : { ...save, market: { day, refreshes: 0, bought: [] } };
}

export function grantGood(save: SaveData, good: MarketGood): SaveData {
  switch (good.kind) {
    case 'spins':
      return { ...save, spins: save.spins + good.count };
    case 'shard':
      return { ...save, shards: { ...save.shards, [good.star]: (save.shards[good.star] ?? 0) + 1 } };
    case 'gear':
      return addItem(save, good.templateId, good.rarity).save;
    case 'material':
      return { ...save, materials: { ...save.materials, [good.id]: save.materials[good.id] + good.count } };
    case 'piece':
      return addPieces(save, good.familyId);
  }
}

export function buyMarketOffer(save: SaveData, index: number, day = dayKey()): SaveData {
  const synced = syncMarket(save, day);
  const offer = marketStock(synced, day)[index];
  if (!offer) throw new Error('No such offer');
  if (synced.market.bought.includes(index)) throw new Error('Sold out until the next stock.');
  if (synced.coins < offer.coins) throw new Error('Not enough coins');
  if (synced.gems < offer.gems) throw new Error('Not enough gems');
  const paid = { ...synced, coins: synced.coins - offer.coins, gems: synced.gems - offer.gems };
  const after = grantGood(paid, offer.good);
  return { ...after, market: { ...after.market, bought: [...after.market.bought, index] } };
}

/** New stock: a Refresh Ticket if you have one, otherwise gems. */
export function refreshMarket(save: SaveData, day = dayKey()): SaveData {
  const synced = syncMarket(save, day);
  const market = { day, refreshes: synced.market.refreshes + 1, bought: [] };
  if (synced.materials.refreshTicket > 0) {
    return { ...synced, market, materials: { ...synced.materials, refreshTicket: synced.materials.refreshTicket - 1 } };
  }
  if (synced.gems < SHOP_REFRESH_GEMS) throw new Error('Not enough gems');
  return { ...synced, gems: synced.gems - SHOP_REFRESH_GEMS, market };
}
