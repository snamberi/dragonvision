import { sfx } from '../audio/sound';
import { PixelIcon } from './PixelIcon';
import { useEffect, useRef, useState } from 'react';
import { FAMILIES, getFamily } from '../game/roster';
import { ItemIcon } from './ItemIcon';
import { orbs } from './format';
import { spinPrice } from '../game/balance';
import { buySpins, luckyFamilyId, summon, summonOdds, summonStarCap, summonTen } from '../game/summon';
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
  const [pieces, setPieces] = useState<string[]>([]);
  const [spinning, setSpinning] = useState(false);
  const rolling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const odds = summonOdds(save);
  const price = spinPrice(save.clearedStage);
  const chanceOf = (familyId: string) => odds.filter((o) => o.familyId === familyId).reduce((sum, o) => sum + o.chance, 0);

  const pull = (count: number) => {
    sfx('summon');
    if (rolling.current) return;
    const pulled: Unit[] = [];
    const found: string[] = [];
    const success = update((s) => {
      if (count === 10) {
        const result = summonTen(s);
        pulled.push(...result.units);
        found.push(...result.pieces);
        return result.save;
      }
      const result = summon(s);
      pulled.push(result.unit);
      if (result.piece) found.push(result.piece);
      return result.save;
    });
    if (!success) return;
    rolling.current = true;
    setSpinning(true);
    setResults([]);
    setPieces([]);
    timer.current = setTimeout(() => { setResults(pulled); setPieces(found); setSpinning(false); rolling.current = false; }, 1900);
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
        <div className={`summon-portal ${spinning ? 'spinning' : ''}`} role="status" aria-label={spinning ? 'Summoning fighters' : 'Summoning portal ready'}>
          <div className="portal-ring outer"/><div className="portal-ring inner"/>
          {Array.from({length:8},(_,i)=><span key={i} className="portal-rune" style={{transform:`rotate(${i*45}deg) translateY(-78px) rotate(${-i*45}deg)`}}>✦</span>)}
          <div className="portal-center"><ItemIcon icon="spinOrb" size={64} /></div>
          <span className="portal-caption">{spinning ? 'CALLING A FIGHTER…' : results.length ? 'SUMMON COMPLETE' : 'AWAKEN YOUR LEGEND'}</span>
        </div>
        <div className="spin-count"><PixelIcon kind="orb" /> {orbs(save.spins)}</div>
        <div className="button-row">
          <button className="btn primary big" disabled={spinning || save.spins < 1} onClick={() => pull(1)}>
            Summon ×1
          </button>
          <button className="btn big" disabled={spinning || save.spins < 10} onClick={() => pull(10)}>
            Summon ×10
          </button>
        </div>
        <p className="muted small-text">
          Every pull has a 0.5% chance of a bonus legendary piece (focus and the lucky fighter don't change it).
          ×10 guarantees one fighter a star above your best copy of a character you own. Today's lucky fighter:{' '}
          <b>{FAMILIES.find((f) => f.id === luckyFamilyId())?.name}</b>.
        </p>
        <div className="buy-spins">
          <span>
            Buy Spin Orbs: <span className="coin"><PixelIcon kind="coin" /> {price.toLocaleString()}</span> each
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
          Free Spin Orbs: 1 for each new stage, 5 per mini-boss, 10 per boss. Replays earn coins you can spend here.
        </p>

        {pieces.length > 0 && (
          <div className="piece-drops">
            {pieces.map((id, i) => (
              <span key={i} className="piece-drop">
                <ItemIcon icon="piece" size={40} /> Legendary piece: <b>{getFamily(id).name}</b>
              </span>
            ))}
          </div>
        )}
        {results.length > 0 && (
          <div className="pull-results">
            {results.map((u, i) => (
              <FighterCard
                key={u.uid}
                familyId={u.familyId}
                star={u.star}
                level={u.level}
                className="pull-card"
                badge={results.length === 10 && i === 9 ? 'GUARANTEED' : undefined}
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
