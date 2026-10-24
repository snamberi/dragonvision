import { MAX_TEAM_SIZE, TOTAL_STAGES, levelCap, levelUpCost } from './balance';
import { evolveAll, findUnit, isBusy, power, upgradeUnit } from './progression';
import { BEATS, type Role, getFamily, roleFor } from './roster';
import { getStage } from './stages';
import type { SaveData, Unit } from './types';

/** A counter pick within this share of the strongest choice wins the slot. */
const COUNTER_BONUS = 0.15;

export function toggleLock(save: SaveData, uid: string): SaveData {
  const unit = findUnit(save, uid);
  return { ...save, units: save.units.map((u) => (u.uid === uid ? { ...u, locked: !unit.locked } : u)) };
}

/** The class that beats the dominant class of the player's next story stage. */
export function counterRole(save: SaveData): Role {
  const dominant = getStage(Math.min(TOTAL_STAGES, save.clearedStage + 1)).dominantRole;
  return (Object.keys(BEATS) as Role[]).find((r) => BEATS[r] === dominant)!;
}

/** Fills empty pads with the strongest free fighters, one per character, favouring the next stage's counter class. */
export function autoFillTeam(save: SaveData): { save: SaveData; added: number } {
  const team = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => save.team[i] ?? null);
  const families = new Set(team.filter(Boolean).map((uid) => findUnit(save, uid!).familyId));
  const counter = counterRole(save);
  const score = (u: Unit) => power(u.familyId, u.star, u.level) * (roleFor(getFamily(u.familyId)) === counter ? 1 + COUNTER_BONUS : 1);
  const pool = save.units
    .filter((u) => !team.includes(u.uid) && !isBusy(save, u.uid))
    .sort((a, b) => score(b) - score(a));
  let added = 0;
  for (const u of pool) {
    const pad = team.indexOf(null);
    if (pad < 0) break;
    if (families.has(u.familyId)) continue;
    team[pad] = u.uid;
    families.add(u.familyId);
    added++;
  }
  return { save: { ...save, team }, added };
}

export interface LevelPlan {
  /** uid → level after spending. */
  levels: Record<string, number>;
  cost: number;
}

/** Spends coins one level at a time on the lowest-level team fighter still under its level wall. */
export function planTeamLevels(save: SaveData): LevelPlan {
  const team = save.team.filter(Boolean).map((uid) => findUnit(save, uid!));
  const levels: Record<string, number> = Object.fromEntries(team.map((u) => [u.uid, u.level]));
  let coins = save.coins;
  let cost = 0;
  for (;;) {
    const next = team
      .filter((u) => levels[u.uid] < levelCap(u.star) && levelUpCost(levels[u.uid]) <= coins)
      .sort((a, b) => levels[a.uid] - levels[b.uid])[0];
    if (!next) return { levels, cost };
    const c = levelUpCost(levels[next.uid]);
    coins -= c;
    cost += c;
    levels[next.uid]++;
  }
}

export function applyTeamLevels(save: SaveData, plan: LevelPlan): SaveData {
  return Object.entries(plan.levels).reduce((s, [uid, level]) => {
    const gain = level - findUnit(s, uid).level;
    return gain > 0 ? upgradeUnit(s, uid, gain) : s;
  }, save);
}

export interface EvolvePreview {
  after: SaveData;
  count: number;
  /** Fighters that end higher than they started. */
  steps: { uid: string; familyId: string; from: number; to: number }[];
  copiesUsed: number;
  shardsUsed: number;
}

export function previewEvolveAll(save: SaveData): EvolvePreview {
  const { save: after, count } = evolveAll(save);
  const afterById = new Map(after.units.map((u) => [u.uid, u]));
  const steps = save.units.flatMap((u) => {
    const now = afterById.get(u.uid);
    return now && now.star > u.star ? [{ uid: u.uid, familyId: u.familyId, from: u.star, to: now.star }] : [];
  });
  const shardTotal = (s: SaveData) => Object.values(s.shards).reduce((a, b) => a + b, 0);
  return {
    after,
    count,
    steps,
    copiesUsed: save.units.length - after.units.length,
    shardsUsed: shardTotal(save) - shardTotal(after),
  };
}
