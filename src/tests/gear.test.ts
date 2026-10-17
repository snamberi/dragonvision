import { describe, expect, it } from 'vitest';
import { createBattle, performAction } from '../game/battle';
import { unitBonus } from '../game/fighterBonus';
import {
  addItem,
  buyOffer,
  equip,
  gearBonus,
  itemBonus,
  refreshShop,
  sellItem,
  setCounts,
  shopStock,
  unequip,
  wearer,
} from '../game/gear';
import { addUnit, newSave, teamSlots } from '../game/progression';
import { getStage } from '../game/stages';
import type { SaveData } from '../game/types';

function gearUp(save: SaveData, ids: [string, 'common' | 'legendary'][]) {
  const items: string[] = [];
  for (const [t, r] of ids) {
    const res = addItem(save, t, r);
    save = res.save;
    items.push(res.item.id);
  }
  return { save, items };
}

describe('gear', () => {
  it('scales with rarity', () => {
    expect(itemBonus({ templateId: 'ember-blade', rarity: 'legendary' }).atk).toBeCloseTo(0.25);
    expect(itemBonus({ templateId: 'ember-blade', rarity: 'common' }).atk).toBeCloseTo(0.05);
  });

  it('equips into matching slots only and moves items between fighters', () => {
    let { save, items } = gearUp(newSave(), [['ember-blade', 'common'], ['ember-gi', 'common']]);
    expect(() => equip(save, 'u1', 'armor', items[0])).toThrow();
    save = equip(save, 'u1', 'weapon', items[0]);
    const other = addUnit(save, { familyId: 'mei', star: 1, level: 5, baseLevel: 5, coinsSpent: 0 });
    save = equip(other.save, other.unit.uid, 'weapon', items[0]);
    expect(wearer(save, items[0])?.uid).toBe(other.unit.uid);
    expect(save.units[0].gear?.weapon).toBeUndefined();
    save = unequip(save, other.unit.uid, 'weapon');
    expect(wearer(save, items[0])).toBeUndefined();
  });

  it('gives 2- and 4-piece set bonuses', () => {
    let { save, items } = gearUp(newSave(), [
      ['bulwark-hammer', 'common'],
      ['bulwark-plate', 'common'],
      ['bulwark-ring', 'common'],
      ['bulwark-seal', 'common'],
    ]);
    save = equip(save, 'u1', 'weapon', items[0]);
    save = equip(save, 'u1', 'armor', items[1]);
    expect(setCounts(save, save.units[0])[0].pieces).toBe(2);
    expect(gearBonus(save, save.units[0]).shield).toBeCloseTo(0.015);
    save = equip(save, 'u1', 'acc1', items[2]);
    save = equip(save, 'u1', 'acc2', items[3]);
    const b = gearBonus(save, save.units[0]);
    // 4-piece: start with a 20% shield (plus the plate's own 1.5%).
    expect(b.shield).toBeCloseTo(0.215);
    expect(b.hp).toBeCloseTo(0.06 + 0.04 + 0.15);
    // And it shows up in battle.
    const battle = createBattle(teamSlots(save), getStage(1), { bonusFor: (u) => unitBonus(save, u) });
    const me = battle.fighters.find((f) => f.side === 'player')!;
    expect(me.shield).toBeGreaterThan(0);
  });

  it('can only sell gear nobody is wearing', () => {
    let { save, items } = gearUp(newSave(), [['ember-blade', 'legendary']]);
    save = equip(save, 'u1', 'weapon', items[0]);
    expect(() => sellItem(save, items[0])).toThrow();
    save = sellItem(unequip(save, 'u1', 'weapon'), items[0]);
    expect(save.items).toHaveLength(0);
    expect(save.coins).toBeGreaterThan(0);
  });

  it('shop stock is fixed for the day, buys once per slot, refreshes for gems', () => {
    let save: SaveData = { ...newSave(), coins: 10_000_000, gems: 100, clearedStage: 50 };
    const day = '2026-10-17';
    expect(shopStock(save, day)).toEqual(shopStock(save, day));
    save = buyOffer(save, 0, day);
    expect(save.items).toHaveLength(1);
    expect(() => buyOffer(save, 0, day)).toThrow(/Already/);
    const before = shopStock(save, day);
    save = refreshShop(save, day);
    expect(shopStock(save, day)).not.toEqual(before);
    expect(save.gems).toBe(95 - shopStock({ ...save, shop: { ...save.shop, refreshes: 0 } }, day)[0].gems);
  });
});

describe('battle bonuses', () => {
  it('second wind brings a fighter back once', () => {
    const save = newSave();
    let battle = createBattle(teamSlots(save), getStage(1), {
      bonusFor: () => ({ ...unitBonus(save, save.units[0]), secondWind: 0.3 }),
    });
    const me = battle.fighters.find((f) => f.side === 'player')!;
    battle = { ...battle, fighters: battle.fighters.map((f) => (f.id === me.id ? { ...f, hp: 1 } : f)), turn: 'enemy', acted: [] };
    const { state, event } = performAction(battle, { kind: 'attack', targetId: me.id }, () => 0.5);
    const after = state.fighters.find((f) => f.id === me.id)!;
    expect(event.hits.some((h) => h.kind === 'revive')).toBe(true);
    expect(after.hp).toBe(Math.round(after.maxHp * 0.3));
    expect(after.secondWindUsed).toBe(true);
  });
});
