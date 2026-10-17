import { useState } from 'react';
import { SHARD_FUSION_COST } from '../game/balance';
import { fuseShard, sellPrice, sellSpares, spareUnits } from '../game/fusion';
import { unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { Portrait, Stars } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function FusionScreen({ save, update, onBack }: Props) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const spares = spareUnits(save);
  const chosen = spares.filter((s) => picked.has(s.unit.uid)).map((s) => s.unit);
  const stars = [...new Set(chosen.map((u) => u.star))];
  const canFuse = chosen.length === SHARD_FUSION_COST && stars.length === 1;
  const byStar = new Map<number, typeof spares>();
  for (const s of spares) byStar.set(s.unit.star, [...(byStar.get(s.unit.star) ?? []), s]);
  const shardStars = Object.entries(save.shards).filter(([, n]) => n > 0);

  const toggle = (uid: string) =>
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const pickObsolete = () => setPicked(new Set(spares.filter((s) => !s.usefulForEvolving).map((s) => s.unit.uid)));

  const run = (change: (s: SaveData) => SaveData) => {
    if (update(change)) setPicked(new Set());
  };

  return (
    <div className="fusion">
      <button className="btn ghost" onClick={onBack}>
        ← City
      </button>
      <section className="panel">
        <div className="eyebrow">Vision City</div>
        <h2>Fusion Lab</h2>
        <p className="muted">
          Turn spare copies into something useful. Fuse {SHARD_FUSION_COST} copies of the same star into an <b>evolution shard</b>,
          which counts as one duplicate when evolving any fighter of that star. Or sell copies for coins. Your team, Dojo fighters
          and each character's best copy are never offered.
        </p>
        <div className="shard-row">
          <span>Shards:</span>
          {shardStars.length === 0 ? (
            <span className="muted">none yet</span>
          ) : (
            shardStars.map(([star, n]) => (
              <span key={star} className="shard-chip">
                ◇ {star}★ × {n}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="panel fusion-actions">
        <span>
          {chosen.length} picked{chosen.length > 0 && ` · sells for ● ${sellPrice(chosen).toLocaleString()}`}
        </span>
        <div className="button-row">
          <button className="btn small" onClick={pickObsolete} disabled={spares.length === 0}>
            Pick outdated copies
          </button>
          <button className="btn small" onClick={() => setPicked(new Set())} disabled={chosen.length === 0}>
            Clear
          </button>
          <button className="btn small primary" disabled={!canFuse} onClick={() => run((s) => fuseShard(s, [...picked]))}>
            Fuse into {stars.length === 1 ? `${stars[0]}★ ` : ''}shard
          </button>
          <button className="btn small" disabled={chosen.length === 0} onClick={() => run((s) => sellSpares(s, [...picked]))}>
            Sell
          </button>
        </div>
      </section>

      {spares.length === 0 && <p className="muted">No spare copies right now.</p>}
      {[...byStar.entries()].map(([star, group]) => (
        <section key={star} className="panel">
          <h3>
            {star}★ spares ({group.length})
          </h3>
          <div className="spare-grid">
            {group.map(({ unit, usefulForEvolving }) => (
              <button
                key={unit.uid}
                className={`spare ${picked.has(unit.uid) ? 'picked' : ''}`}
                onClick={() => toggle(unit.uid)}
                aria-pressed={picked.has(unit.uid)}
              >
                <Portrait familyId={unit.familyId} star={unit.star} size={36} />
                <span className="spare-name">{unitName(unit)}</span>
                <span className="muted">
                  Lv {unit.level} <Stars star={unit.star} />
                </span>
                {usefulForEvolving && <span className="spare-tag">Evolve copy</span>}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
