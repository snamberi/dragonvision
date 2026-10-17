import { PixelIcon } from './PixelIcon';
import { useState } from 'react';
import { RARITIES, getTemplate } from '../game/gear';
import type { SaveData } from '../game/types';
import { GearCard } from './GearCard';

interface Props {
  save: SaveData;
}


export function InventoryScreen({ save }: Props) {
  const resources = [
    { icon: '●', className: 'coin', name: 'Coins', amount: save.coins, use: 'Buy levels for your fighters.' },
    { icon: '◆', className: 'gem', name: 'Gems', amount: save.gems, use: 'Reset a fighter’s bought levels and get the coins back.' },
    { icon: '✦', className: 'spin', name: 'Summon Spins', amount: save.spins, use: 'Summon fighters at the Summoning Shrine in the City.' },
  ];

  return (
    <div className="inventory">
      <section className="panel">
        <h2>Inventory</h2>
        <div className="resource-list">
          {resources.map((r) => (
            <div key={r.name} className="resource">
              <span className={`resource-icon ${r.className}`}><PixelIcon kind={r.className} size={42} /></span>
              <div className="resource-info">
                <span className="resource-name">{r.name}</span>
                <span className="muted small-text">{r.use}</span>
              </div>
              <span className={`resource-amount ${r.className}`}>{r.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Evolution shards</h3>
        <p className="muted small-text">Made in the Fusion Lab. Each counts as one duplicate when evolving a fighter of that star.</p>
        <div className="shard-row">
          {Object.entries(save.shards).filter(([, n]) => n > 0).length === 0 ? (
            <span className="muted">None yet.</span>
          ) : (
            Object.entries(save.shards)
              .filter(([, n]) => n > 0)
              .map(([star, n]) => (
                <span key={star} className="shard-chip">
                  ◇ {star}★ × {n}
                </span>
              ))
          )}
        </div>
      </section>

      <GearInventory save={save} />
    </div>
  );
}

type Filter = 'all' | 'weapon' | 'armor' | 'accessory';

/** Every gear piece owned, best rarity first. Equip from a fighter's page. */
function GearInventory({ save }: { save: SaveData }) {
  const [filter, setFilter] = useState<Filter>('all');
  const items = save.items
    .filter((i) => filter === 'all' || getTemplate(i.templateId).kind === filter)
    .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || a.templateId.localeCompare(b.templateId));
  return (
    <section className="panel">
      <div className="section-head">
        <h3>Gear ({save.items.length})</h3>
        <div className="button-row">
          {(['all', 'weapon', 'armor', 'accessory'] as Filter[]).map((f) => (
            <button key={f} className={`btn small ${filter === f ? 'primary' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="muted small-text">No gear yet. Buy some at the Armory in the City, or beat bosses for drops. Equip it from a fighter's page.</p>
      ) : (
        <div className="gear-grid">
          {items.map((item) => (
            <GearCard key={item.id} save={save} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
