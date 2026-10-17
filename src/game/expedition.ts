import { EXPEDITION_HOURS, EXPEDITION_MAX_PARTY, EXPEDITION_SLOTS, stageCoinReward } from './balance';
import { findUnit, isBusy } from './progression';
import { type Rng, defaultRng } from './rng';
import type { Expedition, SaveData } from './types';

const HOUR = 3_600_000;
const PARTY_FACTOR = [1, 1.6, 2.1];

/** What a party brings home; rolled once when it leaves. */
export function rollExpedition(save: SaveData, partySize: number, hours: number, rng: Rng = defaultRng): Expedition['reward'] {
  const base = stageCoinReward(Math.max(1, save.clearedStage));
  const coins = Math.round(base * hours * 0.5 * PARTY_FACTOR[partySize - 1]);
  const spins = (hours >= 8 ? 2 : hours >= 4 ? 1 : 0) + (partySize === EXPEDITION_MAX_PARTY && hours >= 4 ? 1 : 0);
  const gemRoll = rng();
  const gems = hours >= 8 ? (gemRoll < 0.3 ? 2 : 0) : hours >= 4 ? (gemRoll < 0.1 ? 1 : 0) : 0;
  return { coins, spins, gems };
}

export function startExpedition(save: SaveData, uids: string[], hours: number, now: number, rng: Rng = defaultRng): SaveData {
  const party = [...new Set(uids)];
  if (party.length === 0 || party.length > EXPEDITION_MAX_PARTY) throw new Error(`Send 1 to ${EXPEDITION_MAX_PARTY} fighters.`);
  if (!EXPEDITION_HOURS.includes(hours as 1)) throw new Error('Pick a trip length.');
  if (save.expeditions.length >= EXPEDITION_SLOTS) throw new Error(`Only ${EXPEDITION_SLOTS} expeditions can be out at once.`);
  for (const uid of party) {
    findUnit(save, uid);
    if (save.team.includes(uid)) throw new Error('Team fighters stay home. Pick idle fighters.');
    if (isBusy(save, uid)) throw new Error('That fighter is busy in the Dojo or on another trip.');
  }
  const expedition: Expedition = { id: now, uids: party, start: now, hours, reward: rollExpedition(save, party.length, hours, rng) };
  return { ...save, expeditions: [...save.expeditions, expedition] };
}

export function expeditionDone(expedition: Expedition, now: number): boolean {
  return now >= expedition.start + expedition.hours * HOUR;
}

export function timeLeft(expedition: Expedition, now: number): number {
  return Math.max(0, expedition.start + expedition.hours * HOUR - now);
}

export function claimExpedition(save: SaveData, id: number, now: number): SaveData {
  const expedition = save.expeditions.find((e) => e.id === id);
  if (!expedition) throw new Error('No such expedition');
  if (!expeditionDone(expedition, now)) throw new Error('Still away');
  const { coins, spins, gems } = expedition.reward;
  return {
    ...save,
    coins: save.coins + coins,
    spins: save.spins + spins,
    gems: save.gems + gems,
    expeditions: save.expeditions.filter((e) => e.id !== id),
  };
}

/** Calls a party home early with nothing to show for it. */
export function recallExpedition(save: SaveData, id: number): SaveData {
  return { ...save, expeditions: save.expeditions.filter((e) => e.id !== id) };
}
