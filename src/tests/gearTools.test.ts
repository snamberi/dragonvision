import { describe, expect, it } from 'vitest';
import { addItem, equip, gearEffects, getTemplate, wearer } from '../game/gear';
import { autoEquip, autoEquipTeam, compareSwap, salvageCandidates, salvageFiltered } from '../game/gearTools';
import { addUnit, newSave } from '../game/progression';
import type { SaveData } from '../game/types';

function give(save: SaveData, templateId: string, rarity: Parameters<typeof addItem>[2]) {
  return addItem(save, templateId, rarity);
}

describe('auto-equip', () => {
  it('fills every slot with the best free piece', () => {
    let save = newSave();
    save = give(save, 'ember-blade', 'common').save;
    const better = give(save, 'void-edge', 'legendary');
    save = better.save;
    save = give(save, 'bulwark-plate', 'rare').save;
    save = give(save, 'tempest-boots', 'rare').save;
    save = give(save, 'void-fang', 'epic').save;
    const r = autoEquip(save, 'u1');
    const gear = r.save.units[0].gear!;
    expect(gear.weapon).toBe(better.item.id);
    expect(gear.armor).toBeDefined();
    expect(gear.acc1 && gear.acc2).toBeTruthy();
    expect(r.changed).toBe(4);
    expect(autoEquip(r.save, 'u1').changed).toBe(0);
  });

  it('completes a boss set over slightly stronger loose pieces', () => {
    let save = newSave();
    for (let i = 0; i < 4; i++) save = give(save, `riptide-${i}`, 'rare').save;
    save = give(save, 'void-edge', 'epic').save;
    const r = autoEquip(save, 'u1');
    expect(gearEffects(r.save, r.save.units[0])).toContain('chain');
  });

  it("never takes a team fighter's gear, and takes bench gear only when allowed", () => {
    let save = addUnit(newSave(), { familyId: 'mei', star: 1, level: 1, baseLevel: 1, coinsSpent: 0 }).save;
    const benchUid = save.units[1].uid;
    const blade = give(save, 'void-edge', 'legendary');
    save = equip(blade.save, benchUid, 'weapon', blade.item.id);
    expect(autoEquip(save, 'u1').save.units[0].gear?.weapon).toBeUndefined();
    const taken = autoEquip(save, 'u1', true);
    expect(taken.save.units[0].gear?.weapon).toBe(blade.item.id);
    expect(taken.fromBench).toBe(1);

    const team: SaveData = { ...save, team: ['u1', benchUid, null, null, null] };
    const r = autoEquipTeam(team, true);
    expect(wearer(r.save, blade.item.id)?.uid).toBe(benchUid);
  });
});

describe('gear compare', () => {
  it('shows stat deltas and set bonuses gained or lost', () => {
    let save = newSave();
    for (let i = 0; i < 3; i++) {
      const { save: next, item } = give(save, `riptide-${i}`, 'rare');
      save = equip(next, 'u1', (['weapon', 'armor', 'acc1'] as const)[i], item.id);
    }
    const fourth = give(save, 'riptide-3', 'rare');
    save = fourth.save;
    const cmp = compareSwap(save, 'u1', 'acc2', fourth.item.id);
    expect(cmp.gained.some((g) => g.includes('4-piece'))).toBe(true);

    const full = equip(save, 'u1', 'acc2', fourth.item.id);
    const weak = give(full, 'ember-blade', 'common');
    const down = compareSwap(weak.save, 'u1', 'weapon', weak.item.id);
    expect(down.lost.some((l) => l.includes('Riptide'))).toBe(true);
    expect(down.stats.some((d) => d.delta < 0)).toBe(true);
    expect(getTemplate(weak.item.templateId).kind).toBe('weapon');
  });
});

describe('bulk salvage', () => {
  it('salvages unworn pieces up to a rarity, keeping worn and boss pieces', () => {
    let save = newSave();
    save = give(save, 'ember-blade', 'common').save;
    save = give(save, 'ember-band', 'uncommon').save;
    save = give(save, 'void-edge', 'epic').save;
    save = give(save, 'riptide-2', 'common').save;
    const worn = give(save, 'sage-beads', 'common');
    save = equip(worn.save, 'u1', 'acc1', worn.item.id);

    expect(salvageCandidates(save, { maxRarity: 'uncommon' })).toHaveLength(2);
    expect(salvageCandidates(save, { maxRarity: 'uncommon', includeBossSets: true })).toHaveLength(3);
    const r = salvageFiltered(save, { maxRarity: 'uncommon' });
    expect(r.count).toBe(2);
    expect(r.dust).toBe(4);
    expect(r.save.items.map((i) => i.templateId).sort()).toEqual(['riptide-2', 'sage-beads', 'void-edge']);
  });
});
