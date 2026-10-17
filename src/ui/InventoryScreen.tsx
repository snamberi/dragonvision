import { useState } from 'react';
import { RARITIES, getTemplate } from '../game/gear';
import { type InventoryEntry, type ItemCategory, inventoryEntries } from '../game/items';
import { PIECES_TO_FORGE, forgeLegend } from '../game/legendary';
import { LEGENDARIES, formForStar, roleFor } from '../game/roster';
import type { GearItem, SaveData } from '../game/types';
import type { Updater } from './App';
import { GearCard, GearIcon } from './GearCard';
import { ItemIcon } from './ItemIcon';
import { PixelIcon } from './PixelIcon';
import { Sprite } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
}

type Tab = ItemCategory | 'gear';

const TABS: { id: Tab; label: string; short: string }[] = [
  { id: 'items', label: 'Items', short: 'Items' },
  { id: 'gear', label: 'Gear', short: 'Gear' },
  { id: 'materials', label: 'Materials', short: 'Mats' },
  { id: 'shards', label: 'Evo Shards', short: 'Shards' },
  { id: 'pieces', label: 'Pieces', short: 'Pieces' },
];

const EMPTY_TEXT: Record<Tab, string> = {
  items: 'Your bag is empty.',
  gear: "No gear yet. Buy some at the Armory or the Shop, or beat bosses for drops. Equip it from a fighter's page.",
  materials: 'No materials yet. Refresh Tickets and Respec Scrolls are sold at the Shop.',
  shards: 'No evolution shards yet. Make them in the Fusion Lab from spare fighters.',
  pieces: 'No legendary pieces yet. They drop from summons and stage bosses, and the Shop sells one at a time.',
};

/** At least four rows of slots, so the bag reads as space to fill. */
const MIN_SLOTS = 20;

export function InventoryScreen({ save, update }: Props) {
  const [tab, setTab] = useState<Tab>('items');
  const [picked, setPicked] = useState<string | null>(null);
  const [gearKind, setGearKind] = useState<'all' | 'weapon' | 'armor' | 'accessory'>('all');
  const entries = inventoryEntries(save);
  const shown = tab === 'items' ? entries : entries.filter((e) => e.category === tab);
  const gear = save.items
    .filter((i) => gearKind === 'all' || getTemplate(i.templateId).kind === gearKind)
    .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity) || a.templateId.localeCompare(b.templateId));
  const count = tab === 'gear' ? gear.length : shown.length;
  const slots = Math.max(MIN_SLOTS, Math.ceil((count + 1) / 5) * 5);
  const pickedEntry = shown.find((e) => e.key === picked);
  const pickedGear = tab === 'gear' ? gear.find((g) => g.id === picked) : undefined;

  const choose = (t: Tab) => {
    setTab(t);
    setPicked(null);
  };

  return (
    <div className="inventory">
      <div className="purse">
        <span className="coin"><PixelIcon kind="coin" size={16} /> {save.coins.toLocaleString()}</span>
        <span className="gem"><PixelIcon kind="gem" size={16} /> {save.gems.toLocaleString()}</span>
      </div>

      <div className="inv-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => choose(t.id)}>
            <span className="tab-long">{t.label}</span>
            <span className="tab-short">{t.short}</span>
          </button>
        ))}
      </div>

      <section className="panel bag">
        {tab === 'gear' && (
          <div className="button-row gear-kinds">
            {(['all', 'weapon', 'armor', 'accessory'] as const).map((k) => (
              <button key={k} className={`btn small ${gearKind === k ? 'primary' : ''}`} onClick={() => setGearKind(k)}>
                {k === 'all' ? 'All' : k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        )}
        {count === 0 && <p className="muted small-text">{EMPTY_TEXT[tab]}</p>}
        <div className="slot-grid">
          {tab === 'gear'
            ? gear.map((g) => <GearSlot key={g.id} item={g} active={picked === g.id} onPick={() => setPicked(g.id)} />)
            : shown.map((e) => <ItemSlot key={e.key} entry={e} active={picked === e.key} onPick={() => setPicked(e.key)} />)}
          {Array.from({ length: slots - count }, (_, i) => (
            <span key={`empty-${i}`} className="inv-slot empty" />
          ))}
        </div>
      </section>

      {pickedEntry && <ItemDetail entry={pickedEntry} />}
      {pickedGear && (
        <section className="panel">
          <GearCard save={save} item={pickedGear} />
        </section>
      )}
      {tab === 'pieces' && <Legends save={save} update={update} />}
    </div>
  );
}

function ItemSlot({ entry, active, onPick }: { entry: InventoryEntry; active: boolean; onPick: () => void }) {
  return (
    <button className={`inv-slot ${active ? 'active' : ''} cat-${entry.category}`} onClick={onPick} title={entry.name}>
      <ItemIcon icon={entry.icon} size={52} />
      {entry.familyId && <span className="slot-tag">{entry.name.replace(' Piece', '')}</span>}
      {entry.icon === 'shard' && <span className="slot-tag">{entry.name.split(' ')[0]}</span>}
      <span className="slot-count">{entry.count > 999 ? '999+' : entry.count}</span>
    </button>
  );
}

function GearSlot({ item, active, onPick }: { item: GearItem; active: boolean; onPick: () => void }) {
  return (
    <button className={`inv-slot ${active ? 'active' : ''}`} onClick={onPick} title={getTemplate(item.templateId).name}>
      <GearIcon templateId={item.templateId} rarity={item.rarity} size={52} />
    </button>
  );
}

function ItemDetail({ entry }: { entry: InventoryEntry }) {
  return (
    <section className="panel item-detail">
      <ItemIcon icon={entry.icon} size={64} />
      <div>
        <h3>
          {entry.name} <span className="muted">×{entry.count.toLocaleString()}</span>
        </h3>
        <p className="muted small-text">{entry.text}</p>
      </div>
    </section>
  );
}

/** All ten legendary fighters with their piece progress; ten pieces forge one. */
function Legends({ save, update }: { save: SaveData; update: Updater }) {
  const [made, setMade] = useState<string | null>(null);
  return (
    <section className="panel">
      <h3>Legendary fighters</h3>
      <p className="muted small-text">
        Never summoned. Collect {PIECES_TO_FORGE} pieces to forge one at 5★; forge again for a copy to evolve with.
      </p>
      {made && <p className="shard-chip">{made} joined your team roster!</p>}
      <div className="legend-list">
        {LEGENDARIES.map((f) => {
          const have = save.pieces[f.id] ?? 0;
          const owned = save.units.some((u) => u.familyId === f.id);
          const ready = have >= PIECES_TO_FORGE;
          return (
            <div key={f.id} className={`legend-row ${ready ? 'ready' : ''}`}>
              <Sprite familyId={f.id} star={5} size={48} className={owned ? "" : "unowned"} />
              <div className="legend-info">
                <b>{f.name}</b>
                <span className="muted small-text">
                  {f.title} · {roleFor(f)}
                </span>
                <span className="piece-bar" aria-label={`${have} of ${PIECES_TO_FORGE} pieces`}>
                  <i style={{ width: `${Math.min(100, (have / PIECES_TO_FORGE) * 100)}%` }} />
                  <em>
                    {have}/{PIECES_TO_FORGE}
                  </em>
                </span>
              </div>
              <button
                className={`btn small ${ready ? 'primary' : ''}`}
                disabled={!ready}
                onClick={() => {
                  if (update((s) => forgeLegend(s, f.id).save)) setMade(formForStar(f, 5).name);
                }}
              >
                {owned ? 'Forge copy' : 'Forge'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
