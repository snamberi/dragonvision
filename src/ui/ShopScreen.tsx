import { useActionFeedback } from './useActionFeedback';
import { SHOP_REFRESH_GEMS } from '../game/gear';
import { goodName } from '../game/items';
import { LEGENDARY_SLOT, type MarketGood, buyMarketOffer, marketStock, refreshMarket, syncMarket } from '../game/market';
import { getFamily } from '../game/roster';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { GearIcon } from './GearCard';
import { ItemIcon } from './ItemIcon';
import { PixelIcon } from './PixelIcon';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

function GoodIcon({ good, size = 56 }: { good: MarketGood; size?: number }) {
  if (good.kind === 'gear') return <GearIcon templateId={good.templateId} rarity={good.rarity} size={size} />;
  const icon = good.kind === 'spins' ? 'spinOrb' : good.kind === 'shard' ? 'shard' : good.kind === 'piece' ? 'piece' : good.id;
  return <ItemIcon icon={icon} size={size} />;
}

function goodText(good: MarketGood): string {
  switch (good.kind) {
    case 'spins':
      return 'Summon fighters at the Summoning Shrine.';
    case 'shard':
      return `Counts as a duplicate when evolving a ${good.star}★ fighter.`;
    case 'gear':
      return 'Goes straight to your Inventory.';
    case 'material':
      return good.id === 'refreshTicket' ? 'A free restock here or at the Armory.' : 'A free awakening reset.';
    case 'piece': {
      const f = getFamily(good.familyId);
      return `1 of 10 pieces to forge ${f.name}, ${f.title}.`;
    }
  }
}

export function ShopScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const today = syncMarket(save, dayKey());
  const stock = marketStock(today);
  const tickets = save.materials.refreshTicket;
  const canRefresh = tickets > 0 || save.gems >= SHOP_REFRESH_GEMS;

  const card = (i: number) => {
    const offer = stock[i];
    const sold = today.market.bought.includes(i);
    const affordable = save.coins >= offer.coins && save.gems >= offer.gems;
    return (
      <article key={i} className={`shop-offer ${offer.legendary ? 'legendary' : ''} ${sold ? 'sold' : ''}`}>
        <GoodIcon good={offer.good} size={offer.legendary ? 72 : 56} />
        <b>{goodName(offer.good)}</b>
        <span className="muted small-text">{goodText(offer.good)}</span>
        <button className={`btn small ${offer.legendary ? 'primary' : ''}`} disabled={sold || !affordable} onClick={() => update((s) => buyMarketOffer(s, i), 'Purchase added to Inventory')}>
          {sold ? (
            'Sold out'
          ) : offer.gems > 0 ? (
            <><PixelIcon kind="gem" size={16} /> {offer.gems}</>
          ) : (
            <><PixelIcon kind="coin" size={16} /> {offer.coins.toLocaleString()}</>
          )}
        </button>
      </article>
    );
  };

  return (
    <div className="shop area-polished">{feedback}
      <BuildingHeader title="Shop" onBack={onBack}>
        <p className="muted">Six new offers every day, plus one legendary offer in gold. Each offer sells once.</p>
      </BuildingHeader>
      <section className="panel">
        <div className="section-head">
          <h3>Legendary offer</h3>
        </div>
        <div className="shop-legendary">{card(LEGENDARY_SLOT)}</div>
      </section>
      <section className="panel">
        <div className="section-head">
          <h3>Today's offers</h3>
          <button className="btn small" disabled={!canRefresh} onClick={() => update((s) => refreshMarket(s))}>
            {tickets > 0 ? `New stock (ticket, ${tickets} left)` : <>New stock <PixelIcon kind="gem" size={16} /> {SHOP_REFRESH_GEMS}</>}
          </button>
        </div>
        <div className="shop-grid">{stock.slice(0, LEGENDARY_SLOT).map((_, i) => card(i))}</div>
      </section>
    </div>
  );
}
