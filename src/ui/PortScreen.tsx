import { useEffect, useState } from 'react';
import { EXPEDITION_HOURS, EXPEDITION_MAX_PARTY, EXPEDITION_SLOTS } from '../game/balance';
import { claimExpedition, expeditionDone, recallExpedition, startExpedition, timeLeft } from '../game/expedition';
import { findUnit, isBusy, power, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { Portrait, Stars } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

function formatTime(ms: number): string {
  const m = Math.ceil(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export function PortScreen({ save, update, onBack }: Props) {
  const [now, setNow] = useState(Date.now);
  const [party, setParty] = useState<string[]>([]);
  const [hours, setHours] = useState<number>(4);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const idle = save.units
    .filter((u) => !save.team.includes(u.uid) && !isBusy(save, u.uid))
    .sort((a, b) => power(b.familyId, b.star, b.level) - power(a.familyId, a.star, a.level));
  const full = save.expeditions.length >= EXPEDITION_SLOTS;

  const toggle = (uid: string) =>
    setParty((p) => (p.includes(uid) ? p.filter((x) => x !== uid) : p.length < EXPEDITION_MAX_PARTY ? [...p, uid] : p));

  const send = () => {
    if (update((s) => startExpedition(s, party, hours, Date.now()))) setParty([]);
  };

  return (
    <div className="port">
      <BuildingHeader title="Expedition Port" onBack={onBack}>
        <p className="muted">
          Send up to {EXPEDITION_MAX_PARTY} idle fighters on a trip. They come back with coins, plus spins on longer trips and a
          chance of gems. Bigger parties bring back more. {EXPEDITION_SLOTS} trips can be out at once.
        </p>
      </BuildingHeader>

      <div className="trip-list">
        {save.expeditions.length === 0 && <p className="muted">No trips out right now.</p>}
        {save.expeditions.map((e) => {
          const done = expeditionDone(e, now);
          return (
            <section key={e.id} className={`panel trip ${done ? 'done' : ''}`}>
              <div className="trip-party">
                {e.uids.map((uid) => {
                  const u = findUnit(save, uid);
                  return <Portrait key={uid} familyId={u.familyId} star={u.star} size={36} />;
                })}
              </div>
              <div className="trip-info">
                <b>{e.hours}h trip</b>
                <span className="muted">{done ? 'Back home!' : `Back in ${formatTime(timeLeft(e, now))}`}</span>
                <span className="trip-reward">
                  ● {e.reward.coins.toLocaleString()}
                  {e.reward.spins > 0 && ` · ✦ ${e.reward.spins}`}
                  {e.reward.gems > 0 && ` · ◆ ${e.reward.gems}`}
                </span>
              </div>
              {done ? (
                <button className="btn small primary" onClick={() => update((s) => claimExpedition(s, e.id, Date.now()))}>
                  Collect
                </button>
              ) : (
                <button className="btn small" onClick={() => update((s) => recallExpedition(s, e.id))}>
                  Recall (no reward)
                </button>
              )}
            </section>
          );
        })}
      </div>

      <section className="panel">
        <h3>Plan a trip</h3>
        <div className="button-row">
          {EXPEDITION_HOURS.map((h) => (
            <button key={h} className={`btn small ${hours === h ? 'primary' : ''}`} onClick={() => setHours(h)}>
              {h} hour{h === 1 ? '' : 's'}
            </button>
          ))}
          <button className="btn small primary" disabled={party.length === 0 || full} onClick={send}>
            Send {party.length}/{EXPEDITION_MAX_PARTY}
          </button>
        </div>
        {full && <p className="muted small-text">Both docks are busy. Collect a trip first.</p>}
        <div className="spare-grid trip-pick">
          {idle.length === 0 && <p className="muted">No idle fighters. Team, Dojo and traveling fighters can't go.</p>}
          {idle.map((u) => (
            <button key={u.uid} className={`spare ${party.includes(u.uid) ? 'picked' : ''}`} onClick={() => toggle(u.uid)}>
              <Portrait familyId={u.familyId} star={u.star} size={36} />
              <span className="spare-name">{unitName(u)}</span>
              <span className="muted">
                Lv {u.level} <Stars star={u.star} />
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
