import { sfx } from '../audio/sound';
import { PixelIcon } from './PixelIcon';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { BuildingInterior } from './BuildingInterior';
import { tierFor } from './rarity';
import { unitName } from '../game/progression';
import { FAMILIES, GOLDEN_FAMILIES, getFamily } from '../game/roster';
import { ItemIcon } from './ItemIcon';
import { orbs } from './format';
import { spinPrice, PITY_THRESHOLD } from '../game/balance';
import { buyGoldenOrbs, GOLDEN_ORB_PRICE, goldenSummonOdds, summonGolden, buySpins, luckyFamilyId, summon, summonOdds, summonStarCap, summonTen } from '../game/summon';
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
  const [banner,setBanner]=useState<'normal'|'golden'>('normal');
  const [showAll,setShowAll]=useState(false);
  const golden=banner==='golden';
  const pool=golden?GOLDEN_FAMILIES:FAMILIES;
  const balance=golden?(save.goldenOrbs??0):save.spins;
  const [results, setResults] = useState<Unit[]>([]);
  const [pieces, setPieces] = useState<string[]>([]);
  const [phase, setPhase] = useState<'idle'|'charge'|'silhouette'|'reveal'|'complete'>('idle');
  const [revealed, setRevealed] = useState(0);
  const [revealIndex, setRevealIndex] = useState(0);
  const rolling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinning = phase !== 'idle' && phase !== 'complete';
  const finishReveal = () => {
    if(timer.current) clearTimeout(timer.current);
    setRevealed(results.length); setPhase('complete'); rolling.current=false;
  };
  useEffect(() => {
    if(phase==='charge') timer.current=setTimeout(()=>setPhase('silhouette'),800);
    else if(phase==='silhouette') timer.current=setTimeout(()=>{setPhase('reveal');setRevealed(revealIndex+1);},650);
    else if(phase==='reveal') timer.current=setTimeout(()=>{
      if(revealIndex+1<results.length) {setRevealIndex(i=>i+1);setPhase('silhouette');}
      else {setPhase('complete');rolling.current=false;}
    },results.length===1?1000:550);
    return () => {if(timer.current) clearTimeout(timer.current);};
  },[phase,revealIndex,results.length]);
  const featured=results[revealIndex];
  const glow=golden?'#ffdc7d':featured?tierFor(featured.star).color:'#c7a1ff';
  const odds = golden ? goldenSummonOdds(save) : summonOdds(save);
  const price = spinPrice(save.clearedStage);
  const chanceOf = (familyId: string) => odds.filter((o) => o.familyId === familyId).reduce((sum, o) => sum + o.chance, 0);

  const pull = (count: number) => {
    if (rolling.current) return;
    sfx('summon');
    const pulled: Unit[] = [];
    const found: string[] = [];
    const success = update((s) => {
      if (golden) { const result=summonGolden(s,count===10?10:1);pulled.push(...result.units);return result.save; }
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rolling.current = !reduced;
    setResults(pulled); setPieces(found); setRevealIndex(0);
    setRevealed(reduced?pulled.length:0); setPhase(reduced?'complete':'charge');

  };

  const setFocus = (familyId: string) =>
    update((s) => ({ ...s, focusFamilyId: s.focusFamilyId === familyId ? null : familyId }));

  return (
    <div className={`summon ${golden?'golden-shrine':''}`}>
      <button className="btn ghost summon-back" onClick={onBack}>
        ← City
      </button>
      <section className="panel summon-main">
        <BuildingInterior kind="summon"/>
        <div className="summon-content">
        <div className="eyebrow">Vision City</div>
        <h2>{golden?'Golden Summoning':'Summoning Shrine'}</h2>
        <div className="summon-banners" role="group" aria-label="Summoning pool">
          {(['normal','golden'] as const).map(b=><button key={b} className={`banner-tab ${banner===b?'selected':''} ${b}`} aria-pressed={banner===b} disabled={spinning} onClick={()=>{setBanner(b);setShowAll(false);setResults([]);setPieces([]);setRevealed(0);setPhase('idle')}}><ItemIcon icon={b==='golden'?'goldenOrb':'spinOrb'} size={42}/><span><b>{b==='golden'?'GOLDEN':'NORMAL'}</b><small>{b==='golden'?'10 exclusive fighters · 60 gems / orb':`${FAMILIES.length} fighters · Spin Orbs`}</small></span></button>)}
        </div>
        <p className="muted">
          {golden?'Ten exclusive fighters, each with a 10% family chance. Golden Orbs are purchased separately.':'Focus a fighter in the normal pool to raise their chance.'} You can pull up to one star above your best copy. Higher stars are rarer.
        </p>
        <div className={`summon-portal summon-phase-${phase} ${phase === 'charge' ? 'spinning' : ''}`} style={{'--summon-glow':glow} as CSSProperties}>
          <div className="portal-ring outer"/><div className="portal-ring inner"/>
          {Array.from({length:8},(_,i)=><span key={i} className="portal-rune" style={{transform:`rotate(${i*45}deg) translateY(-78px) rotate(${-i*45}deg)`}}>✦</span>)}
          {featured && phase !== 'charge' ? <div key={`${featured.uid}-${phase}`} className={`summon-figure ${phase === 'silhouette' ? 'silhouette' : 'revealed'}`}><Sprite familyId={featured.familyId} star={featured.star} size={160} pose={phase==='silhouette'?'charge':'victory'}/></div> : <div className="portal-center"><ItemIcon icon={golden?'goldenOrb':'spinOrb'} size={64} /></div>}
          <span className="portal-caption" role="status" aria-live="polite">{phase==='charge'?'OPENING THE SANCTUARY…':phase==='silhouette'?'A PRESENCE EMERGES…':featured?`${phase==='complete'?'SUMMON COMPLETE':unitName(featured)} · ${revealed}/${results.length}`:'AWAKEN YOUR LEGEND'}</span>
        </div>
        {spinning && <div className="reveal-controls"><button className="btn small" onClick={finishReveal}>{results.length>1?'Reveal all':'Skip animation'}</button><span className="muted">{revealed} of {results.length} revealed</span></div>}
        <div className="spin-count"><ItemIcon icon={golden?'goldenOrb':'spinOrb'} size={32}/> {golden?`${balance} Golden Orbs`:orbs(balance)}</div>
        {!golden && <p className="muted small-text pity-counter">Pity: {save.pityPulls ?? 0}/{PITY_THRESHOLD} — guaranteed 4★+ at {PITY_THRESHOLD} pulls</p>}
        <div className="button-row">
          <button className="btn primary big" disabled={spinning || balance < 1} onClick={() => pull(1)}>
            Summon ×1
          </button>
          <button className="btn big" disabled={spinning || balance < 10} onClick={() => pull(10)}>
            Summon ×10
          </button>
        </div>
        <p className="muted small-text">
          {golden ? 'Golden summons use only the exclusive pool. Each pull has the same odds; ×10 has no extra guarantee or legendary-piece drop.' : <>Every normal pull has a 0.5% bonus legendary-piece chance. ×10 upgrades an eligible fighter you owned before the batch when one is available. Today's lucky fighter: <b>{getFamily(luckyFamilyId()).name}</b>.</>}
        </p>
        <div className="buy-spins">
          <span>Buy {golden?'Golden Orbs':'Spin Orbs'}: <b>{golden?<><PixelIcon kind="gem"/> {GOLDEN_ORB_PRICE} gems</>:<><PixelIcon kind="coin"/> {price.toLocaleString()} coins</>}</b> each</span>
          <div className="button-row">{[1,10].map(n=><button key={n} className="btn small" disabled={spinning || (golden?save.gems:save.coins)<n*(golden?GOLDEN_ORB_PRICE:price)} onClick={()=>update(s=>golden?buyGoldenOrbs(s,n):buySpins(s,n))}>Buy {n}{golden?` · ${n*GOLDEN_ORB_PRICE} gems`:''}</button>)}</div>
        </div>
        {!golden&&<p className="muted small-text">Earn normal Spin Orbs from new stages, bosses and daily rewards.</p>}

        {phase==='complete' && pieces.length > 0 && (
          <div className="piece-drops">
            {pieces.map((id, i) => (
              <span key={i} className="piece-drop">
                <ItemIcon icon="piece" size={40} /> Legendary piece: <b>{getFamily(id).name}</b>
              </span>
            ))}
          </div>
        )}
        {revealed > 0 && (
          <div className="pull-results">
            {results.slice(0,revealed).map((u, i) => (
              <FighterCard
                key={u.uid}
                familyId={u.familyId}
                star={u.star}
                level={u.level}
                className="pull-card"
                badge={golden ? 'GOLDEN' : results.length === 10 && i === 9 ? '10TH PULL' : undefined}
                style={{ animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        )}
        </div>
      </section>

      <aside className="panel focus-list">
        <h3>{golden?'Exclusive fighters':'Focus a fighter'}</h3>
        <p className="muted small-text">{golden?'Equal family odds. Focus and daily luck apply only to normal summons.':'Raises their chance. Not guaranteed.'}</p>
        {(showAll?pool:pool.slice(0,10)).map((f) => {
          const focused = save.focusFamilyId === f.id;
          return (
            <button key={f.id} className={`focus-item ${focused ? 'active' : ''}`} disabled={golden} onClick={() => setFocus(f.id)}>
              <Sprite familyId={f.id} star={Math.max(1, summonStarCap(save, f.id) - 1)} size={36} />
              <span className="focus-name">{f.name}</span>
              <span className="focus-meta">
                up to {summonStarCap(save, f.id)}★ · {(chanceOf(f.id) * 100).toFixed(1)}%
              </span>
            </button>
          );
        })}
        <p className="muted small-text">Showing {showAll?pool.length:Math.min(10,pool.length)} of {pool.length} fighters</p>
        {pool.length>10&&<button className="btn small show-all" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)}>{showAll?'Show fewer':`Show all ${pool.length} fighters`}</button>}
      </aside>
    </div>
  );
}
