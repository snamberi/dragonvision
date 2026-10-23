import { describe, expect, it } from 'vitest';
import { createBattle, encounterMods, performAction } from '../game/battle';
import { TRAITS, WALL_RULES, chapterTrait, mergeMods } from '../game/encounters';
import { WALL_STAGES } from '../game/balance';
import { addUnit, newSave, teamSlots, toggleTeamMember } from '../game/progression';
import { seededRng } from '../game/rng';
import { getStage, type Stage } from '../game/stages';
import { towerStage } from '../game/tower';

const firstChapterWith = (trait: string) =>
  Array.from({ length: 38 }, (_, i) => i + 1).find((c) => chapterTrait(c) === trait)!;

describe('chapter enemy traits', () => {
  it('start at chapter 3 and are deterministic', () => {
    expect(getStage(1).trait).toBeUndefined();
    expect(getStage(15).trait).toBeUndefined();
    expect(getStage(21).trait).toBeDefined();
    expect(getStage(55).trait).toBe(getStage(51).trait);
  });

  it('Swift and Bulwark change enemies at battle start', () => {
    const team = teamSlots(newSave());
    const swiftStage = getStage((firstChapterWith('swift') - 1) * 10 + 1);
    const plain: Stage = { ...swiftStage, trait: undefined };
    const swift = createBattle(team, swiftStage).fighters.find((f) => f.side === 'enemy')!;
    const base = createBattle(team, plain).fighters.find((f) => f.side === 'enemy')!;
    expect(swift.spd).toBe(base.spd + 8);

    const bulwark = createBattle(team, { ...plain, trait: 'bulwark' }).fighters.filter((f) => f.side === 'enemy');
    expect(bulwark.filter((f) => f.row === 'front').every((f) => f.shield > 0)).toBe(true);
    expect(bulwark.filter((f) => f.row === 'back').every((f) => f.shield === 0)).toBe(true);
  });

  it('Volatile enemies burst on KO', () => {
    const team = teamSlots(newSave());
    const stage: Stage = { ...getStage(1), trait: 'volatile' };
    let state = createBattle(team, stage);
    // Leave the lone enemy on 1 HP so the first hit knocks it out.
    state = { ...state, fighters: state.fighters.map((f) => (f.side === 'enemy' ? { ...f, hp: 1 } : f)) };
    const before = state.fighters.find((f) => f.side === 'player')!.hp;
    const { event } = performAction(state, { kind: 'attack' }, seededRng(1));
    const playerId = state.fighters.find((f) => f.side === 'player')!.id;
    expect(event.hits.some((h) => h.targetId === playerId && h.kind === 'damage')).toBe(true);
    expect(before).toBeGreaterThan(0);
  });
});

describe('wall arena rules', () => {
  it('every wall stage has a rule and an intro', () => {
    expect(Object.keys(WALL_RULES).sort()).toEqual(Object.keys(WALL_STAGES).sort());
  });

  it('Nullfield blocks healing', () => {
    const mods = encounterMods(getStage(180));
    expect(mods.noHealing).toBe(true);
    const r = addUnit(newSave(), { familyId: 'orrin', star: 9, level: 180, baseLevel: 180, coinsSpent: 0 });
    const toggled = toggleTeamMember(r.save, r.unit.uid);
    if (!toggled.ok) throw new Error(toggled.reason);
    const save = toggled.save;
    const healerId = `p-${r.unit.uid}`;
    const ready = (stage: Stage) => {
      const s = createBattle(teamSlots(save), stage);
      return {
        ...s,
        fighters: s.fighters.map((f) => (f.side === 'player' ? { ...f, hp: 10, ...(f.id === healerId && { spd: 999, charge: 99 }) } : f)),
      };
    };
    const blocked = performAction(ready(getStage(180)), { kind: 'special' }, seededRng(2)).event;
    expect(blocked.hits.length).toBeGreaterThan(0);
    expect(blocked.hits.every((h) => h.kind === 'resist')).toBe(true);
    const normal = performAction(ready({ ...getStage(180), number: 179 }), { kind: 'special' }, seededRng(2)).event;
    expect(normal.hits.some((h) => h.kind === 'heal')).toBe(true);
  });

  it('Void Chill empties player Ki and Haste Aura speeds enemies', () => {
    const team = teamSlots(newSave());
    expect(createBattle(team, getStage(230)).fighters.filter((f) => f.side === 'player').every((f) => f.ki === 0)).toBe(true);
    const haste = createBattle(team, getStage(280)).fighters.find((f) => f.side === 'enemy')!;
    const calm = createBattle(team, { ...getStage(280), number: 279, trait: getStage(280).trait }).fighters.find((f) => f.side === 'enemy')!;
    expect(haste.spd - calm.spd).toBeGreaterThanOrEqual(15);
  });

  it('the final gate boss gets a second wind', () => {
    const boss = createBattle(teamSlots(newSave()), getStage(380)).fighters.find((f) => f.rank === 'boss')!;
    expect(boss.bonus.secondWind).toBeCloseTo(0.3);
  });
});

describe('side modes', () => {
  it('labelled stages get no trait or wall rule even on a wall stage number', () => {
    const labelled: Stage = { ...getStage(180), label: 'Test Mode' };
    expect(encounterMods(labelled)).toEqual({});
    expect(createBattle(teamSlots(newSave()), labelled).mods).toBeUndefined();
    expect(towerStage(5).trait).toBeUndefined();
  });

  it('mergeMods adds numbers and bonus fields', () => {
    const m = mergeMods(TRAITS.swift, WALL_RULES[280], WALL_RULES[330]);
    expect(m.enemySpd).toBe(23);
    expect(m.enemyBonus?.crit).toBeCloseTo(0.15);
  });
});
