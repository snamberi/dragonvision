import { newSave } from './progression';
import { getFamily } from './roster';
import type { SaveData } from './types';

const KEY = 'dragonvision.save.v1';

function isValid(data: unknown): data is SaveData {
  if (!data || typeof data !== 'object') return false;
  const save = data as SaveData;
  if (save.version !== 1 || !Array.isArray(save.units) || !Array.isArray(save.team) || save.units.length === 0) {
    return false;
  }
  try {
    save.units.forEach((u) => getFamily(u.familyId));
  } catch {
    return false;
  }
  return save.team.every((uid) => save.units.some((u) => u.uid === uid));
}

/** Everything is stored on the device, so the game works fully offline. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) return parsed;
    }
  } catch {
    // Storage blocked or corrupted: start fresh rather than crash.
  }
  return newSave();
}

export function writeSave(save: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Private mode or full storage; the session keeps working in memory.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
