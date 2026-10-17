import { type Rng, defaultRng } from './rng';
import { summon } from './summon';
import { dayKey } from './time';
import type { SaveData, Unit } from './types';

export function fortuneReady(save: SaveData, day = dayKey()): boolean {
  return save.fortuneDay !== day;
}

/** One free summon per day from the Fortune Teller. */
export function claimFortune(save: SaveData, rng: Rng = defaultRng, day = dayKey()): { save: SaveData; unit: Unit } {
  if (!fortuneReady(save, day)) throw new Error('Come back tomorrow for another free fortune.');
  const result = summon({ ...save, spins: save.spins + 1 }, rng, day);
  return { save: { ...result.save, fortuneDay: day }, unit: result.unit };
}
