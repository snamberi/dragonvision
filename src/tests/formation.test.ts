import { describe, expect, it } from 'vitest';
import { createBattle, legalTargets, performAction } from '../game/battle';
import { addUnit, evolveUnit, moveTeamMember, newSave, teamSlots, teamUnits, toggleTeamMember } from '../game/progression';
import { getStage } from '../game/stages';
import type { SaveData } from '../game/types';

function withUnit(save: SaveData, familyId: string, star: number, level: number) {
  return addUnit(save, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
}

describe('team pads', () => {
  it('evolving with the only team member as a copy keeps a fighter on the team', () => {
    // Regression: the starter Kairo on the team was consumed, leaving an empty team that froze battles.
    let save: SaveData = { ...newSave(), coins: 1_000_000 };
    const a = withUnit(save, 'kairo', 1, 20);
    save = withUnit(a.save, 'kairo', 1, 5).save;
    save = evolveUnit(save, a.unit.uid);
    expect(teamUnits(save).map((u) => u.uid)).toEqual([a.unit.uid]);
    expect(() => createBattle(teamSlots(save), getStage(1))).not.toThrow();
  });

  it('adds to the first empty pad and removes without shifting others', () => {
    let save = newSave();
    const v = withUnit(save, 'varek', 1, 5);
    const t = withUnit(v.save, 'tobi', 1, 5);
    save = t.save;
    for (const uid of [v.unit.uid, t.unit.uid]) {
      const r = toggleTeamMember(save, uid);
      if (!r.ok) throw new Error(r.reason);
      save = r.save;
    }
    expect(save.team).toEqual(['u1', v.unit.uid, t.unit.uid, null, null]);
    const r = toggleTeamMember(save, v.unit.uid);
    if (!r.ok) throw new Error(r.reason);
    expect(r.save.team).toEqual(['u1', null, t.unit.uid, null, null]);
  });

  it('moves fighters between pads by swapping', () => {
    const save = { ...newSave(), team: ['u1', null, 'u2', null, null] };
    expect(moveTeamMember(save, 0, 3).team).toEqual([null, null, 'u2', 'u1', null]);
    expect(moveTeamMember(save, 0, 2).team).toEqual(['u2', null, 'u1', null, null]);
  });
});

describe('formation in battle', () => {
  function battleWith(families: (string | null)[]) {
    let save = newSave();
    const slots = families.map((id) => {
      if (!id) return null;
      const r = withUnit(save, id, 1, 20);
      save = r.save;
      return r.unit;
    });
    return createBattle(slots, getStage(12));
  }

  it('puts odd pads in the back row', () => {
    const state = battleWith(['kairo', 'mei', null, 'tobi', 'sora']);
    const rows = state.fighters.filter((f) => f.side === 'player').map((f) => `${f.slot}:${f.row}`);
    expect(rows).toEqual(['0:front', '1:back', '3:back', '4:front']);
  });

  it('front row shields the back row until it falls', () => {
    const state = battleWith(['kairo', 'mei', null, null, null]);
    const legal = legalTargets(state, 'enemy').map((f) => f.familyId);
    expect(legal).toEqual(['kairo']);
    const fallen = {
      ...state,
      fighters: state.fighters.map((f) => (f.familyId === 'kairo' && f.side === 'player' ? { ...f, hp: 0 } : f)),
    };
    expect(legalTargets(fallen, 'enemy').map((f) => f.familyId)).toEqual(['mei']);
  });

  it('a front-row tank draws single-target attacks', () => {
    const state = battleWith(['kairo', null, 'bruno', null, 'sora']);
    expect(legalTargets(state, 'enemy').map((f) => f.familyId)).toEqual(['bruno']);
    // An enemy aiming elsewhere is redirected to the tank.
    let s = state;
    while (s.turn === 'player') s = performAction(s, { kind: 'guard' }).state;
    const kairo = s.fighters.find((f) => f.familyId === 'kairo' && f.side === 'player')!;
    const { event } = performAction(s, { kind: 'attack', targetId: kairo.id });
    const target = s.fighters.find((f) => f.id === event.hits[0].targetId)!;
    expect(target.familyId).toBe('bruno');
  });
});
