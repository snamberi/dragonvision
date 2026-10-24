import { describe, expect, it } from 'vitest';
import { activityBetween, buildSummary, mergeDecision, saveHash, trophyId, trophyIds } from '../cloud/summary';
import { addUnit, newSave } from '../game/progression';
import { LEGENDARIES } from '../game/roster';
import type { SaveData } from '../game/types';

const withUnit = (save: SaveData, familyId: string, star: number, level: number) =>
  addUnit(save, { familyId, star, level, baseLevel: level, coinsSpent: 0 }).save;

describe('Ninefold profile summary', () => {
  it('reports progress, the three strongest fighters and forged legends', () => {
    let save: SaveData = { ...newSave(), clearedStage: 57, towerFloor: 9 };
    save = withUnit(save, 'mei', 5, 90);
    save = withUnit(save, 'jin', 3, 40);
    save = withUnit(save, 'tobi', 2, 20);
    save = withUnit(save, LEGENDARIES[0].id, 5, 1);
    const s = buildSummary(save, new Date('2026-10-25T00:00:00Z'));
    expect(s).toMatchObject({ v: 1, highestStage: 57, chapter: 6, fighters: 5, towerFloor: 9, updatedAt: '2026-10-25T00:00:00.000Z' });
    expect(s.strongest).toHaveLength(3);
    expect(s.strongest[0].power).toBeGreaterThanOrEqual(s.strongest[1].power);
    expect(s.forged).toEqual([{ id: LEGENDARIES[0].id, name: LEGENDARIES[0].name }]);
    expect(s.teamPower).toBeGreaterThan(0);
    expect(JSON.stringify(s).length).toBeLessThan(20000);
  });
});

describe('trophies', () => {
  it('maps achievement ids to the database format', () => {
    expect(trophyId('stage-50')).toBe('stage-50');
    expect(trophyId('Weird Id!')).toBe('weird-id-');
    expect(trophyId('x'.repeat(80))).toHaveLength(64);
  });
  it('includes claimed and completed achievements only', () => {
    const save: SaveData = { ...newSave(), clearedStage: 50, achievements: ['tower-15'] };
    const ids = trophyIds(save);
    expect(ids).toContain('stage-1');
    expect(ids).toContain('stage-50');
    expect(ids).toContain('tower-15');
    expect(ids).not.toContain('stage-380');
  });
});

describe('cloud merge on sign-in', () => {
  const played: SaveData = { ...newSave(), clearedStage: 30 };
  const other: SaveData = { ...newSave(), clearedStage: 45 };
  it('uploads when the cloud is empty or fresh, downloads onto a fresh device', () => {
    expect(mergeDecision(played, null)).toBe('upload');
    expect(mergeDecision(played, newSave())).toBe('upload');
    expect(mergeDecision(newSave(), played)).toBe('download');
    expect(mergeDecision(played, played)).toBe('same');
  });
  it('asks when both sides have different real progress', () => {
    expect(mergeDecision(played, other)).toBe('ask');
  });
  it('lets the side that changed since the last sync win', () => {
    expect(mergeDecision(played, other, saveHash(other))).toBe('upload');
    expect(mergeDecision(played, other, saveHash(played))).toBe('download');
  });
});

describe('activity lines', () => {
  it('posts one line per kind, for the furthest milestone', () => {
    const before: SaveData = { ...newSave(), clearedStage: 5 };
    const lines = activityBetween(before, { ...before, clearedStage: 55 });
    expect(lines.map((l) => l.kind).sort()).toEqual(['chapter', 'wall']);
    expect(lines.find((l) => l.kind === 'wall')!.text).toContain('stage 50');
    expect(lines.every((l) => l.text.length <= 140)).toBe(true);
    expect(activityBetween(before, before)).toEqual([]);
  });
});
