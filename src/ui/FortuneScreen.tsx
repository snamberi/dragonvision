import { ActivityScene } from './ActivityScene';
import { useActionFeedback } from './useActionFeedback';
import { useEffect, useRef, useState } from 'react';
import { LUCKY_MULTIPLIER } from '../game/balance';
import { claimFortune, fortuneReady } from '../game/fortune';
import { getFamily } from '../game/roster';
import { luckyFamilyId } from '../game/summon';
import type { SaveData, Unit } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader, districtStyle } from './BuildingHeader';
import { FighterCard } from './FighterCard';
import { Sprite } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function FortuneScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const [pulled, setPulled] = useState<Unit | null>(null);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rolling = useRef(false);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const lucky = getFamily(luckyFamilyId());
  const ready = fortuneReady(save);

  const claim = () => {
    if (rolling.current) return;
    let unit: Unit | null = null;
    const success = update((s) => {
      const r = claimFortune(s);
      unit = r.unit;
      return r.save;
    });
    if (!success) return;
    rolling.current = true;
    setSpinning(true);
    timer.current = setTimeout(() => {setPulled(unit); setSpinning(false); rolling.current = false;}, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1500);
  };

  return (
    <div className="fortune area-polished bld bld-market" style={districtStyle("Fortune Teller")}>{feedback}
      <BuildingHeader title="Fortune Teller" onBack={onBack}>
        <p className="muted">One free summon every day, and a lucky fighter who is {LUCKY_MULTIPLIER}× as likely to appear in every summon today.</p>
      </BuildingHeader>
      <ActivityScene kind="fortune" status={spinning ? 'Reading the constellation…' : ready ? 'Your free daily summon is ready' : 'Daily fortune claimed · return tomorrow'} active={spinning}/>
      <section className="panel fortune-lucky">
        <div className={`crystal ${spinning ? 'fortune-spinning' : ''}`}>
          <Sprite familyId={lucky.id} star={1} size={96} className="idle" />
        </div>
        <div>
          <div className="eyebrow">Today's lucky fighter</div>
          <h3>{lucky.name}</h3>
          <p className="muted">{lucky.title}. Changes at midnight.</p>
        </div>
      </section>
      <section className="panel fortune-free">
        <button className="btn primary big" disabled={!ready || spinning} onClick={claim}>
          {spinning ? 'Reading your fortune…' : ready ? 'Free daily summon' : 'Come back tomorrow'}
        </button>
        {pulled && (
          <div className="pull-results">
            <FighterCard familyId={pulled.familyId} star={pulled.star} level={pulled.level} className="pull-card" />
          </div>
        )}
      </section>
    </div>
  );
}
