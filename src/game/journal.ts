import { FAMILIES, LEGENDARIES, getFamily } from './roster';
import type { Family, SaveData } from './types';

const JOURNAL_GEM_REWARD = 5;

export interface JournalEntry {
  owned: number;
  total: number;
  complete: boolean;
}

const ALL_FAMILIES: Family[] = [...FAMILIES, ...LEGENDARIES];

export function journalEntry(save: SaveData, familyId: string): JournalEntry {
  const family = getFamily(familyId);
  const total = family.forms.length;
  const owned = save.units.filter((u) => u.familyId === familyId).reduce((max, u) => Math.max(max, u.star), 0);
  const complete = owned >= total;
  return { owned, total, complete };
}

export function completeJournalEntry(save: SaveData, familyId: string): SaveData {
  if ((save.journalComplete ?? {})[familyId]) throw new Error('Already completed');
  const entry = journalEntry(save, familyId);
  if (!entry.complete) throw new Error('Not all forms collected yet');
  return {
    ...save,
    gems: save.gems + JOURNAL_GEM_REWARD,
    journalComplete: { ...(save.journalComplete ?? {}), [familyId]: true },
  };
}

export function overallCompletion(save: SaveData): { families: number; total: number; pct: number } {
  const total = ALL_FAMILIES.length;
  const families = ALL_FAMILIES.filter((f) => journalEntry(save, f.id).complete).length;
  const pct = total > 0 ? Math.round((families / total) * 100) : 0;
  return { families, total, pct };
}

export function journalFamilies(save: SaveData): Array<{ family: Family } & JournalEntry> {
  return ALL_FAMILIES.map((family) => ({ family, ...journalEntry(save, family.id) }));
}
