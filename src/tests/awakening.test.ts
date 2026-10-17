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

describe('combos and fusion', () => {
  it('a combo needs both partners with full bars and empties both', async () => {
    const { createBattle, comboFor, performAction, canUse } = await import('../game/battle');
    const { teamSlots } = await import('../game/progression');
    const { getStage } = await import('../game/stages');
    let save = newSave();
    const v = addUnit(save, { familyId: 'varek', star: 1, level: 20, baseLevel: 20, coinsSpent: 0 });
    save = { ...v.save, team: ['u1', v.unit.uid, null, null, null] };
    let battle = createBattle(teamSlots(save), getStage(12));
    const kairo = battle.fighters.find((f) => f.familyId === 'kairo')!;
    expect(comboFor(battle, kairo)).toBeNull();
    battle = { ...battle, fighters: battle.fighters.map((f) => (f.side === 'player' ? { ...f, charge: 9 } : f)) };
    const actor = battle.fighters.find((f) => f.familyId === 'kairo')!;
    expect(comboFor(battle, actor)?.combo.name).toBe('Rival Cannon');
    // Kairo or Varek may be faster; whoever acts first can fire it.
    const first = battle.fighters.filter((f) => f.side === 'player').sort((a, b) => b.spd - a.spd)[0];
    expect(canUse(battle, first, 'combo')).toBe(true);
    const target = battle.fighters.find((f) => f.side === 'enemy' && f.row === 'front')!;
    const { state, event } = performAction(battle, { kind: 'combo', targetId: target.id }, () => 0.5);
    expect(event.label).toBe('Rival Cannon');
    expect(state.fighters.filter((f) => f.side === 'player').every((f) => f.charge === 0)).toBe(true);
  });

  it('fuses the best copies of two 6-star fighters into a new character', async () => {
    const { fuseFighters, canFuse } = await import('../game/fusion');
    const { FUSION_RECIPES, getFamily } = await import('../game/roster');
    let save = newSave();
    expect(canFuse(save, FUSION_RECIPES[0]).ok).toBe(false);
    const k = addUnit(save, { familyId: 'kairo', star: 7, level: 130, baseLevel: 130, coinsSpent: 0 });
    const v = addUnit(k.save, { familyId: 'varek', star: 6, level: 110, baseLevel: 110, coinsSpent: 0 });
    save = { ...v.save, team: [k.unit.uid, 'u1', v.unit.uid, null, null] };
    const { save: fused, unit } = fuseFighters(save, 'kavrek');
    expect(getFamily(unit.familyId).name).toBe('Kavrek');
    expect(unit.star).toBe(6);
    expect(unit.level).toBe(110);
    expect(fused.units.some((u) => u.uid === k.unit.uid || u.uid === v.unit.uid)).toBe(false);
    expect(fused.team).toEqual([unit.uid, 'u1', null, null, null]);
    expect(awakeningTree('kavrek')).toHaveLength(6);
  });
});
