import type { Bonus } from './bonus';
import type { SaveData, Unit } from './types';

/** Team wins needed to reach each mastery level (1–5). */
export const MASTERY_THRESHOLDS: readonly number[] = [5, 15, 35, 70, 120];
export const MAX_MASTERY = MASTERY_THRESHOLDS.length;
/** Attack and HP bonus per mastery level. */
const MASTERY_STAT_PER_LEVEL = 0.02;

export function masteryLevel(points: number): number {
  return MASTERY_THRESHOLDS.filter((t) => points >= t).length;
}

export function unitMastery(unit: Unit): number {
  return masteryLevel(unit.mastery ?? 0);
}

/** Wins earned toward the next level, and how many that level needs (null when maxed). */
export function masteryProgress(points: number): { level: number; into: number; need: number | null } {
  const level = masteryLevel(points);
  if (level >= MAX_MASTERY) return { level, into: 0, need: null };
  const floor = level === 0 ? 0 : MASTERY_THRESHOLDS[level - 1];
  return { level, into: points - floor, need: MASTERY_THRESHOLDS[level] - floor };
}

export function masteryBonus(level: number): Partial<Bonus> {
  if (level <= 0) return {};
  const share = level * MASTERY_STAT_PER_LEVEL;
  return { atk: share, hp: share };
}

/** CSS class for the cosmetic aura; empty below level 1. */
export function masteryAuraClass(unit: Unit): string {
  const level = unitMastery(unit);
  return level > 0 ? `mastery-aura mastery-aura-${level}` : '';
}

/** Every fighter on the current team gains one mastery point for a win. */
export function recordMastery(save: SaveData): SaveData {
  const team = new Set(save.team.filter((uid): uid is string => uid !== null));
  if (team.size === 0) return save;
  return {
    ...save,
    units: save.units.map((u) => (team.has(u.uid) ? { ...u, mastery: (u.mastery ?? 0) + 1 } : u)),
  };
}
