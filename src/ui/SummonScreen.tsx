import { useState } from 'react';
import { FAMILIES } from '../game/roster';
import { spinPrice } from '../game/balance';
import { buySpins, summon, summonOdds, summonStarCap } from '../game/summon';
import type { SaveData, Unit } from '../game/types';
import type { Updater } from './App';
import { FighterCard } from './FighterCard';
import { Sprite } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function SummonScreen({ save, update, onBack }: Props) {
  const [results, setResults] = useState<Unit[]>([]);
  const odds = summonOdds(save);
  const price = spinPrice(save.clearedStage);
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
      <button className="btn ghost summon-back" onClick={onBack}>
        ← City
      </button>
      <section className="panel summon-main">
        <div className="eyebrow">Vision City</div>
        <h2>Summoning Shrine</h2>
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
        <div className="buy-spins">
          <span>
            Buy spins: <span className="coin">● {price.toLocaleString()}</span> each
          </span>
          <div className="button-row">
            <button className="btn small" disabled={save.coins < price} onClick={() => update((s) => buySpins(s, 1))}>
              Buy 1
            </button>
            <button className="btn small" disabled={save.coins < price * 10} onClick={() => update((s) => buySpins(s, 10))}>
              Buy 10
            </button>
          </div>
        </div>
        <p className="muted small-text">
          Free spins: 1 for each new stage, 5 per mini-boss, 10 per boss. Replays earn coins you can spend here.
        </p>

        {results.length > 0 && (
          <div className="pull-results">
            {results.map((u, i) => (
              <FighterCard
                key={u.uid}
                familyId={u.familyId}
                star={u.star}
                level={u.level}
                className="pull-card"
                style={{ animationDelay: `${i * 90}ms` }}
              />
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
