import { describe, expect, it } from 'vitest';
import { type BattleState, type Fighter, canUse, createBattle, nextActor, performAction, specialOf } from '../game/battle';
import { addUnit, newSave } from '../game/progression';
import { getStage } from '../game/stages';
import type { SaveData, Unit } from '../game/types';

const fixed = () => 0.5;

function battle(families: (string | null)[], stage = 12): BattleState {
  let save: SaveData = newSave();
  const slots = families.map((id): Unit | null => {
    if (!id) return null;
    const r = addUnit(save, { familyId: id, star: 1, level: 20, baseLevel: 20, coinsSpent: 0 });
    save = r.save;
    return r.unit;
  });
  return createBattle(slots, getStage(stage));
}

const player = (s: BattleState, familyId: string) => s.fighters.find((f) => f.side === 'player' && f.familyId === familyId)!;
const patch = (s: BattleState, id: string, change: Partial<Fighter>): BattleState => ({
  ...s,
  fighters: s.fighters.map((f) => (f.id === id ? { ...f, ...change } : f)),
});

/** Plays guard for the player and lets enemies act until it is `familyId`'s move. */
function untilTurnOf(s: BattleState, familyId: string): BattleState {
  for (let i = 0; i < 50; i++) {
    const actor = nextActor(s)!;
    if (actor.side === 'player' && actor.familyId === familyId) return s;
    s = performAction(s, { kind: 'guard' }, fixed).state;
  }
  throw new Error('never got a turn');
}

describe('special charge bar', () => {
  it('fills one step per move and fires for free when full', () => {
    let s = battle(['kairo']);
    const need = specialOf(player(s, 'kairo')).charge;
    for (let i = 0; i < need; i++) {
      s = untilTurnOf(s, 'kairo');
      expect(canUse(s, player(s, 'kairo'), 'special')).toBe(false);
      s = performAction(s, { kind: 'guard' }, fixed).state;
    }
    s = untilTurnOf(s, 'kairo');
    const before = player(s, 'kairo');
    expect(canUse(s, before, 'special')).toBe(true);
    s = performAction(s, { kind: 'special' }, fixed).state;
    const after = player(s, 'kairo');
    expect(after.charge).toBe(0);
    expect(after.ki).toBe(before.ki);
  });
});

describe('special kinds', () => {
  it('revive brings back a fallen ally at 40% HP, once per battle', () => {
    let s = battle(['zeno', 'kairo']);
    const kairo = player(s, 'kairo');
    const zeno = player(s, 'zeno');
    s = patch(s, kairo.id, { hp: 0 });
    s = patch(s, zeno.id, { charge: 4 });
    s = untilTurnOf(s, 'zeno');
    s = patch(s, zeno.id, { charge: 4 });
    const { state } = performAction(s, { kind: 'special', targetId: kairo.id }, fixed);
    expect(player(state, 'kairo').hp).toBe(Math.round(kairo.maxHp * 0.4));
    const z = patch(state, zeno.id, { charge: 4 });
    expect(player(z, 'zeno').specialSpent).toBe(true);
    expect(canUse(z, player(z, 'zeno'), 'special')).toBe(false);
  });

  it('revive needs a fallen ally', () => {
    const s = battle(['zeno', 'kairo']);
    const z = patch(s, player(s, 'zeno').id, { charge: 4 });
    expect(canUse(z, player(z, 'zeno'), 'special')).toBe(false);
  });

  it('shield soaks damage before HP', () => {
    let s = battle(['bruno']);
    s = untilTurnOf(s, 'bruno');
    s = patch(s, player(s, 'bruno').id, { charge: 3 });
    s = performAction(s, { kind: 'special' }, fixed).state;
    const shielded = player(s, 'bruno');
    expect(shielded.shield).toBeGreaterThan(0);
    // Let enemies hit it.
    while (s.turn === 'enemy' && s.result === 'ongoing') s = performAction(s, { kind: 'attack' }, fixed).state;
    const after = player(s, 'bruno');
    expect(after.shield).toBeLessThan(shielded.shield);
  });

  it('stun makes a minion skip its next turn; bosses resist', () => {
    let s = battle(['tobi'], 12);
    s = untilTurnOf(s, 'tobi');
    s = patch(s, player(s, 'tobi').id, { charge: 3 });
    const target = s.fighters.find((f) => f.side === 'enemy' && f.row === 'front')!;
    const { state, event } = performAction(s, { kind: 'special', targetId: target.id }, fixed);
    expect(event.hits.some((h) => h.kind === 'stun' && h.targetId === target.id)).toBe(true);
    expect(state.turn).toBe('enemy');
    expect(state.acted).toContain(target.id);

    let b = battle(['tobi'], 10);
    b = untilTurnOf(b, 'tobi');
    b = patch(b, player(b, 'tobi').id, { charge: 3 });
    const boss = b.fighters.find((f) => f.rank === 'boss')!;
    const res = performAction(b, { kind: 'special', targetId: boss.id }, fixed);
    expect(res.event.hits.some((h) => h.kind === 'resist')).toBe(true);
  });

  it('rally raises every ally attack for two turns', () => {
    let s = battle(['kenji', 'kairo']);
    s = untilTurnOf(s, 'kenji');
    s = patch(s, player(s, 'kenji').id, { charge: 4 });
    s = performAction(s, { kind: 'special' }, fixed).state;
    expect(player(s, 'kairo').rallyTurns).toBe(2);
    expect(player(s, 'kairo').rallyBonus).toBeCloseTo(0.3);
  });
});
