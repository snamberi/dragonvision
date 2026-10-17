import type { SaveData } from '../game/types';

interface Props {
  save: SaveData;
}

// Empty slots show where future items will go.
const ITEM_SLOTS = 12;

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
              <span className={`resource-icon ${r.className}`}>{r.icon}</span>
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

      <section className="panel">
        <h3>Items</h3>
        <p className="muted small-text">No items yet. Items you find will show up here.</p>
        <div className="item-grid">
          {Array.from({ length: ITEM_SLOTS }, (_, i) => (
            <div key={i} className="item-slot" />
          ))}
        </div>
      </section>
    </div>
  );
}
