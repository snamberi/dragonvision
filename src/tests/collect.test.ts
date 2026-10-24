import { describe, expect, it } from 'vitest';
import { recordWin, syncBounties } from '../game/bounty';
import { collectAll, dailyChecklist, pendingBadges, tabBadges } from '../game/collect';
import { startTraining } from '../game/dojo';
import { startExpedition } from '../game/expedition';
import { addUnit, newSave } from '../game/progression';
import type { SaveData } from '../game/types';

const HOUR = 3_600_000;

function readySave(now: Date): SaveData {
  const t = now.getTime();
  let save: SaveData = syncBounties(newSave(), now);
  const a = addUnit(save, { familyId: 'mei', star: 1, level: 1, baseLevel: 1, coinsSpent: 0 });
  const b = addUnit(a.save, { familyId: 'bruno', star: 1, level: 1, baseLevel: 1, coinsSpent: 0 });
  save = startExpedition(b.save, [a.unit.uid], 1, t - 2 * HOUR, () => 0.5);
  save = startTraining(save, b.unit.uid, t - HOUR / 2);
  for (let i = 0; i < 10; i++) save = recordWin(save, { firstClear: false, boss: false, flawless: false });
  return save;
}

describe('collect all', () => {
  const now = new Date(2026, 9, 21, 12);

  it('flags ready places for the checklist, city and tabs', () => {
    const save = readySave(now);
    const badges = pendingBadges(save, now);
    expect(badges.port).toBe(true);
    expect(badges.dojo).toBe(true);
    expect(badges.bounty).toBe(true);
    expect(badges.login).toBe(true);
    expect(tabBadges(save, now)).toMatchObject({ home: true, city: true });
    expect(dailyChecklist(save, now).find((r) => r.id === 'expeditions')).toMatchObject({ claimable: true, done: false });
  });

  it('claims bounties, trips and Dojo levels in one go, then has nothing left', () => {
    const save = readySave(now);
    const { save: after, claims, gained } = collectAll(save, now);
    expect(claims).toBe(3);
    expect(after.expeditions).toHaveLength(0);
    expect(after.coins).toBeGreaterThan(save.coins);
    expect(after.spins).toBeGreaterThan(save.spins);
    expect(after.units.find((u) => u.familyId === 'bruno')!.level).toBe(4);
    expect(gained.join(' ')).toMatch(/coins/);
    const badges = pendingBadges(after, now);
    expect(badges.port).toBeFalsy();
    expect(badges.dojo).toBeFalsy();
    expect(badges.bounty).toBeFalsy();
    expect(collectAll(after, now).claims).toBe(0);
  });

  it('never claims the login chest or the free fortune, which have their own reveal', () => {
    const save = readySave(now);
    const after = collectAll(save, now).save;
    expect(after.login).toEqual(save.login);
    expect(after.fortuneDay).toEqual(save.fortuneDay);
  });
});
