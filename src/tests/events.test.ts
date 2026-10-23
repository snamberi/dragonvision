import { describe, expect, it } from 'vitest';
import { createBattle } from '../game/battle';
import { buyEventOffer, eventOffers, offerLeft } from '../game/eventShop';
import {
  EVENTS,
  EVENT_STAGES,
  currentEvent,
  eventForWeek,
  eventProgress,
  eventStage,
  eventStageUnlocked,
  eventTimeLeft,
  eventTokens,
  syncEvent,
  winEventStage,
} from '../game/events';
import { settleSideBattle } from '../game/sideModes';
import { equipSkin, equippedSkin } from '../game/skins';
import { newSave, teamSlots } from '../game/progression';
import { seededRng } from '../game/rng';
import { summonOdds } from '../game/summon';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';

// Wednesday of ISO week 2026-W43, and the Wednesday after.
const WEEK_A = new Date(2026, 9, 21, 12);
const WEEK_B = new Date(2026, 9, 28, 12);

function rich(save: SaveData, now = WEEK_A): SaveData {
  const synced = syncEvent(save, now);
  return { ...synced, event: { ...synced.event!, currency: 10_000 } };
}

describe('event calendar', () => {
  it('is the same for everyone and walks through every event in order', () => {
    expect(eventForWeek('2026-W43')).toBe(eventForWeek('2026-W43'));
    const run = Array.from({ length: EVENTS.length }, (_, i) => eventForWeek(`2026-W${10 + i}`).id);
    expect(new Set(run).size).toBe(EVENTS.length);
    expect(currentEvent(WEEK_A).id).not.toBe(currentEvent(WEEK_B).id);
  });

  it('ends on the next Monday', () => {
    const left = eventTimeLeft(WEEK_A);
    expect(left).toBeGreaterThan(4 * 86_400_000);
    expect(left).toBeLessThanOrEqual(5 * 86_400_000);
  });
});

describe('event chapter', () => {
  it('has 10 labelled stages around the frontier, a mini-boss at 5 and a boss at 10', () => {
    const save = { ...newSave(), clearedStage: 120 };
    const ev = currentEvent(WEEK_A);
    const first = eventStage(save, 1, WEEK_A);
    const last = eventStage(save, EVENT_STAGES, WEEK_A);
    expect(first.label).toContain(ev.name);
    expect(first.arenaId).toBe(ev.arenaId);
    expect(first.weather).toBe(ev.weather);
    expect(eventStage(save, 5, WEEK_A).kind).toBe('miniBoss');
    expect(last.kind).toBe('boss');
    expect(last.enemies[0].familyId).toBe(ev.villains[0]);
    expect(last.number).toBeGreaterThan(first.number);
    expect(Math.abs(last.number - 120)).toBeLessThanOrEqual(5);
    expect(() => createBattle(teamSlots(save), first)).not.toThrow();
  });

  it('unlocks in order and pays more on first clears than replays', () => {
    let save = syncEvent(newSave(), WEEK_A);
    expect(eventStageUnlocked(save, 2, WEEK_A)).toBe(false);
    expect(() => winEventStage(save, 2, WEEK_A)).toThrow(/locked/);
    const first = winEventStage(save, 1, WEEK_A);
    expect(first.firstClear).toBe(true);
    save = first.save;
    expect(eventProgress(save, WEEK_A)).toMatchObject({ cleared: 1, currency: eventTokens(1, true) });
    const replay = winEventStage(save, 1, WEEK_A);
    expect(replay.firstClear).toBe(false);
    expect(replay.tokens).toBe(eventTokens(1, false));
    expect(eventTokens(1, true)).toBeGreaterThan(eventTokens(1, false));
    expect(eventTokens(EVENT_STAGES, true)).toBeGreaterThan(eventTokens(EVENT_STAGES - 1, true));
  });

  it('settles a won event battle through the side-mode flow', () => {
    const save = syncEvent(newSave());
    const stage = eventStage(save, 1);
    const battle = { ...createBattle(teamSlots(save), stage), result: 'won' as const };
    const settled = settleSideBattle('event', save, stage, battle, 1);
    expect(settled.save.event!.cleared).toBe(1);
    expect(settled.lines[0]).toContain(currentEvent().currency);
    const lost = settleSideBattle('event', save, stage, { ...battle, result: 'lost' }, 1);
    expect(lost.save).toBe(save);
  });
});

