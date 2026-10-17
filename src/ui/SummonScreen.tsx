import { useState } from 'react';
import { unitName } from '../game/progression';
import { FAMILIES } from '../game/roster';
import { summon, summonOdds, summonStarCap } from '../game/summon';
import type { SaveData, Unit } from '../game/types';
import type { Updater } from './App';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
}

export function SummonScreen({ save, update }: Props) {
  const [results, setResults] = useState<Unit[]>([]);
  const odds = summonOdds(save);
  const chanceOf = (familyId: string) => odds.filter((o) => o.familyId === familyId).reduce((sum, o) => sum + o.chance, 0);

  const pull = (count: number) => {
    const pulled: Unit[] = [];
    update((s) => {
      let next = s;
      for (let i = 0; i < count && next.spins > 0; i++) {
        const result = summon(next);
        pulled.push(result.unit);
        next = result.save;
      }
      return next;
    });
    setResults(pulled);
  };

  const setFocus = (familyId: string) =>
    update((s) => ({ ...s, focusFamilyId: s.focusFamilyId === familyId ? null : familyId }));

  return (
    <div className="summon">
      <section className="panel summon-main">
        <h2>Summon</h2>
        <p className="muted">
          One shared pool. You can pull a fighter up to one star above your best version of them. Higher stars are rarer.
        </p>
        <div className="spin-count">✦ {save.spins} spin{save.spins === 1 ? '' : 's'}</div>
        <div className="button-row">
          <button className="btn primary big" disabled={save.spins < 1} onClick={() => pull(1)}>
            Summon ×1
          </button>
          <button className="btn big" disabled={save.spins < 10} onClick={() => pull(10)}>
            Summon ×10
          </button>
        </div>
        {save.spins === 0 && <p className="muted small-text">Clear new stages to earn spins: 1 per stage, 5 per mini-boss, 10 per boss.</p>}

        {results.length > 0 && (
          <div className="pull-results">
            {results.map((u, i) => (
              <div key={u.uid} className={`pull-card star-${Math.min(u.star, 6)}`} style={{ animationDelay: `${i * 90}ms` }}>
                <Sprite familyId={u.familyId} star={u.star} size={64} />
                <div className="unit-name">{unitName(u)}</div>
                <div className="unit-meta">
                  Lv {u.level} <Stars star={u.star} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="panel focus-list">
        <h3>Focus a fighter</h3>
        <p className="muted small-text">Raises their chance. Not guaranteed.</p>
        {FAMILIES.map((f) => {
          const focused = save.focusFamilyId === f.id;
          return (
            <button key={f.id} className={`focus-item ${focused ? 'active' : ''}`} onClick={() => setFocus(f.id)}>
              <Sprite familyId={f.id} star={Math.max(1, summonStarCap(save, f.id) - 1)} size={36} />
              <span className="focus-name">{f.name}</span>
              <span className="focus-meta">
                up to {summonStarCap(save, f.id)}★ · {(chanceOf(f.id) * 100).toFixed(1)}%
              </span>
            </button>
          );
        })}
      </aside>
    </div>
  );
}
