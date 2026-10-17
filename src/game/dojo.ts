import { DOJO_MINUTES_PER_LEVEL, DOJO_SLOTS, levelCap } from './balance';
import { findUnit, isTraining } from './progression';
import type { DojoSlot, SaveData } from './types';

const MS_PER_LEVEL = DOJO_MINUTES_PER_LEVEL * 60_000;

export interface DojoProgress {
  /** Levels earned and ready to collect. */
  ready: number;
  /** 0–1 progress toward the next level. */
  partial: number;
  /** The fighter is at its level wall and can't train further. */
  capped: boolean;
}

export function dojoProgress(save: SaveData, slot: DojoSlot, now: number): DojoProgress {
  const unit = findUnit(save, slot.uid);
  const room = levelCap(unit.star) - unit.level;
  const elapsed = Math.max(0, now - slot.since);
  const ready = Math.min(room, Math.floor(elapsed / MS_PER_LEVEL));
  const capped = ready >= room;
  return { ready, partial: capped ? 1 : (elapsed % MS_PER_LEVEL) / MS_PER_LEVEL, capped };
}

/** Puts an idle fighter (not on the team) into a free Dojo slot. */
export function startTraining(save: SaveData, uid: string, now: number): SaveData {
  if (save.team.includes(uid)) throw new Error('Take this fighter off the team before training.');
  if (isTraining(save, uid)) throw new Error('Already training.');
  if (save.dojo.length >= DOJO_SLOTS) throw new Error(`The Dojo only has ${DOJO_SLOTS} spots.`);
  const unit = findUnit(save, uid);
  if (unit.level >= levelCap(unit.star)) throw new Error('This fighter is at its level wall. Evolve it first.');
  return { ...save, dojo: [...save.dojo, { uid, since: now }] };
}

/** Adds earned levels, keeping leftover time toward the next level. */
export function collectTraining(save: SaveData, uid: string, now: number): SaveData {
  const slot = save.dojo.find((d) => d.uid === uid);
  if (!slot) throw new Error('Not training.');
  const { ready, capped } = dojoProgress(save, slot, now);
  const units = save.units.map((u) =>
    u.uid === uid ? { ...u, level: u.level + ready, trainedLevels: (u.trainedLevels ?? 0) + ready } : u,
  );
  const since = capped ? now : slot.since + ready * MS_PER_LEVEL;
  return { ...save, units, dojo: save.dojo.map((d) => (d.uid === uid ? { ...d, since } : d)) };
}

/** Collects any earned levels and frees the slot. */
export function stopTraining(save: SaveData, uid: string, now: number): SaveData {
  const collected = collectTraining(save, uid, now);
  return { ...collected, dojo: collected.dojo.filter((d) => d.uid !== uid) };
}
