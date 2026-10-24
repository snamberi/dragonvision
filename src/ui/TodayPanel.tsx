import { useState } from 'react';
import { type CollectResult, type PendingKey, collectAll, dailyChecklist } from '../game/collect';
import type { SaveData } from '../game/types';
import type { Updater } from './App';

interface Props {
  save: SaveData;
  update: Updater;
  onGo: (target: PendingKey) => void;
  toast?: (message: string) => void;
}

/** Today's to-do list on Home, with a one-tap Collect all. */
export function TodayPanel({ save, update, onGo, toast }: Props) {
  const [showDone, setShowDone] = useState(false);
  const rows = dailyChecklist(save);
  const open = rows.filter((r) => !r.done);
  const shown = showDone ? rows : open;
  const anyClaimable = rows.some((r) => r.claimable && r.target !== 'login' && r.target !== 'fortune');

  const collect = () => {
    let result: CollectResult | null = null;
    update((s) => {
      result = collectAll(s);
      return result.save;
    });
    const r = result as CollectResult | null;
    if (!r || r.claims === 0) toast?.('Nothing to collect right now.');
    else toast?.(`Collected ${r.claims} reward${r.claims === 1 ? '' : 's'}: ${r.gained.join(', ') || 'done'}`);
  };

  return (
    <section className="today-panel" aria-label="Today">
      <header>
        <div>
          <span className="home-eyebrow">TODAY</span>
          <h3>{open.length ? `${open.length} thing${open.length === 1 ? '' : 's'} left to do` : 'All done for today'}</h3>
        </div>
        <button className="btn primary small" disabled={!anyClaimable} onClick={collect}>
          Collect all
        </button>
      </header>
      <ul>
        {shown.map((r) => (
          <li key={r.id} className={`${r.done ? 'done' : ''} ${r.claimable ? 'claimable' : ''}`}>
            <button onClick={() => onGo(r.target)}>
              <span className="today-check" aria-hidden="true">{r.done ? '✓' : r.claimable ? '!' : '•'}</span>
              <span className="today-label">{r.label}</span>
              <span className="today-detail">{r.detail}</span>
              <b aria-hidden="true">→</b>
            </button>
          </li>
        ))}
      </ul>
      {rows.length > open.length && (
        <button className="btn ghost small today-toggle" onClick={() => setShowDone(!showDone)}>
          {showDone ? 'Hide finished' : `Show finished (${rows.length - open.length})`}
        </button>
      )}
    </section>
  );
}
