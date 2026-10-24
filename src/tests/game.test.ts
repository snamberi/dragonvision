import { describe, expect, it } from 'vitest';
import { autoResolve, createBattle, performAction, nextActor } from '../game/battle';
import { REPLAY_COIN_SHARE, RESET_GEM_COST, STARTING_SPINS, TOTAL_STAGES, enemyStrengthForStage, isWallStage } from '../game/balance';
import {
  addUnit,
  checkEvolve,
  evolveAll,
  evolveUnit,
  teamUnits,
  newSave,
  resetUnit,
  summonLevelRange,
  toggleTeamMember,
  upgradeCost,
  upgradeUnit,
  unitName,
} from '../game/progression';
import { seededRng } from '../game/rng';
import { applyRewards, getStage, rewardsFor } from '../game/stages';
import { shardPrice } from '../game/market';
import { summon, summonOdds, summonStarCap } from '../game/summon';
import type { SaveData } from '../game/types';

function withUnit(save: SaveData, familyId: string, star: number, level: number) {
  return addUnit(save, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
}

describe('summon levels', () => {
  it('always returns [1, 1] regardless of star', () => {
    expect(summonLevelRange(1)).toEqual([1, 1]);
    expect(summonLevelRange(2)).toEqual([1, 1]);
    expect(summonLevelRange(20)).toEqual([1, 1]);
    expect(summonLevelRange(21)).toEqual([1, 1]);
  });

  it('summons always arrive at level 1 and spend a spin', () => {
    let save: SaveData = { ...newSave(), spins: 200 };
    const rng = seededRng(1);
    for (let i = 0; i < 200; i++) {
      const result = summon(save, rng);
      expect(result.unit.level).toBe(1);
      expect(result.unit.baseLevel).toBe(1);
      save = result.save;
    }
    expect(save.spins).toBe(0);
  });
});

describe('summon caps and focus', () => {
  it('allows one tier above the highest owned form', () => {
    let save = newSave();
    expect(summonStarCap(save, 'kairo')).toBe(2);
    expect(summonStarCap(save, 'varek')).toBe(1);
    save = withUnit(save, 'kairo', 5, 90).save;
    expect(summonStarCap(save, 'kairo')).toBe(6);
  });

  it('never rolls above the cap', () => {
    let save: SaveData = { ...newSave(), spins: 500 };
    const rng = seededRng(7);
    for (let i = 0; i < 500; i++) {
      const caps = new Map(['kairo', 'varek', 'tobi'].map((id) => [id, summonStarCap(save, id)]));
      const result = summon(save, rng);
      const cap = caps.get(result.unit.familyId);
      if (cap !== undefined) expect(result.unit.star).toBeLessThanOrEqual(cap);
      save = result.save;
    }
  });

  it('focus raises a family chance without guaranteeing it', () => {
    const base = newSave();
    const chance = (s: SaveData) => summonOdds(s).filter((r) => r.familyId === 'mei').reduce((a, r) => a + r.chance, 0);
    const focused = chance({ ...base, focusFamilyId: 'mei' });
    expect(focused).toBeGreaterThan(chance(base) * 2);
    expect(focused).toBeLessThan(1);
  });
});

describe('levels and resets', () => {
  it('upgrades with coins and tracks spending', () => {
    const save = { ...newSave(), coins: 10_000 };
    const next = upgradeUnit(save, 'u1', 10);
    expect(next.units[0].level).toBe(11);
    expect(next.coins).toBe(10_000 - upgradeCost(1, 10));
    expect(next.units[0].coinsSpent).toBe(upgradeCost(1, 10));
  });

  it('reset drops to level 1 and refunds all coins', () => {
    let { save, unit } = withUnit({ ...newSave(), coins: 100_000, gems: 10 }, 'kairo', 3, 41);
    save = upgradeUnit(save, unit.uid, 17);
    const spent = 100_000 - save.coins;
    save = resetUnit(save, unit.uid);
    const after = save.units.find((u) => u.uid === unit.uid)!;
    expect(after.level).toBe(1);
    expect(save.coins).toBe(100_000);
    expect(spent).toBeGreaterThan(0);
    expect(save.gems).toBe(10 - RESET_GEM_COST);
  });
});

describe('level wall', () => {
  it('stops at star × 20 until the fighter evolves', () => {
    let save: SaveData = { ...newSave(), coins: 1_000_000 };
    save = upgradeUnit(save, 'u1', 50);
    expect(save.units[0].level).toBe(20);
    expect(() => upgradeUnit(save, 'u1', 1)).toThrow(/Level wall/);
    save = withUnit(withUnit(save, 'kairo', 1, 1).save, 'kairo', 1, 1).save;
    save = upgradeUnit(evolveUnit(save, 'u1'), 'u1', 50);
    expect(save.units.find((u) => u.uid === 'u1')!.level).toBe(40);
  });
});

describe('evolution', () => {
  it('needs the level and two copies of the same form, keeps the level', () => {
    let save: SaveData = { ...newSave(), coins: 1_000_000 };
    expect(checkEvolve(save, 'u1').ok).toBe(false);
    save = upgradeUnit(save, 'u1', 19);
    expect(checkEvolve(save, 'u1').duplicatesMet).toBe(false);
    save = withUnit(save, 'kairo', 1, 3).save;
    save = withUnit(save, 'kairo', 2, 30).save; // wrong form, must not count
    save = withUnit(save, 'kairo', 1, 9).save;
    expect(checkEvolve(save, 'u1').ok).toBe(true);
    save = evolveUnit(save, 'u1');
    const main = save.units.find((u) => u.uid === 'u1')!;
    expect(main.star).toBe(2);
    expect(main.level).toBe(20);
    expect(unitName(main)).toBe('Teen Kairo');
    expect(save.units.filter((u) => u.familyId === 'kairo' && u.star === 1)).toHaveLength(0);
    expect(save.units).toHaveLength(2);
  });

  it('flags duplicates that have purchased levels', () => {
    let save: SaveData = { ...newSave(), coins: 1_000_000 };
    save = upgradeUnit(save, 'u1', 19);
    const dup = withUnit(save, 'kairo', 1, 2);
    save = upgradeUnit(dup.save, dup.unit.uid, 3);
    save = withUnit(save, 'kairo', 1, 4).save;
    expect(checkEvolve(save, 'u1').investedDuplicates.map((u) => u.uid)).toEqual([dup.unit.uid]);
    // A third, untouched copy is preferred over the upgraded one.
    save = withUnit(save, 'kairo', 1, 1).save;
    expect(checkEvolve(save, 'u1').investedDuplicates).toHaveLength(0);
  });
});

describe('team rules', () => {
  it('allows one version per character and at most five fighters', () => {
    let save = newSave();
    const kairo2 = withUnit(save, 'kairo', 2, 25);
    save = kairo2.save;
    const r = toggleTeamMember(save, kairo2.unit.uid);
    expect(r.ok).toBe(false);
    for (const id of ['varek', 'tobi', 'orrin', 'sora']) {
      const added = withUnit(save, id, 1, 5);
      const res = toggleTeamMember(added.save, added.unit.uid);
      if (!res.ok) throw new Error(res.reason);
      save = res.save;
    }
    expect(save.team).toHaveLength(5);
    const extra = withUnit(save, 'mei', 1, 5);
    expect(toggleTeamMember(extra.save, extra.unit.uid).ok).toBe(false);
  });
});

describe('stages and rewards', () => {
  it('gives spins once per stage: 1 normal, 5 mini-boss, 10 boss', () => {
    const save = newSave();
    expect(rewardsFor(save, 1, () => 0.5).spins).toBe(1);
    expect(rewardsFor({ ...save, clearedStage: 4 }, 5, () => 0.5).spins).toBe(5);
    expect(rewardsFor({ ...save, clearedStage: 9 }, 10, () => 0.5).spins).toBe(10);
    const replay = rewardsFor({ ...save, clearedStage: 10 }, 10, () => 0);
    expect(replay).toMatchObject({ firstClear: false, spins: 0, gems: 0, coins: Math.round(getStage(10).coins * REPLAY_COIN_SHARE) });
  });

  it('first clear advances progress, replay does not', () => {
    let save = newSave();
    save = applyRewards(save, 1, rewardsFor(save, 1, () => 0.5));
    expect(save.clearedStage).toBe(1);
    save = applyRewards(save, 1, rewardsFor(save, 1, () => 0.5));
    expect(save.clearedStage).toBe(1);
    expect(save.spins).toBe(STARTING_SPINS + 1);
  });

  it('starts with one enemy and grows to five', () => {
    expect(getStage(1).enemies).toHaveLength(1);
    expect(getStage(3).enemies).toHaveLength(2);
    expect(getStage(6).enemies).toHaveLength(3);
    expect(getStage(12).enemies).toHaveLength(5);
    expect(getStage(10).enemies[0].rank).toBe('boss');
    expect(getStage(TOTAL_STAGES).enemies[0].level).toBeLessThanOrEqual(400);
  });

  it('bosses drop Signature Essence; walls and post-cap bosses drop Transcendence Crystals', () => {
    const save = newSave();
    expect(rewardsFor({ ...save, clearedStage: 9 }, 10, () => 0.5)).toMatchObject({ essence: 1 });
    expect(rewardsFor({ ...save, clearedStage: 99 }, 100, () => 0.5)).toMatchObject({ essence: 3, crystals: 5 });
    expect(rewardsFor({ ...save, clearedStage: 199 }, 200, () => 0.5)).toMatchObject({ crystals: 2 });
    expect(rewardsFor({ ...save, clearedStage: 10 }, 10, () => 0.5).essence).toBeUndefined();
    const after = applyRewards(save, 100, rewardsFor({ ...save, clearedStage: 99 }, 100, () => 0.5));
    expect(after.materials.transcendenceCrystal).toBe(5);
    expect(after.materials.sigMaterial).toBe(3);
  });

  it('shop shards cost more the higher their star', () => {
    expect(shardPrice(1000, 20)).toBeGreaterThan(shardPrice(1000, 10) * 8);
  });

  it('wall stages spike above their neighbours, then ease off', () => {
    expect(isWallStage(100)).toBe(true);
    expect(enemyStrengthForStage(100)).toBeGreaterThan(enemyStrengthForStage(99) * 1.15);
    expect(enemyStrengthForStage(101)).toBeLessThan(enemyStrengthForStage(100));
    expect(enemyStrengthForStage(281)).toBeGreaterThan(enemyStrengthForStage(271));
  });
});

describe('battle', () => {
  it('plays to a finish', () => {
    const save = newSave();
    const end = autoResolve(createBattle([save.units[0]], getStage(1)), seededRng(3));
    expect(end.result).not.toBe('ongoing');
  });

  it('a fresh Kid Kairo usually wins stage 1', () => {
    const save = newSave();
    let wins = 0;
    for (let seed = 0; seed < 50; seed++) {
      if (autoResolve(createBattle([save.units[0]], getStage(1)), seededRng(seed)).result === 'won') wins++;
    }
    expect(wins).toBeGreaterThan(35);
  });

  it('players act before enemies and turns alternate', () => {
    const save = newSave();
    let state = createBattle([save.units[0]], getStage(2));
    expect(nextActor(state)?.side).toBe('player');
    state = performAction(state, { kind: 'charge' }).state;
    expect(state.turn).toBe('enemy');
  });
});

describe('buying spins', () => {
  it('trades coins for spins at a price that follows stage progress', async () => {
    const { buySpins } = await import('../game/summon');
    const { spinPrice } = await import('../game/balance');
    const save: SaveData = { ...newSave(), coins: 10_000, clearedStage: 5 };
    const next = buySpins(save, 3);
    expect(next.spins).toBe(save.spins + 3);
    expect(next.coins).toBe(10_000 - 3 * spinPrice(5));
    expect(spinPrice(40)).toBeGreaterThan(spinPrice(5));
    expect(() => buySpins({ ...save, coins: 0 }, 1)).toThrow(/Not enough coins/);
  });
});

describe('evolve all and empty teams', () => {
  it('keeps evolving until nothing is left, team fighters first', () => {
    let save: SaveData = newSave();
    for (let i = 0; i < 8; i++) save = withUnit(save, 'kairo', 1, 1).save;
    const { save: after, count } = evolveAll(save);
    expect(count).toBe(4);
    expect(after.units.find((u) => u.uid === 'u1')!.star).toBe(3);
    expect(evolveAll(after).count).toBe(0);
  });

  it('evolves team and gear-wearing fighters as far as the copies allow', () => {
    // 1 team fighter + 26 spare copies = 27 one-star copies, exactly enough for a 4★.
    let save: SaveData = newSave();
    for (let i = 0; i < 26; i++) save = withUnit(save, 'kairo', 1, 1).save;
    const team = evolveAll(save).save;
    expect(team.units.find((u) => u.uid === 'u1')!.star).toBe(4);
    expect(team.units).toHaveLength(1);

    // Same for a benched fighter wearing gear.
    let geared: SaveData = newSave();
    const g = withUnit(geared, 'mei', 1, 1);
    geared = { ...g.save, units: g.save.units.map((u) => (u.uid === g.unit.uid ? { ...u, gear: { weapon: 'x' } } : u)) };
    for (let i = 0; i < 8; i++) geared = withUnit(geared, 'mei', 1, 1).save;
    expect(evolveAll(geared).save.units.find((u) => u.uid === g.unit.uid)!.star).toBe(3);
  });

  it('lets the team go empty', () => {
    const r = toggleTeamMember(newSave(), 'u1');
    expect(r.ok).toBe(true);
    if (r.ok) expect(teamUnits(r.save)).toHaveLength(0);
  });
});
