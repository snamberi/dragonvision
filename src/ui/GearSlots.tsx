import { useState } from 'react';
import { describeBonus } from '../game/bonus';
import { RARITIES, SLOT_KINDS, SLOT_LABEL, equip, gearBonus, gearEffects, getTemplate, setCounts, unequip } from '../game/gear';
import { GEAR_EFFECTS } from '../game/bossSets';
import type { GearSlotKey, SaveData, Unit } from '../game/types';
import type { Updater } from './App';
import { GearCard, GearIcon, SetBonusText } from './GearCard';

const SLOTS: GearSlotKey[] = ['weapon', 'armor', 'acc1', 'acc2'];

/** A fighter's four gear slots, with a picker to swap pieces in and out. */
export function GearSlots({ save, unit, update }: { save: SaveData; unit: Unit; update: Updater }) {
  const [picking, setPicking] = useState<GearSlotKey | null>(null);
  const sets = setCounts(save, unit);
  const total = describeBonus(gearBonus(save, unit));
  const effects = gearEffects(save, unit);

  const options = picking
    ? save.items
        .filter((i) => getTemplate(i.templateId).kind === SLOT_KINDS[picking])
        .sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity))
    : [];

  return (
    <section className="panel">
      <h3>Gear</h3>
      <div className="gear-slots">
        {SLOTS.map((slot) => {
          const itemId = unit.gear?.[slot];
          const item = itemId ? save.items.find((i) => i.id === itemId) : undefined;
          return (
            <button key={slot} className={`gear-slot ${item ? 'filled' : ''}`} onClick={() => setPicking(slot)}>
              {item ? <GearIcon templateId={item.templateId} rarity={item.rarity} size={48} /> : <span className="gear-empty">+</span>}
              <span className="gear-slot-name">{item ? getTemplate(item.templateId).name : SLOT_LABEL[slot]}</span>
            </button>
          );
        })}
      </div>
      <p className="muted small-text">{total ? `Gear gives: ${total}` : 'No gear on. Tap a slot to equip.'}</p>
      {sets.map(({ set, pieces }) => (
        <p key={set.id} className={`small-text ${pieces >= 4 ? 'set-active-4' : pieces >= 2 ? 'set-active-2' : ''}`}>
          {pieces}/4 {pieces >= 4 ? '✦' : pieces >= 2 ? '◆' : ''} · <SetBonusText setId={set.id} />
        </p>
      ))}
      {effects.length > 0 && (
        <p className="small-text set-effects">
          Active set effects: {effects.map((e) => `${GEAR_EFFECTS[e].name} (${GEAR_EFFECTS[e].text})`).join(' · ')}
        </p>
      )}

      {picking && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setPicking(null)}>
          <div className="modal panel gear-picker" onClick={(e) => e.stopPropagation()}>
            <h3>{SLOT_LABEL[picking]}</h3>
            {unit.gear?.[picking] && (
              <button
                className="btn small"
                onClick={() => {
                  update((s) => unequip(s, unit.uid, picking));
                  setPicking(null);
                }}
              >
                Take off
              </button>
            )}
            {options.length === 0 ? (
              <p className="muted">No {SLOT_KINDS[picking]} gear yet. Visit the Armory in the City.</p>
            ) : (
              <div className="gear-grid">
                {options.map((item) => (
                  <GearCard
                    key={item.id}
                    save={save}
                    item={item}
                    selected={unit.gear?.[picking] === item.id}
                    onClick={() => {
                      if (update((s) => equip(s, unit.uid, picking, item.id))) setPicking(null);
                    }}
                  />
                ))}
              </div>
            )}
            <button className="btn ghost" onClick={() => setPicking(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
