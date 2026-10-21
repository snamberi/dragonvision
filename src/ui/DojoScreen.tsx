import { ActivityScene } from './ActivityScene';
import { useActionFeedback } from './useActionFeedback';
import { BuildingHeader } from './BuildingHeader';
import { useEffect, useState } from 'react';
import { DOJO_MINUTES_PER_LEVEL, DOJO_SLOTS, levelCap } from '../game/balance';
import { collectTraining, dojoProgress, startTraining, stopTraining } from '../game/dojo';
import { findUnit, isTraining, power, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { Portrait, Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function DojoScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const [now, setNow] = useState(Date.now);
  // Tick so progress bars move while the screen is open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const idle = save.units
    .filter((u) => !save.team.includes(u.uid) && !isTraining(save, u.uid) && u.level < levelCap(u.star))
    .sort((a, b) => power(b.familyId, b.star, b.level) - power(a.familyId, a.star, a.level));
  const full = save.dojo.length >= DOJO_SLOTS;

  return (
    <div className="dojo area-polished">{feedback}
      <BuildingHeader title="Training Dojo" onBack={onBack}>
        <p className="muted">
          Idle fighters train here and gain 1 level every {DOJO_MINUTES_PER_LEVEL} minutes, even while you're away, up to their
          level wall. Trained levels are free and stay through gem resets.
        </p>
      </BuildingHeader>
      <ActivityScene kind="dojo" status={`${save.dojo.length} of ${DOJO_SLOTS} training mats occupied`} active={save.dojo.length > 0}/>

      <div className="dojo-slots">
        {Array.from({ length: DOJO_SLOTS }, (_, i) => save.dojo[i]).map((slot, i) => {
          if (!slot) {
            return (
              <div key={`empty-${i}`} className="panel dojo-slot empty">
                <span className="arena-ghost" aria-hidden="true" />
                <span className="muted">Empty mat</span>
              </div>
            );
          }
          const unit = findUnit(save, slot.uid);
          const p = dojoProgress(save, slot, now);
          return (
            <div key={slot.uid} className="panel dojo-slot">
              <Sprite familyId={unit.familyId} star={unit.star} size={104} pose="punch" animated className="train" />
              <div className="dojo-name">
                {unitName(unit)} <Stars star={unit.star} />
              </div>
              <div className="muted">
                Lv {unit.level}
                {p.ready > 0 && <b className="dojo-ready"> +{p.ready}</b>} / cap {levelCap(unit.star)}
              </div>
              <span className="bar xp">
                <i style={{ width: `${p.partial * 100}%` }} />
              </span>
              <div className="muted small-text">{p.capped ? 'At the level wall. Evolve to keep training.' : 'Training…'}</div>
              <div className="button-row">
                <button className="btn small primary" disabled={p.ready === 0} onClick={() => update((s) => collectTraining(s, slot.uid, Date.now()), 'Training levels collected')}>
                  Collect
                </button>
                <button className="btn small" onClick={() => update((s) => stopTraining(s, slot.uid, Date.now()), 'Fighter returned from the Dojo')}>
                  Leave Dojo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <section className="panel">
        <h3>Idle fighters</h3>
        {idle.length === 0 ? (
          <p className="muted">No idle fighters below their level wall. Fighters on your team can't train.</p>
        ) : (
          <div className="idle-list">
            {idle.map((u) => (
              <div key={u.uid} className="idle-row">
                <Portrait familyId={u.familyId} star={u.star} size={36} />
                <span className="idle-name">
                  {unitName(u)} <Stars star={u.star} />
                  <small className="muted">
                    Lv {u.level}/{levelCap(u.star)}
                  </small>
                </span>
                <button className="btn small" disabled={full} onClick={() => update((s) => startTraining(s, u.uid, Date.now()), 'Training started')}>
                  Train
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
