import { useActionFeedback } from './useActionFeedback';
import { useEffect, useState } from 'react';
import { EXPEDITION_HOURS, EXPEDITION_MAX_PARTY, EXPEDITION_SLOTS } from '../game/balance';
import { claimExpedition, expeditionDone, recallExpedition, startExpedition, timeLeft } from '../game/expedition';
import { findUnit, isBusy, power, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { portUrl } from '../art/buildings';
import { QPanel, QuarterScene } from './QuarterScene';
import { Portrait, Stars } from './Sprite';
import { orbs } from './format';

const MS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const POLL_MS = 15_000;
const DEFAULT_HOURS = 4;
const PROGRESS_MAX = 100;
const MS_PER_HOUR = 3_600_000;

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

function formatTime(ms: number): string {
  const m = Math.ceil(ms / MS_PER_MINUTE);
  return m >= MINUTES_PER_HOUR ? `${Math.floor(m / MINUTES_PER_HOUR)}h ${m % MINUTES_PER_HOUR}m` : `${m}m`;
}

export function PortScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const [now, setNow] = useState(Date.now);
  const [party, setParty] = useState<string[]>([]);
  const [hours, setHours] = useState<number>(DEFAULT_HOURS);
  const [path, setPath] = useState<'safe' | 'risky'>('safe');
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), POLL_MS);
    return () => clearInterval(id);
  }, []);

  const idle = save.units
    .filter((u) => !save.team.includes(u.uid) && !isBusy(save, u.uid))
    .sort((a, b) => power(b.familyId, b.star, b.level) - power(a.familyId, a.star, a.level));
  const full = save.expeditions.length >= EXPEDITION_SLOTS;

  const toggle = (uid: string) => setParty((p) => {
    if (p.includes(uid)) return p.filter((x) => x !== uid);
    if (p.length < EXPEDITION_MAX_PARTY) return [...p, uid];
    return p;
  });

  const send = () => {
    if (update((s) => startExpedition(s, party, hours, Date.now(), undefined, path), 'Expedition departed')) { setParty([]); setNow(Date.now()); }
  };

  return (
    <div className="port qscreen">{feedback}
      <QuarterScene
        quarter="harbor"
        title="Expedition Port"
        art={portUrl()}
        onBack={onBack}
        line={`Send up to ${EXPEDITION_MAX_PARTY} idle fighters on a trip for coins, Spin Orbs on longer trips and a chance of gems. Bigger parties bring back more.`}
        status={{ label: 'Docks', value: `${save.expeditions.length} / ${EXPEDITION_SLOTS} at sea` }}
      />

      <QPanel eyebrow="AT SEA" title="Voyages" aside={<span className="qtag">{save.expeditions.length}/{EXPEDITION_SLOTS}</span>}>
      <div className="trip-list">
        {save.expeditions.length === 0 && <p>No trips out right now. Plan one below.</p>}
        {save.expeditions.map((e) => {
          const done = expeditionDone(e, now);
          const elapsed = e.hours * MS_PER_HOUR - timeLeft(e, now);
          const progress = Math.min(PROGRESS_MAX, Math.max(0, PROGRESS_MAX * (elapsed / (e.hours * MS_PER_HOUR))));
          return (
            <section key={e.id} className={`trip ${done ? 'done' : ''} ${e.path === 'risky' ? 'risky' : ''}`}>
              <div className="trip-party">
                {e.uids.map((uid) => {
                  const u = findUnit(save, uid);
                  return <Portrait key={uid} familyId={u.familyId} star={u.star} size={36} />;
                })}
              </div>
              <div className="trip-info">
                <div className="voyage-track" aria-label={done ? 'Expedition complete' : 'Expedition in progress'}><i style={{left:`${progress}%`}}>◆</i></div>
                <b>{e.hours}h trip{e.path === 'risky' ? ' · ⚡ Risky' : ''}</b>
                <span className="muted">{done ? 'Back home!' : `Back in ${formatTime(timeLeft(e, now))}`}</span>
                <span className="trip-reward">
                  ● {e.reward.coins.toLocaleString()}
                  {e.reward.spins > 0 && ` · ${orbs(e.reward.spins)}`}
                  {e.reward.gems > 0 && ` · ◆ ${e.reward.gems}`}
                </span>
              </div>
              {done ? (
                <button className="btn small primary" onClick={() => update((s) => claimExpedition(s, e.id, Date.now()), 'Expedition rewards collected')}>
                  Collect
                </button>
              ) : (
                <button className="btn small" onClick={() => update((s) => recallExpedition(s, e.id), 'Party recalled · no reward')}>
                  Recall (no reward)
                </button>
              )}
            </section>
          );
        })}
      </div>
      </QPanel>

      <QPanel eyebrow="THE HARBORMASTER" title="Plan a trip" aside={<span className="qtag">{party.length}/{EXPEDITION_MAX_PARTY} PICKED</span>}>
        <div className="qchoices">
          <button className={`btn small ${path === 'safe' ? 'primary' : ''}`} onClick={() => setPath('safe')}>⚓ Safe</button>
          <button className={`btn small ${path === 'risky' ? 'risky-btn' : ''}`} onClick={() => setPath('risky')}>⚡ Risky (+50% coins, 20% fail)</button>
        </div>
        {path === 'risky' && <p className="warn-text">Risky path: coins ×1.5, but 20% chance of coming home empty-handed.</p>}
        <div className="qchoices">
          {EXPEDITION_HOURS.map((h) => (
            <button key={h} className={`btn small ${hours === h ? 'primary' : ''}`} onClick={() => setHours(h)}>
              {h} hour{h === 1 ? '' : 's'}
            </button>
          ))}
          <button className="btn small primary" disabled={party.length === 0 || full} onClick={send}>
            Send {party.length}/{EXPEDITION_MAX_PARTY}
          </button>
        </div>
        {full && <p>Both docks are busy. Collect a trip first.</p>}
        <div className="spare-grid trip-pick">
          {idle.length === 0 && <p>No idle fighters. Team, Dojo and traveling fighters can't go.</p>}
          {idle.map((u) => (
            <button key={u.uid} className={`spare ${party.includes(u.uid) ? 'picked' : ''}`} onClick={() => toggle(u.uid)} aria-pressed={party.includes(u.uid)}>
              <Portrait familyId={u.familyId} star={u.star} size={36} />
              <span className="spare-name">{unitName(u)}</span>
              <span className="muted">
                Lv {u.level} <Stars star={u.star} />
              </span>
            </button>
          ))}
        </div>
      </QPanel>
    </div>
  );
}
