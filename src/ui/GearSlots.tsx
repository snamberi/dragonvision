import { useState } from 'react';
import { type Bonus, describeBonus } from '../game/bonus';
import { type GearComparison, autoEquip, autoEquipTeam, benchWouldHelp, compareSwap } from '../game/gearTools';
import { useActionFeedback } from './useActionFeedback';
import { RARITIES, SLOT_KINDS, SLOT_LABEL, equip, gearBonus, gearEffects, getTemplate, setCounts, unequip } from '../game/gear';
import { GEAR_EFFECTS } from '../game/bossSets';
import type { GearSlotKey, SaveData, Unit } from '../game/types';
import type { Updater } from './App';
import { GearCard, GearIcon, SetBonusText } from './GearCard';

const SLOTS: GearSlotKey[] = ['weapon', 'armor', 'acc1', 'acc2'];

/** A fighter's four gear slots, with a picker to swap pieces in and out. */
export function GearSlots({ save, unit, update: commit }: { save: SaveData; unit: Unit; update: Updater }) {
  const { update, feedback } = useActionFeedback(commit);
  const [picking, setPicking] = useState<GearSlotKey | null>(null);
  const onTeam = save.team.includes(unit.uid);

  const runAuto = (team: boolean) => {
    const uids = team ? save.team.filter((t): t is string => Boolean(t)) : [unit.uid];
    if (uids.length === 0) return;
    const bench = benchWouldHelp(save, uids) && window.confirm('Better gear is on fighters who are off the team. Take it from the bench?');
    const result = team ? autoEquipTeam(save, bench) : autoEquip(save, unit.uid, bench);
    if (result.changed === 0) {
      update((s) => s, team ? 'Your team already wears its best gear' : 'Already wearing the best gear');
      return;
    }
    const benchNote = result.fromBench ? `, ${result.fromBench} from the bench` : '';
    update(() => result.save, `Equipped ${result.changed} piece${result.changed === 1 ? '' : 's'}${benchNote}`);
  };
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
      {feedback}
      <div className="section-head">
        <h3>Gear</h3>
        <div className="row gap-sm">
          <button className="btn small primary" onClick={() => runAuto(false)}>Auto-equip</button>
          {onTeam && (
            <button className="btn small" onClick={() => runAuto(true)}>Gear up team</button>
          )}
        </div>
      </div>
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
                  commit((s) => unequip(s, unit.uid, picking));
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
                      if (commit((s) => equip(s, unit.uid, picking, item.id))) setPicking(null);
                    }}
                  >
                    {unit.gear?.[picking] !== item.id && <CompareLine cmp={compareSwap(save, unit.uid, picking, item.id)} />}
                  </GearCard>
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

const FLAT: (keyof Bonus)[] = ['spd', 'ki', 'charge', 'chargeDiscount'];

function deltaText(stat: keyof Bonus, delta: number): string {
  const sign = delta > 0 ? '+' : '−';
  const abs = Math.abs(delta);
  const amount = FLAT.includes(stat) ? `${abs}` : `${Math.round(abs * 1000) / 10}%`;
  return `${sign}${amount} ${STAT_SHORT[stat] ?? stat}`;
}

const STAT_SHORT: Partial<Record<keyof Bonus, string>> = {
  atk: 'ATK', hp: 'HP', def: 'DEF', spd: 'SPD', crit: 'crit', ki: 'Ki', charge: 'charge', shield: 'shield', heal: 'heal',
  edge: 'edge', specialPower: 'special', chargeDiscount: 'special cost', lastStand: 'last stand', secondWind: 'second wind',
  firstStrike: 'first strike', drain: 'drain',
};

/** Green/red stat changes and set bonuses gained or lost versus the piece in the slot now. */
function CompareLine({ cmp }: { cmp: GearComparison }) {
  if (cmp.stats.length === 0 && cmp.gained.length === 0 && cmp.lost.length === 0) {
    return <span className="gear-compare muted small-text">No change</span>;
  }
  return (
    <span className="gear-compare small-text">
      {cmp.stats.map((d) => (
        <span key={d.stat} className={d.delta > 0 ? 'delta-up' : 'delta-down'}>
          {deltaText(d.stat, d.delta)}
        </span>
      ))}
      {cmp.gained.map((g) => (
        <span key={`g-${g}`} className="delta-up">▲ {g}</span>
      ))}
      {cmp.lost.map((l) => (
        <span key={`l-${l}`} className="delta-down">▼ {l}</span>
      ))}
    </span>
  );
}
