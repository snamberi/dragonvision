import { describe, expect, it } from 'vitest';
import { RESPEC_GEMS, respecAwakening } from '../game/awakening';
import { SHOP_REFRESH_GEMS, refreshShop } from '../game/gear';
import { inventoryEntries } from '../game/items';
import { PIECES_TO_FORGE, PIECE_SUMMON_CHANCE, addPieces, forgeLegend, rollSummonPiece } from '../game/legendary';
import { LEGENDARY_SLOT, MARKET_RANDOM, buyMarketOffer, marketStock, refreshMarket, syncMarket } from '../game/market';
import { newSave, unitName } from '../game/progression';
import { FAMILIES, LEGENDARIES, formForStar, getFamily, roleFor } from '../game/roster';
import { importCode, exportCode } from '../game/save';
import { rewardsFor } from '../game/stages';
import { summon, summonOdds } from '../game/summon';
import type { SaveData } from '../game/types';

const DAY = '2026-10-17';

describe('legendary fighters', () => {
  it('has ten legendaries, two per class, kept out of summons', () => {
    expect(LEGENDARIES).toHaveLength(10);
    const roles = LEGENDARIES.map(roleFor);
    for (const role of ['Tank', 'Assassin', 'Blaster', 'Support', 'Drainer']) expect(roles.filter((r) => r === role)).toHaveLength(2);
    const summonable = new Set(summonOdds(newSave()).map((o) => o.familyId));
    for (const f of LEGENDARIES) expect(summonable.has(f.id)).toBe(false);
    expect(FAMILIES.some((f) => f.legendary)).toBe(false);
  });

  it('shows the first form at 5★', () => {
    const ryuga = getFamily('ryuga');
    expect(formForStar(ryuga, 5).name).toBe('Ryuga');
    expect(formForStar(ryuga, 6).name).toBe('Crimson Ryuga');
    expect(formForStar(ryuga, 21).name).toBe('Celestial Dragon Ryuga');
  });

  it('forges a fighter from ten pieces', () => {
    let save = addPieces(newSave(), 'nyxara', PIECES_TO_FORGE - 1);
    expect(() => forgeLegend(save, 'nyxara')).toThrow(/10 pieces/);
    save = addPieces(save, 'nyxara');
    const { save: after, unit } = forgeLegend(save, 'nyxara');
    expect(unit.star).toBe(5);
    expect(unitName(unit)).toBe('Nyxara');
    expect(after.pieces.nyxara).toBe(0);
    expect(() => addPieces(newSave(), 'kairo')).toThrow();
  });

  it('drops a piece on 0.5% of summons', () => {
    expect(rollSummonPiece(() => PIECE_SUMMON_CHANCE - 0.0001)).not.toBeNull();
    expect(rollSummonPiece(() => PIECE_SUMMON_CHANCE)).toBeNull();
    const rolls = [0.5, 0.5, 0.5, 0.001, 0];
    const pull = summon({ ...newSave(), spins: 1 }, () => rolls.shift() ?? 0);
    expect(pull.piece).toBe(LEGENDARIES[0].id);
    expect(pull.save.pieces[LEGENDARIES[0].id]).toBe(1);
  });

  it('can drop a piece from a stage boss, even on a replay', () => {
    const save = { ...newSave(), clearedStage: 10 };
    expect(rewardsFor(save, 10, () => 0).piece).toBe(LEGENDARIES[0].id);
    expect(rewardsFor(save, 10, () => 0.99).piece).toBeUndefined();
    expect(rewardsFor(save, 9, () => 0).piece).toBeUndefined();
  });
});

describe('the Shop', () => {
  const rich: SaveData = { ...syncMarket(newSave(), DAY), coins: 10_000_000, gems: 10_000, clearedStage: 120 };

  it('stocks six offers and one legendary offer', () => {
    const stock = marketStock(rich, DAY);
    expect(stock).toHaveLength(MARKET_RANDOM + 1);
    expect(stock[LEGENDARY_SLOT].legendary).toBe(true);
    expect(stock.slice(0, MARKET_RANDOM).every((o) => !o.legendary)).toBe(true);
    const legend = stock[LEGENDARY_SLOT].good;
    expect(
      (legend.kind === 'spins' && legend.count === 20) ||
        legend.kind === 'piece' ||
        (legend.kind === 'gear' && legend.rarity === 'legendary'),
    ).toBe(true);
  });

  it('sells each offer once and legendary pieces one at a time', () => {
    // Find a day whose legendary offer is a piece.
    let day = DAY;
    for (let i = 0; marketStock(rich, day)[LEGENDARY_SLOT].good.kind !== 'piece'; i++) day = `2026-11-${String(i + 1).padStart(2, '0')}`;
    const save = buyMarketOffer(syncMarket(rich, day), LEGENDARY_SLOT, day);
    const total = Object.values(save.pieces).reduce((a, b) => a + b, 0);
    expect(total).toBe(1);
    expect(save.gems).toBe(rich.gems - marketStock(rich, day)[LEGENDARY_SLOT].gems);
    expect(() => buyMarketOffer(save, LEGENDARY_SLOT, day)).toThrow(/Sold out/);
  });

  it('refreshes with a ticket before gems', () => {
    const withTicket = { ...rich, materials: { ...rich.materials, refreshTicket: 1 } };
    const a = refreshMarket(withTicket, DAY);
    expect(a.materials.refreshTicket).toBe(0);
    expect(a.gems).toBe(rich.gems);
    const b = refreshMarket(a, DAY);
    expect(b.gems).toBe(rich.gems - SHOP_REFRESH_GEMS);
    expect(refreshShop({ ...withTicket, shop: { day: DAY, refreshes: 0, bought: [] } }, DAY).materials.refreshTicket).toBe(0);
  });
});

describe('items and materials', () => {
  it('lists Spin Orbs, materials, shards and pieces', () => {
    const save: SaveData = { ...newSave(), spins: 3, shards: { 2: 1 }, pieces: { volkan: 4 }, materials: { refreshTicket: 0, respecScroll: 2 } };
    const entries = inventoryEntries(save);
    expect(entries.map((e) => e.key)).toEqual(['spins', 'respecScroll', 'shard-2', 'piece-volkan']);
    expect(entries.find((e) => e.key === 'spins')!.icon).toBe('spinOrb');
  });

  it('uses a Respec Scroll before gems', () => {
    let save: SaveData = { ...newSave(), gems: 50, materials: { refreshTicket: 0, respecScroll: 1 } };
    save = { ...save, units: [{ ...save.units[0], star: 12, awakened: ['kairo-0'] }] };
    const a = respecAwakening(save, 'u1');
    expect(a.materials.respecScroll).toBe(0);
    expect(a.gems).toBe(50);
    const b = respecAwakening({ ...a, units: save.units }, 'u1');
    expect(b.gems).toBe(50 - RESPEC_GEMS);
  });

  it('fills the new fields when loading an older save', () => {
    const old = newSave() as Partial<SaveData>;
    delete old.pieces;
    delete old.materials;
    delete old.market;
    const loaded = importCode(exportCode(old as SaveData));
    expect(loaded.pieces).toEqual({});
    expect(loaded.materials).toEqual({ refreshTicket: 0, respecScroll: 0 });
    expect(loaded.market.bought).toEqual([]);
  });
});
