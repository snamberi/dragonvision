import { MAX_TEAM_SIZE } from './balance';
import { isOnExpedition, isTraining } from './progression';
import type { SaveData, TeamPreset } from './types';

export const PRESET_COUNT = 3;
const MAX_PRESET_NAME = 20;

export function teamPresets(save: SaveData): TeamPreset[] {
  return Array.from({ length: PRESET_COUNT }, (_, i) => save.teamPresets?.[i] ?? { name: `Team ${i + 1}`, team: [] });
}

function withPreset(save: SaveData, index: number, preset: TeamPreset): SaveData {
  if (index < 0 || index >= PRESET_COUNT) throw new Error('No such preset');
  const all = teamPresets(save);
  all[index] = preset;
  return { ...save, teamPresets: all };
}

export function savePreset(save: SaveData, index: number): SaveData {
  const team = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => save.team[i] ?? null);
  return withPreset(save, index, { ...teamPresets(save)[index], team });
}

export function renamePreset(save: SaveData, index: number, name: string): SaveData {
  const trimmed = name.trim().slice(0, MAX_PRESET_NAME);
  if (!trimmed) throw new Error('Give the preset a name.');
  return withPreset(save, index, { ...teamPresets(save)[index], name: trimmed });
}

/** Pads from the preset whose fighters can join right now; the rest become empty pads. */
export function presetTeam(save: SaveData, index: number): { team: (string | null)[]; skipped: number } {
  const families = new Set<string>();
  let skipped = 0;
  const team = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => {
    const uid = teamPresets(save)[index]?.team[i] ?? null;
    if (!uid) return null;
    const unit = save.units.find((u) => u.uid === uid);
    if (!unit || isTraining(save, uid) || isOnExpedition(save, uid) || families.has(unit.familyId)) {
      skipped++;
      return null;
    }
    families.add(unit.familyId);
    return uid;
  });
  return { team, skipped };
}

export function loadPreset(save: SaveData, index: number): SaveData {
  const { team } = presetTeam(save, index);
  if (!team.some(Boolean)) throw new Error("None of this preset's fighters can join right now.");
  return { ...save, team };
}
