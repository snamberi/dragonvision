import { describe, expect, it } from 'vitest';
import { BOSS_SETS, wallSetFor } from '../game/bossSets';
import { type BattleState, type Fighter, createBattle, performAction } from '../game/battle';
import { battleOptions } from '../game/fighterBonus';
import { REROLL_COST, duplicateItems, forgeDust, rerollSub, salvageDuplicates, salvageItem } from '../game/forge';
import { addItem, equip, gearBonus, gearEffects, isBossSetTemplate, setCounts } from '../game/gear';
import { newSave, teamSlots } from '../game/progression';
import { attemptRaid, raidBoss, raidSet } from '../game/raid';
import { applyRewards, getStage, rewardsFor } from '../game/stages';
import type { GearSlotKey, SaveData } from '../game/types';

const SLOTS: GearSlotKey[] = ['weapon', 'armor', 'acc1', 'acc2'];

function wearSet(save: SaveData, setId: string, pieces = 4): SaveData {
  return SLOTS.slice(0, pieces).reduce((s, slot, i) => {
    const { save: next, item } = addItem(s, `${setId}-${i}`, 'epic');
    return equip(next, s.units[0].uid, slot, item.id);
  }, save);
}

describe('boss sets', () => {
  it('every wall stage has its own set, and every set covers all four slots', () => {
    for (const stage of [50, 100, 180, 230, 280, 330, 380]) expect(wallSetFor(stage)).toBeDefined();
    expect(new Set(BOSS_SETS.map((s) => s.effect)).size).toBe(BOSS_SETS.length);
    expect(isBossSetTemplate('riptide-0')).toBe(true);
    expect(isBossSetTemplate('ember-blade')).toBe(false);
  });

  it('counts pieces: 2 gives the stat bonus, 4 adds the effect', () => {
    const two = wearSet(newSave(), 'demongate', 2);
    expect(setCounts(two, two.units[0])).toEqual([expect.objectContaining({ pieces: 2 })]);
    expect(gearEffects(two, two.units[0])).toEqual([]);
    const four = wearSet(newSave(), 'demongate');
    expect(gearEffects(four, four.units[0])).toEqual(['hellfire']);
    expect(gearBonus(four, four.units[0]).atk).toBeGreaterThan(gearBonus(two, two.units[0]).atk);
  });

  it('boss pieces always roll two sub-stats, seeded by item id', () => {
    const a = addItem(newSave(), 'gatebreaker-0', 'legendary').item;
    const b = addItem(newSave(), 'gatebreaker-0', 'legendary').item;
    expect(a.subs).toHaveLength(2);
    expect(a.subs).toEqual(b.subs);
    expect(addItem(newSave(), 'ember-blade', 'common').item.subs).toBeUndefined();
  });
});

describe('4-piece effects in battle', () => {
  const hit = (state: BattleState) => performAction(state, { kind: 'attack' }, () => 0.5).state;
  const enemyOf = (state: BattleState): Fighter => state.fighters.find((f) => f.side === 'enemy')!;

  it('Hellfire: a basic attack burns the target, which ticks on its turn', () => {
    const save = wearSet(newSave(), 'demongate');
    const battle = createBattle(teamSlots(save), getStage(1), battleOptions(save));
    expect(battle.fighters[0].effects).toEqual(['hellfire']);
    const after = hit(battle);
    const enemy = enemyOf(after);
    // The lone player fighter has acted, so the enemy turn has begun and the burn ticked once.
    expect(after.turn).toBe('enemy');
    expect(enemy.hp).toBeGreaterThan(0);
    expect(enemy.burn?.turns).toBe(1);
  });

  it('Riptide: a single-target special also hits a second foe', () => {
    const save = wearSet(newSave(), 'riptide');
    const base = createBattle(teamSlots(save), getStage(6), battleOptions(save));
    const ready = { ...base, fighters: base.fighters.map((f) => (f.side === 'player' ? { ...f, charge: 99 } : f)) };
    const event = performAction(ready, { kind: 'special' }, () => 0.5).event;
    const damaged = new Set(event.hits.filter((h) => h.kind === 'damage').map((h) => h.targetId));
    expect(damaged.size).toBeGreaterThanOrEqual(2);
  });

  it('side gear never reaches enemies', () => {
    const save = wearSet(newSave(), 'grimharvest');
    const battle = createBattle(teamSlots(save), getStage(6), battleOptions(save));
    expect(battle.fighters.filter((f) => f.side === 'enemy').every((f) => !f.effects)).toBe(true);
  });
});

describe('wall and raid drops', () => {
  it('a wall always drops its set on the first clear and sometimes on replays', () => {
    const save = { ...newSave(), clearedStage: 99 };
    const first = rewardsFor(save, 100, () => 0.5);
    expect(first.gear?.templateId.startsWith('demongate-')).toBe(true);
    const replay = { ...save, clearedStage: 120 };
    expect(rewardsFor(replay, 100, () => 0.1).gear?.templateId.startsWith('demongate-')).toBe(true);
    expect(rewardsFor(replay, 100, () => 0.9).gear).toBeUndefined();
    const after = applyRewards(replay, 100, rewardsFor(replay, 100, () => 0.1));
    expect(after.items.some((i) => i.templateId.startsWith('demongate-'))).toBe(true);
  });

  it('raid phases drop the week set', () => {
    const week = '2026-W43';
    const save = { ...newSave(), clearedStage: 40 };
    const pool = raidBoss(save, week).pool;
    const next = attemptRaid(save, pool, week, '2026-10-23');
    const setId = raidSet(week)!.id;
    expect(next.items.filter((i) => i.templateId.startsWith(`${setId}-`))).toHaveLength(5);
  });
});

describe('forge', () => {
  it('salvages spare copies into dust but keeps worn pieces and the best copy', () => {
    let save = wearSet(newSave(), 'foundry', 1);
    save = addItem(save, 'foundry-0', 'rare').save;
    save = addItem(save, 'foundry-0', 'common').save;
    save = addItem(save, 'ember-blade', 'rare').save;
    expect(duplicateItems(save)).toHaveLength(2);
    const { save: after, count, dust } = salvageDuplicates(save);
    expect(count).toBe(2);
    expect(forgeDust(after)).toBe(dust);
    expect(after.items).toHaveLength(2);
    expect(() => salvageItem(after, after.units[0].gear!.weapon!)).toThrow(/Take it off/);
  });

  it('rerolls one chosen sub-stat for dust', () => {
    const { save: withItem, item } = addItem(newSave(), 'gatebreaker-1', 'legendary');
    const save = { ...withItem, forgeDust: 100 };
    const keep = item.subs![1];
    const after = rerollSub(save, item.id, 0, () => 0.99);
    const rerolled = after.items.find((i) => i.id === item.id)!.subs!;
    expect(rerolled[1]).toEqual(keep);
    expect(rerolled[0].stat).not.toBe(keep.stat);
    expect(forgeDust(after)).toBe(100 - REROLL_COST.legendary);
    expect(() => rerollSub({ ...save, forgeDust: 0 }, item.id, 0)).toThrow(/Forge Dust/);
  });
});
