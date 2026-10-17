import { useState } from 'react';
import { LUCKY_MULTIPLIER } from '../game/balance';
import { claimFortune, fortuneReady } from '../game/fortune';
import { getFamily } from '../game/roster';
import { luckyFamilyId } from '../game/summon';
import type { SaveData, Unit } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { FighterCard } from './FighterCard';
import { Sprite } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function FortuneScreen({ save, update, onBack }: Props) {
  const [pulled, setPulled] = useState<Unit | null>(null);
  const lucky = getFamily(luckyFamilyId());
  const ready = fortuneReady(save);

  const claim = () => {
    let unit: Unit | null = null;
    update((s) => {
      const r = claimFortune(s);
      unit = r.unit;
      return r.save;
    });
    setPulled(unit);
  };

  return (
    <div className="fortune">
      <BuildingHeader title="Fortune Teller" onBack={onBack}>
        <p className="muted">One free summon every day, and a lucky fighter who is {LUCKY_MULTIPLIER}× as likely to appear in every summon today.</p>
      </BuildingHeader>
      <section className="panel fortune-lucky">
        <div className="crystal">
          <Sprite familyId={lucky.id} star={1} size={96} className="idle" />
        </div>
        <div>
          <div className="eyebrow">Today's lucky fighter</div>
          <h3>{lucky.name}</h3>
          <p className="muted">{lucky.title}. Changes at midnight.</p>
        </div>
      </section>
      <section className="panel fortune-free">
        <button className="btn primary big" disabled={!ready} onClick={claim}>
          {ready ? 'Free daily summon' : 'Come back tomorrow'}
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
