import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, achievementState, allForms, claimAchievement, recordForms, setTitle, unlockedTitles } from '../game/achievements';
import { autoResolve, createBattle, performAction } from '../game/battle';
import { LOGIN_TRACK, claimLogin, loginIndex, loginReady } from '../game/login';
import { addUnit, newSave, teamSlots } from '../game/progression';
import { seededRng } from '../game/rng';
import { finishSurvival, nextWave, survivalWave } from '../game/survival';
import type { SaveData } from '../game/types';
import { BOSS_ROUNDS, attemptsLeft, bossProgress, bossStage, claimMilestone, recordBossAttempt, syncWorldBoss, weeklyBoss } from '../game/worldBoss';

describe('world boss', () => {
  it('fights a timed battle against a shared HP pool that carries between attempts', () => {
    let save: SaveData = syncWorldBoss({ ...newSave(), clearedStage: 30 }, new Date(2026, 9, 17));
    const stage = bossStage(save);
    expect(stage.roundLimit).toBe(BOSS_ROUNDS);
    const end = autoResolve(createBattle(teamSlots(save), stage), seededRng(1));
    expect(['timeout', 'lost', 'won']).toContain(end.result);
    const boss = weeklyBoss(save, save.worldBoss.week);
    save = recordBossAttempt(save, boss.pool * 0.3);
    expect(bossProgress(save)).toBeCloseTo(0.3);
    expect(attemptsLeft(save)).toBe(2);
    expect(bossStage(save).enemies[0].hpPool!.left).toBe(Math.round(boss.pool * 0.7));
    save = claimMilestone(save, 0);
    expect(save.spins).toBe(5);
    expect(() => claimMilestone(save, 1)).toThrow(/Not reached/);
    // A new day refills attempts; a new week resets the pool.
    expect(attemptsLeft(syncWorldBoss(save, new Date(2026, 9, 18)))).toBe(3);
    expect(syncWorldBoss(save, new Date(2026, 9, 27)).worldBoss.damage).toBe(0);
  });

  it('ends with a timeout after the round limit', () => {
    const save = syncWorldBoss({ ...newSave(), clearedStage: 300 }, new Date(2026, 9, 17));
    let battle = createBattle(teamSlots(save), bossStage(save));
    for (let i = 0; i < 200 && battle.result === 'ongoing'; i++) battle = performAction(battle, { kind: 'guard' }).state;
    expect(battle.result === 'timeout' || battle.result === 'lost').toBe(true);
  });
});

describe('survival', () => {
  it('carries HP between waves and pays per wave', () => {
    const save = newSave();
    const team = teamSlots(save);
    let battle = createBattle(team, survivalWave(team, 1));
    battle = { ...battle, fighters: battle.fighters.map((f) => (f.side === 'player' ? { ...f, hp: 7 } : f)) };
    const wave2 = nextWave(battle, team, 2, {});
    expect(wave2.fighters.find((f) => f.side === 'player')!.hp).toBe(7);
    expect(survivalWave(team, 10).enemies[0].level).toBeGreaterThan(survivalWave(team, 1).enemies[0].level);
    const done = finishSurvival(save, 10);
    expect(done.survivalBest).toBe(10);
    expect(done.spins).toBe(2);
    expect(done.coins).toBeGreaterThan(0);
  });
});

describe('achievements', () => {
  it('claims once, unlocks titles, and tracks forms', () => {
    let save: SaveData = { ...newSave(), clearedStage: 1 };
    const first = ACHIEVEMENTS.find((a) => a.id === 'stage-1')!;
    expect(achievementState(save, first).complete).toBe(true);
    save = claimAchievement(save, 'stage-1');
    expect(() => claimAchievement(save, 'stage-1')).toThrow();
    expect(unlockedTitles(save)).toContain('Rookie');
    save = setTitle(save, 'Rookie');
    expect(save.title).toBe('Rookie');
    expect(() => setTitle(save, 'Gatebreaker')).toThrow();
    save = recordForms(addUnit(save, { familyId: 'kairo', star: 5, level: 90, baseLevel: 90, coinsSpent: 0 }).save);
    expect(save.seenForms).toContain('kairo:4');
    expect(allForms().length).toBeGreaterThan(50);
  });
});

describe('login calendar', () => {
  it('claims once a day and walks a looping 7-day track', () => {
    let save = newSave();
    expect(loginReady(save, '2026-10-17')).toBe(true);
    save = claimLogin(save, seededRng(1), '2026-10-17');
    expect(loginReady(save, '2026-10-17')).toBe(false);
    expect(() => claimLogin(save, seededRng(1), '2026-10-17')).toThrow();
    save = claimLogin(save, seededRng(1), '2026-10-20');
    expect(save.spins).toBe(2);
    expect(loginIndex(save)).toBe(2);
    expect(LOGIN_TRACK).toHaveLength(7);
  });
});

describe('save export and import', () => {
  it('round-trips a save through a code and rejects junk', async () => {
    const { exportCode, importCode } = await import('../game/save');
    const save: SaveData = { ...newSave(), coins: 1234, title: 'Rookie' };
    const code = exportCode(save);
    expect(code.startsWith('DV1:')).toBe(true);
    const back = importCode(code);
    expect(back.coins).toBe(1234);
    expect(back.title).toBe('Rookie');
    expect(importCode(JSON.stringify(save)).coins).toBe(1234);
    expect(() => importCode('hello')).toThrow();
    expect(() => importCode('DV1:' + btoa('{"version":2}'))).toThrow();
  });
});
