import { SHOP_REFRESH_GEMS, SETS, buyOffer, refreshShop, sellItem, sellValueOf, shopStock, syncShop, wearer } from '../game/gear';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { GearCard, SetBonusText } from './GearCard';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function ArmoryScreen({ save, update, onBack }: Props) {
  const today = syncShop(save, dayKey());
  const stock = shopStock(today);
  const loose = save.items.filter((i) => !wearer(save, i.id));

  return (
    <div className="armory">
      <BuildingHeader title="Armory" onBack={onBack}>
        <p className="muted">
          Weapons, armor and accessories. Each fighter wears 1 weapon, 1 armor and 2 accessories. New stock every day; better
          rarities show up as you go deeper into the story. Wear 2 or 4 pieces of one set for its bonus.
        </p>
      </BuildingHeader>

      <section className="panel">
        <div className="section-head">
          <h3>Today's stock</h3>
          <button className="btn small" disabled={save.gems < SHOP_REFRESH_GEMS} onClick={() => update((s) => refreshShop(s))}>
            New stock ◆ {SHOP_REFRESH_GEMS}
          </button>
        </div>
        <div className="gear-grid">
          {stock.map((offer, i) => {
            const sold = today.shop.bought.includes(i);
            const affordable = save.coins >= offer.coins && save.gems >= offer.gems;
            return (
              <GearCard key={i} item={offer}>
                <button className="btn small primary" disabled={sold || !affordable} onClick={() => update((s) => buyOffer(s, i))}>
                  {sold ? 'Sold out' : `● ${offer.coins.toLocaleString()}${offer.gems ? ` + ◆ ${offer.gems}` : ''}`}
                </button>
              </GearCard>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Sets</h3>
        <div className="set-list">
          {SETS.map((set) => (
            <SetBonusText key={set.id} setId={set.id} />
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Sell unworn gear ({loose.length})</h3>
        {loose.length === 0 ? (
          <p className="muted">Nothing to sell. Gear someone is wearing stays safe.</p>
        ) : (
          <div className="gear-grid">
            {loose.map((item) => (
              <GearCard key={item.id} save={save} item={item}>
                <button className="btn small" onClick={() => update((s) => sellItem(s, item.id))}>
                  Sell ● {sellValueOf(item).toLocaleString()}
                </button>
              </GearCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
