import { describe, expect, it } from 'vitest';
import { DAILY_BOOST_WINS, FOCUS_PITY_PULLS, MARKET_TICKETS_PER_DAY, WALL_STAGES } from '../game/balance';
import { rollExpedition } from '../game/expedition';
import { buyMarketOffer, marketStock, syncMarket, ticketsLeftToday } from '../game/market';
import { addUnit, newSave } from '../game/progression';
import { seededRng } from '../game/rng';
import { applyRewards, dailyBoostLeft, rewardsFor, withDailyBoost } from '../game/stages';
import { focusPityLeft, summon } from '../game/summon';
import type { SaveData } from '../game/types';

function findTicketDay(save: SaveData): { day: string; index: number } {
  for (let d = 1; d < 400; d++) {
    const day = `2026-01-${String(d).padStart(3, '0')}`;
    const stock = marketStock(syncMarket(save, day), day);
    const index = stock.findIndex((o) => o.good.kind === 'material' && o.good.id === 'refreshTicket');
    if (index >= 0) return { day, index };
  }
  throw new Error('no ticket offer found');
}

describe('market ticket cap', () => {
  it('stops selling Refresh Tickets after the daily cap, until the next day', () => {
    const save: SaveData = { ...newSave(), coins: 10_000_000, clearedStage: 20 };
    const { day, index } = findTicketDay(save);
    const synced = syncMarket(save, day);
    const bought = buyMarketOffer(synced, index, day);
    expect(bought.market.ticketsBought).toBe(1);
    expect(ticketsLeftToday(bought, day)).toBe(MARKET_TICKETS_PER_DAY - 1);

    const capped: SaveData = { ...synced, market: { ...synced.market, ticketsBought: MARKET_TICKETS_PER_DAY } };
    const offer = marketStock(capped, day)[index];
    expect(offer.good).toMatchObject({ kind: 'material', id: 'respecScroll' });
    expect(offer.coins).toBe(marketStock(synced, day)[index].coins);
    expect(ticketsLeftToday(syncMarket(capped, 'another-day'), 'another-day')).toBe(MARKET_TICKETS_PER_DAY);
  });
});

describe('focus pity', () => {
  it('brings the focused family at its best owned star every 100 pulls', () => {
    let save: SaveData = { ...newSave(), spins: 5, focusFamilyId: 'mei' };
    save = addUnit(save, { familyId: 'mei', star: 6, level: 1, baseLevel: 1, coinsSpent: 0 }).save;
    expect(focusPityLeft(save)).toBe(FOCUS_PITY_PULLS);
    const normal = summon(save, seededRng(1), '2026-10-23');
    expect(normal.save.focusPity).toBe(1);
    expect(normal.pity).toBeUndefined();

    const due = summon({ ...save, focusPity: FOCUS_PITY_PULLS - 1 }, seededRng(1), '2026-10-23');
    expect(due.pity).toBe(true);
    expect(due.unit).toMatchObject({ familyId: 'mei', star: 6 });
    expect(due.save.focusPity).toBe(0);
  });

  it('does not count pulls without a focus', () => {
    const save: SaveData = { ...newSave(), spins: 2, focusFamilyId: null };
    expect(summon(save, seededRng(2), '2026-10-23').save.focusPity).toBe(0);
    expect(focusPityLeft(save)).toBeNull();
  });
});

describe('active play boost', () => {
  it('doubles coins for the first few story wins each day', () => {
    let save = newSave();
    const day = '2026-10-23';
    for (let i = 0; i < DAILY_BOOST_WINS; i++) {
      const plain = rewardsFor(save, 1, () => 0.5);
      const r = withDailyBoost(save, plain, day);
      expect(r.coins).toBe(plain.coins * 2);
      expect(r.boostDay).toBe(day);
      save = applyRewards(save, 1, r);
    }
    expect(dailyBoostLeft(save, day)).toBe(0);
    const after = withDailyBoost(save, rewardsFor(save, 1, () => 0.5), day);
    expect(after.boostDay).toBeUndefined();
    expect(dailyBoostLeft(save, '2026-10-24')).toBe(DAILY_BOOST_WINS);
  });

  it('trims 8-hour expedition coins to 80%', () => {
    const save = { ...newSave(), clearedStage: 50 };
    const four = rollExpedition(save, 1, 4, () => 0.99).coins;
    const eight = rollExpedition(save, 1, 8, () => 0.99).coins;
    expect(eight / four).toBeCloseTo(1.6, 2);
  });

  it('softens the final wall to 1.4', () => {
    expect(WALL_STAGES[380]).toBe(1.4);
  });
});
