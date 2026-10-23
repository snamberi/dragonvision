import { describe, expect, it } from 'vitest';
import { createBattle } from '../game/battle';
import { BEAT_LAST_WEEK_REWARD, CLIMB_HISTORY_WEEKS, climbStage, syncClimbWeek, winClimbFloor } from '../game/climb';
import { applyDungeonRule, dungeonSquad, dungeonStage, startDungeon } from '../game/dungeon';
import { claimLogin } from '../game/login';
import { addUnit, newSave, teamSlots } from '../game/progression';
import { RAID_GEMS_PER_PHASE, attemptRaid, raidBoss, raidStage } from '../game/raid';
import { seededRng } from '../game/rng';
import { settleSideBattle, sideStage, winStreakBoss } from '../game/sideModes';
import type { SaveData } from '../game/types';

const DAY = '2026-10-21';
const WEEK = '2026-W43';

function keyed(save: SaveData = newSave()): SaveData {
  return { ...save, materials: { ...save.materials, dungeonKey: 2 } };
}

describe('daily dungeon', () => {
  it('gets a key from every login claim', () => {
    const save = claimLogin(newSave(), seededRng(1), DAY);
    expect(save.materials.dungeonKey).toBe(1);
  });

  it('builds a five-enemy fight led by a villain', () => {
    const stage = dungeonStage(newSave(), DAY);
    expect(stage.enemies).toHaveLength(5);
    expect(stage.enemies[0].rank).toBe('miniBoss');
    expect(stage.label).toMatch(/Dungeon/);
  });

  it('applies each rule to the battle', () => {
    const save = newSave();
    const base = createBattle(teamSlots(save), dungeonStage(save, DAY));
    expect(applyDungeonRule(base, 'No Specials').fighters.every((f) => f.specialSpent)).toBe(true);
    const iron = applyDungeonRule(base, 'Iron Defense');
    const enemy = (s: typeof base) => s.fighters.find((f) => f.side === 'enemy')!;
    expect(enemy(iron).def).toBe(enemy(base).def * 2);
    const glass = applyDungeonRule(base, 'Glass Cannon');
    expect(glass.fighters[0].maxHp).toBeLessThan(base.fighters[0].maxHp);
    expect(glass.fighters[0].atk).toBeGreaterThan(base.fighters[0].atk);
    expect(applyDungeonRule(base, 'Double Speed').fighters[0].ki).toBeGreaterThan(base.fighters[0].ki);
  });

  it('Healers Only keeps just Support and Drainer fighters', () => {
    const squad = dungeonSquad(teamSlots(newSave()), 'Healers Only');
    expect(squad.every((u) => u === null)).toBe(true);
  });

  it('pays only on a win', () => {
    const save = startDungeon(keyed(), DAY);
    const stage = dungeonStage(save, DAY);
    const battle = createBattle(teamSlots(save), stage);
    const lost = settleSideBattle('dungeon', save, stage, { ...battle, result: 'lost' }, 0);
    expect(lost.save).toBe(save);
    const won = settleSideBattle('dungeon', save, stage, { ...battle, result: 'won' }, 0).save;
    expect(won.gems).toBe(save.gems + 10);
    expect(won.dungeon?.cleared).toBe(true);
  });
});

describe('boss raid', () => {
  it('locks the pool and turns damage into phases worth gems', () => {
    const save = { ...newSave(), clearedStage: 30 };
    const pool = raidBoss(save, WEEK).pool;
    const dealt = Math.round(pool * 0.45);
    const after = attemptRaid(save, dealt, WEEK, DAY);
    expect(after.raid?.clearedPhases).toEqual([1, 2]);
    expect(after.gems).toBe(save.gems + 2 * RAID_GEMS_PER_PHASE);
    expect(after.raid?.pool).toBe(pool);
    // Progress later in the story does not move this week's pool.
    expect(raidBoss({ ...after, clearedStage: 200 }, WEEK).pool).toBe(pool);
    expect(raidStage(after, WEEK).enemies[0].hpPool?.left).toBe(pool - dealt);
  });

  it('settles a timed battle from the damage actually dealt', () => {
    const save = { ...newSave(), clearedStage: 30 };
    const stage = sideStage('raid', save, 0);
    const battle = createBattle(teamSlots(save), stage);
    const start = stage.enemies[0].hpPool!.left;
    const hit = { ...battle, result: 'timeout' as const, fighters: battle.fighters.map((f) => (f.side === 'enemy' ? { ...f, hp: start - 1234 } : f)) };
    const out = settleSideBattle('raid', save, stage, hit, 0);
    expect(out.save.raid?.totalDamage).toBe(1234);
    expect(out.save.raid?.attemptsCount).toBe(1);
  });
});

describe('infinite climb', () => {
  it('fights its own floors, not story stages', () => {
    expect(climbStage(3).label).toBe('Climb 3F');
  });

  it('pays new floors once and keeps a weekly history', () => {
    let save = winClimbFloor(newSave(), 1, 'W1');
    const paid = save.coins;
    save = winClimbFloor(save, 1, 'W1');
    expect(save.coins).toBe(paid);
    save = winClimbFloor(save, 2, 'W1');
    save = syncClimbWeek(save, 'W2');
    expect(save.climbHistory).toEqual([{ week: 'W1', best: 2 }]);
    expect(save.climbBest).toBe(0);
  });

  it('rewards beating last week once', () => {
    let save: SaveData = { ...newSave(), climbWeek: 'W2', climbBest: 0, climbHistory: [{ week: 'W1', best: 2 }] };
    save = winClimbFloor(save, 1, 'W2');
    save = winClimbFloor(save, 2, 'W2');
    const gems = save.gems;
    save = winClimbFloor(save, 3, 'W2');
    expect(save.gems).toBe(gems + BEAT_LAST_WEEK_REWARD.gems);
    const after = save.gems;
    save = winClimbFloor(save, 4, 'W2');
    expect(save.gems).toBe(after);
  });

  it('keeps only the last 8 weeks', () => {
    let save = newSave();
    for (let w = 1; w <= 12; w++) save = syncClimbWeek(winClimbFloor(save, 1, `W${w}`), `W${w + 1}`);
    expect(save.climbHistory).toHaveLength(CLIMB_HISTORY_WEEKS);
  });
});

describe('login streak boss', () => {
  it('unlocks on the 7th day in a row and resets after a gap', () => {
    let save = newSave();
    for (let d = 1; d <= 6; d++) save = claimLogin(save, seededRng(d), `2026-10-0${d}`);
    expect(save.login.bossReady).toBe(false);
    save = claimLogin(save, seededRng(7), '2026-10-07');
    expect(save.login.streak).toBe(7);
    expect(save.login.bossReady).toBe(true);
    const gap = claimLogin(save, seededRng(8), '2026-10-09');
    expect(gap.login.streak).toBe(1);
    expect(gap.login.bossReady).toBe(true);
  });

  it('pays a shard at your best star, once', () => {
    let save = addUnit({ ...newSave(), login: { day: DAY, claims: 7, streak: 7, bossReady: true } }, { familyId: 'mei', star: 4, level: 1, baseLevel: 1, coinsSpent: 0 }).save;
    save = winStreakBoss(save);
    expect(save.shards[4]).toBe(1);
    expect(() => winStreakBoss(save)).toThrow();
  });
});
