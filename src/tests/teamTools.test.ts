import { describe, expect, it } from 'vitest';
import { levelCap } from '../game/balance';
import { startTraining } from '../game/dojo';
import { spareUnits } from '../game/fusion';
import { addUnit, duplicatesFor, evolveAll, newSave, power, teamUnits } from '../game/progression';
import { FAMILIES, getFamily, roleFor } from '../game/roster';
import { applyTeamLevels, autoFillTeam, counterRole, planTeamLevels, previewEvolveAll, toggleLock } from '../game/teamTools';
import type { SaveData } from '../game/types';

function withUnit(save: SaveData, familyId: string, star: number, level: number) {
  return addUnit(save, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
}

const EMPTY_TEAM = [null, null, null, null, null];

describe('auto-fill team', () => {
  it('fills free pads with one fighter per character, skipping busy ones', () => {
    let save: SaveData = newSave();
    save = withUnit(save, 'kairo', 2, 30).save;
    const mei = withUnit(save, 'mei', 1, 10);
    save = mei.save;
    const busy = withUnit(save, 'bruno', 1, 15);
    save = startTraining(busy.save, busy.unit.uid, 0);
    const { save: after, added } = autoFillTeam(save);
    expect(added).toBe(1);
    const families = teamUnits(after).map((u) => u.familyId);
    expect(families.sort()).toEqual(['kairo', 'mei']);
    expect(after.team).not.toContain(busy.unit.uid);
  });

  it('prefers a counter to the next stage when power is close', () => {
    const base: SaveData = { ...newSave(), team: EMPTY_TEAM };
    const counter = counterRole(base);
    const heroes = FAMILIES.filter((f) => !f.villain && !f.legendary);
    const a = heroes.find((f) => roleFor(f) === counter)!;
    const b = heroes.find((f) => roleFor(f) !== counter)!;
    const powerA = power(a.id, 1, 100);
    const levelB = Array.from({ length: 400 }, (_, i) => i + 1).find((lv) => {
      const r = power(b.id, 1, lv) / powerA;
      return r > 1.01 && r < 1.12;
    });
    expect(levelB).toBeDefined();
    let save = withUnit({ ...base, units: [] }, a.id, 1, 100).save;
    save = withUnit(save, b.id, 1, levelB!).save;
    const after = autoFillTeam(save).save;
    expect(getFamily(teamUnits(after)[0].familyId).id).toBe(a.id);
  });
});

describe('level team to cap', () => {
  it('stops at each fighter’s level wall', () => {
    const save: SaveData = { ...newSave(), coins: 10_000_000 };
    const plan = planTeamLevels(save);
    expect(plan.levels.u1).toBe(levelCap(1));
    const after = applyTeamLevels(save, plan);
    expect(after.units[0].level).toBe(levelCap(1));
    expect(after.coins).toBe(save.coins - plan.cost);
  });

  it('spreads limited coins evenly, lowest level first', () => {
    let save: SaveData = newSave();
    const mei = withUnit(save, 'mei', 1, 1);
    save = { ...mei.save, team: ['u1', mei.unit.uid, null, null, null], coins: 600 };
    const plan = planTeamLevels(save);
    expect(Math.abs(plan.levels.u1 - plan.levels[mei.unit.uid])).toBeLessThanOrEqual(1);
    expect(plan.cost).toBeLessThanOrEqual(600);
  });
});

describe('locked fighters', () => {
  it('are never used as evolution copies or sold as spares', () => {
    let save: SaveData = newSave();
    const copy = withUnit(save, 'kairo', 1, 1);
    save = toggleLock(copy.save, copy.unit.uid);
    expect(duplicatesFor(save, save.units[0]).map((u) => u.uid)).not.toContain(copy.unit.uid);
    expect(spareUnits(save).map((s) => s.unit.uid)).not.toContain(copy.unit.uid);
    expect(toggleLock(save, copy.unit.uid).units.find((u) => u.uid === copy.unit.uid)!.locked).toBe(false);
  });
});

describe('evolve all preview', () => {
  it('matches what Evolve All actually does', () => {
    let save: SaveData = newSave();
    for (let i = 0; i < 8; i++) save = withUnit(save, 'kairo', 1, 1).save;
    const preview = previewEvolveAll(save);
    const real = evolveAll(save);
    expect(preview.after).toEqual(real.save);
    expect(preview.count).toBe(real.count);
    expect(preview.copiesUsed).toBe(save.units.length - real.save.units.length);
    expect(preview.steps.find((s) => s.uid === 'u1')).toMatchObject({ from: 1, to: 3 });
  });
});
