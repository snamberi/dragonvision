import { MAX_TEAM_SIZE, FATE_RAGE_THRESHOLD, PITY_THRESHOLD } from './balance';
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
    goldenOrbs: Number.isSafeInteger(save.goldenOrbs) && save.goldenOrbs! >= 0 ? save.goldenOrbs : 0,
    dojo,
    shards: save.shards ?? {},
    // Striker was renamed Assassin.
    gravity: renameKey(save.gravity ?? {}, 'Striker', 'Assassin'),
    expeditions: (save.expeditions ?? []).filter((e) => e.uids.every((uid) => save.units.some((u) => u.uid === uid))),
    counters: { ...fresh.counters, ...save.counters },
    bounties: save.bounties ?? fresh.bounties,
    fortuneDay: save.fortuneDay ?? null,
    towerFloor: save.towerFloor ?? 0,
    items: save.items ?? [],
    forgeDust: save.forgeDust ?? 0,
    nextItemId: save.nextItemId ?? 1,
    shop: save.shop ?? fresh.shop,
    seenScenes: save.seenScenes ?? [],
    worldBoss: save.worldBoss ?? fresh.worldBoss,
    survivalBest: save.survivalBest ?? 0,
    achievements: save.achievements ?? [],
    title: save.title ?? null,
    seenForms: save.seenForms ?? [],
    login: save.login ?? fresh.login,
    pieces: save.pieces ?? {},
    materials: { ...fresh.materials, ...save.materials },
    market: save.market ?? fresh.market,
    pityPulls: save.pityPulls ?? 0,
    // Dragon Fate: migrate old pity counter (each PITY_THRESHOLD cycle ≈ half a Fate bar)
    fate: save.fate ?? Math.min(FATE_RAGE_THRESHOLD, Math.round(((save.pityPulls ?? 0) / PITY_THRESHOLD) * FATE_RAGE_THRESHOLD)),
    pullsSinceLastLucky: save.pullsSinceLastLucky ?? 0,
    focusPity: save.focusPity ?? 0,
    upgrades: save.upgrades ?? undefined,
    runes: save.runes ?? [],
    runeFragments: save.runeFragments ?? 0,
    units: save.units.map((u) => ({ runeSlots: [null, null], ...u })),
    // New feature defaults
    dungeon: save.dungeon ?? undefined,
    raid: save.raid ?? undefined,
    sideQuests: save.sideQuests ?? {},
    relics: save.relics ?? [],
    equippedRelic: save.equippedRelic ?? null,
    ownedSkins: save.ownedSkins ?? [],
    skinsEquipped: save.skinsEquipped ?? {},
    wantedPosters: save.wantedPosters ?? [],
    climbBest: save.climbBest ?? 0,
    climbWeek: save.climbWeek ?? '',
    climbHistory: save.climbHistory ?? [],
    journalComplete: save.journalComplete ?? {},
    teamPresets: save.teamPresets ?? [],
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

/** True when this device already has a save (a returning player). */
export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
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

const CODE_PREFIX = 'DV1:';

/** A copy-pasteable code holding the whole save, for moving progress between devices. */
export function exportCode(save: SaveData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return CODE_PREFIX + btoa(binary);
}

/** Reads a save code or a raw save file's text. Throws if it isn't a Dragon Vision save. */
export function importCode(text: string): SaveData {
  const trimmed = text.trim();
  let json = trimmed;
  if (trimmed.startsWith(CODE_PREFIX)) {
    const binary = atob(trimmed.slice(CODE_PREFIX.length));
    json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('That is not a Dragon Vision save code.');
  }
  if (!isValid(parsed)) throw new Error('That save is damaged or from another game.');
  return migrate(parsed);
}