describe('event shop', () => {
  it('sells the event skin once, keeps it, and charges currency', () => {
    const ev = currentEvent(WEEK_A);
    const save = rich(newSave());
    const { save: bought } = buyEventOffer(save, 'skin', WEEK_A, seededRng(1));
    expect(bought.ownedSkins).toContain(ev.skinId);
    expect(bought.event!.currency).toBe(10_000 - eventOffers(ev).find((o) => o.id === 'skin')!.price);
    expect(() => buyEventOffer(bought, 'skin', WEEK_A)).toThrow(/Sold out/);
    const worn = equipSkin(bought, ev.featured, ev.skinId);
    expect(equippedSkin(worn, ev.featured)).toBe(ev.skinId);
    expect(() => equipSkin(save, ev.featured, ev.skinId)).toThrow(/do not own/);
  });

  it('featured summon adds the featured fighter without spending spins', () => {
    const ev = currentEvent(WEEK_A);
    const save = rich(newSave());
    const { save: after, pull } = buyEventOffer(save, 'featured', WEEK_A, seededRng(4));
    expect(pull?.unit.familyId).toBe(ev.featured);
    expect(after.spins).toBe(save.spins);
    expect(after.units.length).toBe(save.units.length + 1);
  });

  it('refuses when you cannot afford it or the limit is reached', () => {
    const poor = syncEvent(newSave(), WEEK_A);
    expect(() => buyEventOffer(poor, 'spins', WEEK_A)).toThrow(/Not enough/);
    const spins = eventOffers(currentEvent(WEEK_A)).find((o) => o.id === 'spins')!;
    const maxed = Array.from({ length: spins.limit }).reduce<SaveData>((s) => buyEventOffer(s, 'spins', WEEK_A).save, rich(newSave()));
    expect(offerLeft(maxed, spins, WEEK_A)).toBe(0);
    expect(() => buyEventOffer(maxed, 'spins', WEEK_A)).toThrow(/Sold out/);
  });

  it('resets currency, progress and limits when the next event starts, but keeps skins', () => {
    const ev = currentEvent(WEEK_A);
    const save = buyEventOffer(rich(newSave()), 'skin', WEEK_A).save;
    const next = syncEvent(save, WEEK_B);
    expect(next.event).toMatchObject({ cleared: 0, currency: 0, bought: {} });
    expect(next.ownedSkins).toContain(ev.skinId);
  });
});

describe('featured summon rate-up', () => {
  it('makes the featured fighter more likely than on a week where it is not featured', () => {
    const save = newSave();
    const featured = currentEvent(WEEK_A).featured;
    const other = EVENTS.map((e, i) => ({ e, week: new Date(2026, 9, 21 + 7 * i, 12) })).find(({ week }) => currentEvent(week).featured !== featured)!;
    const chance = (day: string) => summonOdds(save, day).filter((r) => r.familyId === featured).reduce((a, r) => a + r.chance, 0);
    expect(chance(dayKey(WEEK_A))).toBeGreaterThan(chance(dayKey(other.week)) * 2);
  });
});

describe('event replay cap', () => {
  it('stops paying replay currency after the daily cap, but first clears still pay', async () => {
    const { EVENT_REPLAY_DAILY_CAP, winEventStage, replayTokensLeft } = await import('../game/events');
    const { newSave } = await import('../game/progression');
    const now = new Date(2026, 9, 21, 12);
    let save = winEventStage({ ...newSave(), clearedStage: 50 }, 1, now).save;
    const earned = () => save.event!.currency;
    const afterFirst = earned();
    for (let i = 0; i < 40; i++) save = winEventStage(save, 1, now).save;
    expect(earned() - afterFirst).toBe(EVENT_REPLAY_DAILY_CAP);
    expect(replayTokensLeft(save, now)).toBe(0);
    const before = earned();
    save = winEventStage(save, 2, now).save;
    expect(earned()).toBeGreaterThan(before);
    expect(replayTokensLeft(save, new Date(2026, 9, 22, 12))).toBe(EVENT_REPLAY_DAILY_CAP);
  });
});
