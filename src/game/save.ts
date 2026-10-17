import { MAX_TEAM_SIZE } from './balance';
import { newSave } from './progression';
import { getFamily } from './roster';
import type { SaveData } from './types';

const KEY = 'dragonvision.save.v1';

function renameKey(record: Record<string, number>, from: string, to: string): Record<string, number> {
  if (!(from in record)) return record;
  const { [from]: value, ...rest } = record;
  return { ...rest, [to]: Math.max(value, rest[to] ?? 0) };
}

/** Older saves stored the team as a plain list; spread it onto the five pads. */
function migrate(save: SaveData): SaveData {
  const team = Array.from({ length: MAX_TEAM_SIZE }, (_, i): string | null => {
    const uid = save.team[i] ?? null;
    return uid && save.units.some((u) => u.uid === uid) ? uid : null;
  });
  if (!team.some(Boolean)) team[0] = save.units[0].uid;
  // Dojo and shards arrived after the first saves.
  const dojo = (save.dojo ?? []).filter((d) => save.units.some((u) => u.uid === d.uid));
  const fresh = newSave();
  return {
    ...save,
    team,
    dojo,
    shards: save.shards ?? {},
    // Striker was renamed Assassin.
    gravity: renameKey(save.gravity ?? {}, 'Striker', 'Assassin'),
    expeditions: (save.expeditions ?? []).filter((e) => e.uids.every((uid) => save.units.some((u) => u.uid === uid))),
    counters: { ...fresh.counters, ...save.counters },
    bounties: save.bounties ?? fresh.bounties,
    fortuneDay: save.fortuneDay ?? null,
    towerFloor: save.towerFloor ?? 0,
  };
}

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
  return true;
}

/** Everything is stored on the device, so the game works fully offline. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValid(parsed)) return migrate(parsed);
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
