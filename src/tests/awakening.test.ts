import { describe, expect, it } from 'vitest';
import { awaken, awakenPoints, awakeningBonus, awakeningTree, canAwaken, respecAwakening } from '../game/awakening';
import { addUnit, newSave } from '../game/progression';
import { FAMILIES } from '../game/roster';
import type { SaveData } from '../game/types';

describe('awakening trees', () => {
  it('every character has their own six-node tree, all different', () => {
    const names = new Set<string>();
    const shapes = new Set<string>();
    for (const f of FAMILIES) {
      const tree = awakeningTree(f.id);
      expect(tree, f.id).toHaveLength(6);
      tree.forEach((n) => names.add(n.name));
      shapes.add(JSON.stringify(tree.map((n) => n.effect)));
    }
    expect(names.size).toBe(FAMILIES.length * 6);
    expect(shapes.size).toBe(FAMILIES.length);
  });

  it('points start at 9 stars and tiers unlock in order', () => {
    let save: SaveData = { ...newSave(), gems: 10 };
    const r = addUnit(save, { familyId: 'bruno', star: 12, level: 200, baseLevel: 200, coinsSpent: 0 });
    save = r.save;
    expect(awakenPoints(r.unit)).toBe(4);
    const [t1a, , t2a, , t3a] = awakeningTree('bruno');
    expect(canAwaken(r.unit, t2a).ok).toBe(false);
    save = awaken(save, r.unit.uid, t1a.id);
    save = awaken(save, r.unit.uid, t2a.id);
    const u = save.units.find((x) => x.uid === r.unit.uid)!;
    expect(canAwaken(u, t3a).reason).toMatch(/points/);
    expect(awakeningBonus(u).def).toBeCloseTo(0.12);
    expect(awakeningBonus(u).shield).toBeCloseTo(0.1);
    save = respecAwakening(save, r.unit.uid);
    expect(save.units.find((x) => x.uid === r.unit.uid)!.awakened).toEqual([]);
    expect(save.gems).toBe(5);
  });

  it('is locked below 9 stars', () => {
    const save = newSave();
    expect(canAwaken(save.units[0], awakeningTree('kairo')[0]).ok).toBe(false);
  });
});
