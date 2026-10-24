// Pure helpers: what Dragon Vision shares with a player's Ninefold profile. No network here.
import { ACHIEVEMENTS, achievementState } from '../game/achievements';
import { STAGES_PER_CHAPTER, TOTAL_STAGES, WALL_STAGES } from '../game/balance';
import { power, teamUnits, unitName } from '../game/progression';
import { LEGENDARIES, getFamily } from '../game/roster';
import type { SaveData } from '../game/types';

export interface DragonSummary {
  v: 1;
  highestStage: number;
  chapter: number;
  fighters: number;
  teamPower: number;
  strongest: { id: string; name: string; star: number; level: number; power: number }[];
  forged: { id: string; name: string }[];
  towerFloor: number;
  updatedAt: string;
}

const LAST_CHAPTER = Math.ceil(TOTAL_STAGES / STAGES_PER_CHAPTER);
const isLegend = (familyId: string) => LEGENDARIES.some((f) => f.id === familyId);

export function buildSummary(save: SaveData, now = new Date()): DragonSummary {
  const ranked = save.units
    .map((u) => ({ id: u.familyId, name: unitName(u), star: u.star, level: u.level, power: power(u.familyId, u.star, u.level) }))
    .sort((a, b) => b.power - a.power);
  const forgedIds = [...new Set(save.units.map((u) => u.familyId).filter(isLegend))];
  return {
    v: 1,
    highestStage: save.clearedStage,
    chapter: Math.min(LAST_CHAPTER, Math.floor(save.clearedStage / STAGES_PER_CHAPTER) + 1),
    fighters: save.units.length,
    teamPower: teamUnits(save).reduce((sum, u) => sum + power(u.familyId, u.star, u.level), 0),
    strongest: ranked.slice(0, 3),
    forged: forgedIds.map((id) => ({ id, name: getFamily(id).name })),
    towerFloor: save.towerFloor,
    updatedAt: now.toISOString(),
  };
}

/** A trophy id the database accepts: lowercase letters, digits and : _ - (up to 64). */
export function trophyId(achievementId: string): string {
  return achievementId.toLowerCase().replace(/[^a-z0-9:_-]/g, '-').slice(0, 64);
}

/** Every achievement the player has claimed or completed. */
export function trophyIds(save: SaveData): string[] {
  const ids = ACHIEVEMENTS.filter((a) => save.achievements.includes(a.id) || achievementState(save, a).complete).map((a) => trophyId(a.id));
  return [...new Set(ids)];
}

export type ActivityKind = 'wall' | 'forge' | 'star21' | 'chapter';
export interface ActivityLine {
  kind: ActivityKind;
  text: string;
}

const maxStar = (save: SaveData) => Math.max(0, ...save.units.map((u) => u.star));

/**
 * Milestones reached between two saves, at most one line per kind (an Auto-Progress run that clears several
 * chapters posts only the furthest one), so a profile's activity never floods.
 */
export function activityBetween(before: SaveData, after: SaveData): ActivityLine[] {
  const lines: ActivityLine[] = [];
  const crossed = (n: number) => before.clearedStage < n && after.clearedStage >= n;
  const walls = Object.keys(WALL_STAGES).map(Number).filter(crossed);
  if (walls.length) lines.push({ kind: 'wall', text: `Broke the wall at stage ${Math.max(...walls)} in Dragon Vision` });
  const bosses: number[] = [];
  for (let n = STAGES_PER_CHAPTER; n <= TOTAL_STAGES; n += STAGES_PER_CHAPTER) if (crossed(n) && !walls.includes(n)) bosses.push(n);
  if (bosses.length) {
    const top = Math.max(...bosses);
    lines.push({ kind: 'chapter', text: `Beat the chapter ${top / STAGES_PER_CHAPTER} boss in Dragon Vision` });
  }
  const had = new Set(before.units.map((u) => u.familyId).filter(isLegend));
  const forged = [...new Set(after.units.map((u) => u.familyId).filter((id) => isLegend(id) && !had.has(id)))];
  if (forged.length) lines.push({ kind: 'forge', text: `Forged ${getFamily(forged[forged.length - 1]).name} in Dragon Vision` });
  if (maxStar(before) < 21 && maxStar(after) >= 21) {
    const top = after.units.find((u) => u.star >= 21)!;
    lines.push({ kind: 'star21', text: `Raised ${unitName(top)} to 21★ in Dragon Vision` });
  }
  return lines.map((l) => ({ ...l, text: l.text.slice(0, 140) }));
}

export type MergeDecision = 'same' | 'upload' | 'download' | 'ask';

/** A save with no real progress yet (a fresh start on this device). */
export function isFreshSave(save: SaveData): boolean {
  return save.clearedStage === 0 && save.units.length <= 1 && save.towerFloor === 0;
}

/** A short fingerprint of a save (FNV-1a), to remember what this device last synced. */
export function saveHash(save: SaveData): string {
  const text = JSON.stringify(save);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return `${text.length}:${(h >>> 0).toString(36)}`;
}

/**
 * What to do with this device's save and the cloud copy on sign-in. `lastSynced` is the fingerprint of the save
 * this device last uploaded or downloaded: if only one side changed since then, that side wins; if both did,
 * the player chooses. Real progress is never overwritten silently.
 */
export function mergeDecision(local: SaveData, cloud: SaveData | null, lastSynced: string | null = null): MergeDecision {
  if (!cloud) return 'upload';
  const l = saveHash(local);
  const c = saveHash(cloud);
  if (l === c) return 'same';
  if (lastSynced && c === lastSynced) return 'upload';
  if (lastSynced && l === lastSynced) return 'download';
  if (isFreshSave(local)) return 'download';
  if (isFreshSave(cloud)) return 'upload';
  return 'ask';
}
