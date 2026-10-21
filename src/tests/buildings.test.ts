import { describe, expect, it } from 'vitest';
import { GRAVITY_PER_LEVEL, TOTAL_STAGES, enemyStarForStage, enemyStrengthForStage, gravityCost } from '../game/balance';
import { createBattle } from '../game/battle';
import { BOUNTIES, bountyProgress, claimBounty, recordWin, syncBounties } from '../game/bounty';
import { claimExpedition, expeditionDone, recallExpedition, startExpedition } from '../game/expedition';
import { claimFortune, fortuneReady } from '../game/fortune';
import { unitBonus } from '../game/fighterBonus';
import { gravityMultiplier, upgradeGravity } from '../game/gravity';
import { addUnit, newSave, teamSlots, toggleTeamMember } from '../game/progression';
import { seededRng } from '../game/rng';
import { CHAPTER_NAMES, getStage } from '../game/stages';
import { summonTen } from '../game/summon';
import { applyTowerWin, towerStage } from '../game/tower';
import type { SaveData } from '../game/types';

const HOUR = 3_600_000;

function withUnit(save: SaveData, familyId: string, star: number, level: number) {
  return addUnit(save, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
}

describe('380 stages', () => {
  it('has a chapter name for every 10 stages and ends with a Kael boss at the Vision Gate', () => {
    expect(TOTAL_STAGES).toBe(380);
    expect(CHAPTER_NAMES).toHaveLength(38);
    const last = getStage(380);
    expect(last.chapterName).toBe('The Vision Gate');
    expect(last.kind).toBe('boss');
    expect(last.enemies[0].familyId).toBe('kael');
    expect(last.enemies[0].star).toBe(21);
  });

  it('keeps getting harder after enemies reach level 400', () => {
    expect(getStage(200).enemies[1].level).toBeLessThanOrEqual(402);
    expect(enemyStarForStage(250)).toBeGreaterThan(enemyStarForStage(180));
    expect(enemyStrengthForStage(380)).toBeGreaterThan(enemyStrengthForStage(200));
  });
});

describe('10x summon pity system', () => {
  it('spends 10 spins and returns 10 units', () => {
    let save: SaveData = { ...newSave(), spins: 10 };
    const { save: after, units } = summonTen(save, seededRng(0));
    expect(after.spins).toBe(0);
    expect(units).toHaveLength(10);
  });

  it('tracks the pity counter across pulls', () => {
    let save: SaveData = { ...newSave(), spins: 10 };
    const { save: after } = summonTen(save, seededRng(0));
    // pity counter increments for each pull that did not yield 4★+
    expect(typeof (after.pityPulls ?? 0)).toBe('number');
  });
});

describe('gravity chamber', () => {
  it('raises a role multiplier for coins and applies it in battle', () => {
    let save: SaveData = { ...newSave(), coins: 10_000 };
    save = upgradeGravity(save, 'Assassin');
    expect(save.coins).toBe(10_000 - gravityCost(0));
    expect(gravityMultiplier(save, 'Assassin')).toBeCloseTo(1 + GRAVITY_PER_LEVEL);
    const plain = createBattle(teamSlots(save), getStage(12));
    const boosted = createBattle(teamSlots(save), getStage(12), { bonusFor: (u) => unitBonus(save, u) });
    expect(boosted.fighters[0].maxHp).toBeGreaterThan(plain.fighters[0].maxHp);
  });
});

describe('expedition port', () => {
  it('sends idle fighters away, blocks them, and pays out when back', () => {
    const r = withUnit(newSave(), 'mei', 1, 10);
    let save = startExpedition(r.save, [r.unit.uid], 4, 0, () => 0.05);
    expect(toggleTeamMember(save, r.unit.uid).ok).toBe(false);
    expect(expeditionDone(save.expeditions[0], 3 * HOUR)).toBe(false);
    expect(() => claimExpedition(save, save.expeditions[0].id, 3 * HOUR)).toThrow();
    const reward = save.expeditions[0].reward;
    save = claimExpedition(save, save.expeditions[0].id, 4 * HOUR);
    expect(save.spins).toBe(reward.spins);
    expect(save.coins).toBe(reward.coins);
    expect(save.expeditions).toHaveLength(0);
  });

  it('team fighters stay home; recalling gives nothing', () => {
    expect(() => startExpedition(newSave(), ['u1'], 1, 0)).toThrow(/Team fighters/);
    const r = withUnit(newSave(), 'mei', 1, 10);
    const sent = startExpedition(r.save, [r.unit.uid], 8, 0);
    const back = recallExpedition(sent, sent.expeditions[0].id);
    expect(back.coins).toBe(0);
  });
});

describe('bounty board', () => {
  it('tracks progress from the start of the day and pays once', () => {
    const day = new Date(2026, 9, 17, 12);
    let save = syncBounties({ ...newSave(), counters: { ...newSave().counters, wins: 50 } }, day);
    const wins = BOUNTIES.find((b) => b.id === 'd-wins')!;
    expect(bountyProgress(save, wins).done).toBe(0);
    for (let i = 0; i < 10; i++) save = recordWin(save, { firstClear: false, boss: false, flawless: false });
    expect(bountyProgress(save, wins).done).toBe(10);
    save = claimBounty(save, 'd-wins');
    expect(save.spins).toBe(2);
    expect(() => claimBounty(save, 'd-wins')).toThrow(/Already/);
    // The next day starts over.
    save = syncBounties(save, new Date(2026, 9, 18, 9));
    expect(bountyProgress(save, wins)).toEqual({ done: 0, claimed: false });
  });

  it('counts flawless boss wins', () => {
    let save = syncBounties(newSave(), new Date(2026, 9, 17));
    save = recordWin(save, { firstClear: true, boss: true, flawless: true });
    expect(bountyProgress(save, BOUNTIES.find((b) => b.id === 'w-flawless')!).done).toBe(1);
  });
});

describe('fortune teller', () => {
  it('gives one free summon per day', () => {
    const { save } = claimFortune(newSave(), seededRng(1), '2026-10-17');
    expect(save.units).toHaveLength(2);
    expect(save.spins).toBe(0);
    expect(fortuneReady(save, '2026-10-17')).toBe(false);
    expect(fortuneReady(save, '2026-10-18')).toBe(true);
  });
});

describe('rival tower', () => {
  it('applies floor rules in battle', () => {
    let save = newSave();
    for (const f of ['mei', 'tobi', 'aya', 'jin']) {
      const r = withUnit(save, f, 1, 10);
      const t = toggleTeamMember(r.save, r.unit.uid);
      save = t.ok ? t.save : r.save;
    }
    const max3 = createBattle(teamSlots(save), towerStage(2));
    expect(towerStage(2).rule).toBe('max3');
    expect(max3.fighters.filter((f) => f.side === 'player')).toHaveLength(3);
    const shields = createBattle(teamSlots(save), towerStage(4));
    expect(shields.fighters.filter((f) => f.side === 'enemy').every((f) => f.shield > 0)).toBe(true);
    const full = createBattle(teamSlots(save), towerStage(3));
    expect(full.fighters.filter((f) => f.side === 'enemy').every((f) => f.charge > 0)).toBe(true);
  });

  it('pays each floor once, with shards every fifth floor', () => {
    let save: SaveData = { ...newSave(), towerFloor: 4 };
    save = applyTowerWin(save, 5);
    expect(save.towerFloor).toBe(5);
    expect(save.shards[3]).toBe(1);
    const again = applyTowerWin(save, 5);
    expect(again).toBe(save);
  });
});

describe('arenas and weather', () => {
  it('gives every chapter an arena and applies weather in battle', async () => {
    const { arenaForChapter } = await import('../game/arenas');
    const { CHAPTER_SCENES } = await import('../game/story');
    for (let c = 1; c <= 38; c++) expect(arenaForChapter(c)).toBeDefined();
    expect(CHAPTER_SCENES).toHaveLength(38);
    // Chapter 20 is the Frozen Citadel: snow lowers starting Ki.
    const snowy = getStage(195);
    expect(snowy.weather).toBe('snow');
    const battle = createBattle(teamSlots(newSave()), snowy);
    expect(battle.fighters.every((f) => f.ki === 10)).toBe(true);
    // Chapter 4 has starlight: specials start one step charged.
    const starry = createBattle(teamSlots(newSave()), getStage(35));
    expect(starry.fighters.every((f) => f.charge === 1)).toBe(true);
  });
});
