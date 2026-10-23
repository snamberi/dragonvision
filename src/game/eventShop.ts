// What event currency buys. Stock and limits reset with the event each week; bought skins stay owned.
import { bestStar } from './sideModes';
import { type EventDef, currentEvent, eventProgress, syncEvent } from './events';
import { grantMaterials } from './materials';
import { getSkin, ownSkin } from './skins';
import { getFamily } from './roster';
import { type Pull, summonFamily } from './summon';
import { type Rng, defaultRng } from './rng';
import type { SaveData } from './types';

export type EventGood =
  | { kind: 'skin'; skinId: string }
  | { kind: 'featured' }
  | { kind: 'spins'; count: number }
  | { kind: 'shard'; starsBelowBest: number }
  | { kind: 'essence'; count: number }
  | { kind: 'crystals'; count: number };

export interface EventOffer {
  id: string;
  label: string;
  price: number;
  /** Purchases allowed per event. */
  limit: number;
  good: EventGood;
}

const SKIN_PRICE = 400;
const FEATURED_PRICE = 120;
const FEATURED_LIMIT = 5;
const SPINS_PRICE = 60;
const SPINS_COUNT = 5;
const SPINS_LIMIT = 3;
const SHARD_PRICE = 150;
const SHARD_LIMIT = 2;
const SHARD_STARS_BELOW_BEST = 2;
const ESSENCE_PRICE = 80;
const ESSENCE_COUNT = 2;
const MATERIAL_LIMIT = 3;
const CRYSTAL_PRICE = 100;

export function eventOffers(ev: EventDef = currentEvent()): EventOffer[] {
  const featured = getFamily(ev.featured).name;
  return [
    { id: 'skin', label: `${getSkin(ev.skinId)?.name ?? 'Event'} skin (${featured})`, price: SKIN_PRICE, limit: 1, good: { kind: 'skin', skinId: ev.skinId } },
    { id: 'featured', label: `${featured} summon`, price: FEATURED_PRICE, limit: FEATURED_LIMIT, good: { kind: 'featured' } },
    { id: 'spins', label: `${SPINS_COUNT} Spin Orbs`, price: SPINS_PRICE, limit: SPINS_LIMIT, good: { kind: 'spins', count: SPINS_COUNT } },
    { id: 'shard', label: `Evolution shard (best star −${SHARD_STARS_BELOW_BEST})`, price: SHARD_PRICE, limit: SHARD_LIMIT, good: { kind: 'shard', starsBelowBest: SHARD_STARS_BELOW_BEST } },
    { id: 'essence', label: `${ESSENCE_COUNT} Signature Essence`, price: ESSENCE_PRICE, limit: MATERIAL_LIMIT, good: { kind: 'essence', count: ESSENCE_COUNT } },
    { id: 'crystals', label: '1 Transcendence Crystal', price: CRYSTAL_PRICE, limit: MATERIAL_LIMIT, good: { kind: 'crystals', count: 1 } },
  ];
}

export function offerLeft(save: SaveData, offer: EventOffer, now = new Date()): number {
  const bought = eventProgress(save, now).bought[offer.id] ?? 0;
  if (offer.good.kind === 'skin' && (save.ownedSkins ?? []).includes(offer.good.skinId)) return 0;
  return Math.max(0, offer.limit - bought);
}

function grant(save: SaveData, good: EventGood, ev: EventDef, rng: Rng): { save: SaveData; pull?: Pull } {
  switch (good.kind) {
    case 'skin':
      return { save: ownSkin(save, good.skinId) };
    case 'featured': {
      const pull = summonFamily(save, ev.featured, rng);
      return { save: pull.save, pull };
    }
    case 'spins':
      return { save: { ...save, spins: save.spins + good.count } };
    case 'shard': {
      const star = Math.max(1, bestStar(save) - good.starsBelowBest);
      return { save: { ...save, shards: { ...save.shards, [star]: (save.shards[star] ?? 0) + 1 } } };
    }
    case 'essence':
      return { save: grantMaterials(save, { essence: good.count }) };
    case 'crystals':
      return { save: grantMaterials(save, { crystals: good.count }) };
  }
}

export function buyEventOffer(save: SaveData, offerId: string, now = new Date(), rng: Rng = defaultRng): { save: SaveData; pull?: Pull } {
  const ev = currentEvent(now);
  const offer = eventOffers(ev).find((o) => o.id === offerId);
  if (!offer) throw new Error('No such offer');
  const synced = syncEvent(save, now);
  if (offerLeft(synced, offer, now) <= 0) throw new Error('Sold out for this event');
  const progress = synced.event!;
  if (progress.currency < offer.price) throw new Error(`Not enough ${ev.currency}`);
  const paid: SaveData = {
    ...synced,
    event: { ...progress, currency: progress.currency - offer.price, bought: { ...progress.bought, [offer.id]: (progress.bought[offer.id] ?? 0) + 1 } },
  };
  return grant(paid, offer.good, ev, rng);
}
