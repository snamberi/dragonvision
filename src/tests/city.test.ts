import { describe, expect, it } from 'vitest';
import { DOJO_MINUTES_PER_LEVEL, sellValue } from '../game/balance';
import { collectTraining, dojoProgress, startTraining, stopTraining } from '../game/dojo';
import { fuseShard, sellSpares, spareUnits } from '../game/fusion';
import { addUnit, checkEvolve, evolveUnit, newSave, resetUnit, toggleTeamMember, upgradeUnit } from '../game/progression';
import type { SaveData } from '../game/types';
import { newRun, nextInRun } from '../ui/run';

const MIN = 60_000;

function withUnit(save: SaveData, familyId: string, star: number, level: number) {
  return addUnit(save, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
}

describe('training dojo', () => {
  it('earns a level per interval up to the level wall, and works offline', () => {
    const r = withUnit(newSave(), 'mei', 1, 5);
    let save = startTraining(r.save, r.unit.uid, 0);
    const later = 3 * DOJO_MINUTES_PER_LEVEL * MIN + 5 * MIN;
    expect(dojoProgress(save, save.dojo[0], later).ready).toBe(3);
    save = collectTraining(save, r.unit.uid, later);
    expect(save.units.find((u) => u.uid === r.unit.uid)!.level).toBe(8);
    // Leftover minutes carry over toward the next level.
    expect(dojoProgress(save, save.dojo[0], later).partial).toBeCloseTo(0.5);
    // A week away still stops at the 1★ wall of 20.
    save = stopTraining(save, r.unit.uid, later + 7 * 24 * 60 * MIN);
    expect(save.units.find((u) => u.uid === r.unit.uid)!.level).toBe(20);
    expect(save.dojo).toHaveLength(0);
  });

  it('only takes idle fighters, and training blocks the team', () => {
    const save = newSave();
    expect(() => startTraining(save, 'u1', 0)).toThrow(/off the team/);
    const r = withUnit(save, 'mei', 1, 5);
    const training = startTraining(r.save, r.unit.uid, 0);
    const result = toggleTeamMember(training, r.unit.uid);
    expect(result.ok).toBe(false);
  });

  it('trained levels survive a gem reset', () => {
    const r = withUnit({ ...newSave(), coins: 100_000, gems: 5 }, 'mei', 1, 5);
    let save = startTraining(r.save, r.unit.uid, 0);
    save = stopTraining(save, r.unit.uid, 4 * DOJO_MINUTES_PER_LEVEL * MIN);
    save = upgradeUnit(save, r.unit.uid, 5);
    save = resetUnit(save, r.unit.uid);
    expect(save.units.find((u) => u.uid === r.unit.uid)!.level).toBe(9);
    expect(save.coins).toBe(100_000);
  });

  it('training fighters are never used up as duplicates', () => {
    let save: SaveData = { ...newSave(), coins: 1_000_000 };
    save = upgradeUnit(save, 'u1', 19);
    const a = withUnit(save, 'kairo', 1, 3);
    const b = withUnit(a.save, 'kairo', 1, 4);
    save = startTraining(b.save, b.unit.uid, 0);
    expect(checkEvolve(save, 'u1').ok).toBe(false);
  });
});

describe('fusion lab', () => {
  function collection() {
    let save = newSave();
    for (const [f, star, level] of [['mei', 1, 5], ['mei', 1, 9], ['tobi', 1, 3], ['tobi', 1, 7], ['aya', 1, 2], ['aya', 2, 30]] as const) {
      save = withUnit(save, f, star, level).save;
    }
    return save;
  }

  it('never offers the team, Dojo fighters, or the best copy of a character', () => {
    const save = collection();
    const spare = spareUnits(save).map((s) => s.unit);
    expect(spare.some((u) => u.uid === 'u1')).toBe(false);
    expect(spare.filter((u) => u.familyId === 'aya').map((u) => u.star)).toEqual([1]);
    expect(spare.filter((u) => u.familyId === 'mei')).toHaveLength(1);
  });

  it('fuses three same-star spares into a shard that stands in for a duplicate', () => {
    let save = collection();
    const ones = spareUnits(save).filter((s) => s.unit.star === 1).slice(0, 3).map((s) => s.unit.uid);
    save = fuseShard(save, ones);
    expect(save.shards[1]).toBe(1);
    save = upgradeUnit({ ...save, coins: 1_000_000 }, 'u1', 19);
    const check = checkEvolve(save, 'u1');
    expect(check.shardsUsed).toBe(1);
    save = withUnit(save, 'kairo', 1, 2).save;
    save = evolveUnit(save, 'u1');
    expect(save.units.find((u) => u.uid === 'u1')!.star).toBe(2);
    expect(save.shards[1]).toBe(0);
  });

  it('rejects mixed stars and sells spares for coins', () => {
    const save = collection();
    const spare = spareUnits(save).map((s) => s.unit);
    const mixed = [spare[0].uid, spare[1].uid, save.units.find((u) => u.star === 2)!.uid];
    expect(() => fuseShard(save, mixed)).toThrow();
    const sold = sellSpares(save, [spare[0].uid]);
    expect(sold.coins).toBe(sellValue(spare[0].star, spare[0].level));
    expect(sold.units).toHaveLength(save.units.length - 1);
  });
});

describe('auto runs', () => {
  it('farm repeats until its limit', () => {
    expect(nextInRun({ ...newRun('farm', 3), wins: 2 }, 4)).toEqual({ next: 4 });
    expect('stop' in nextInRun({ ...newRun('farm', 3), wins: 3 }, 4)).toBe(true);
    expect(nextInRun({ ...newRun('farm', null), wins: 500 }, 4)).toEqual({ next: 4 });
  });

  it('progress moves on but stops before mini-bosses and bosses', () => {
    expect(nextInRun({ ...newRun('progress'), wins: 1 }, 2)).toEqual({ next: 3 });
    expect('stop' in nextInRun({ ...newRun('progress'), wins: 1 }, 4)).toBe(true);
    expect('stop' in nextInRun({ ...newRun('progress'), wins: 1 }, 9)).toBe(true);
    expect(nextInRun({ ...newRun('progress'), wins: 1 }, 10)).toEqual({ next: 11 });
  });
});
