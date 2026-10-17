import { useState } from 'react';
import { LOGIN_TRACK, claimLogin, loginIndex, loginReady } from '../game/login';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { Modal } from './Modal';

/** The 7-day login reward, shown when today's reward is waiting. Missing a day never resets it. */
export function LoginPopup({ save, update, onClose }: { save: SaveData; update: Updater; onClose: () => void }) {
  const [claimed, setClaimed] = useState<string | null>(null);
  const ready = loginReady(save);
  // After claiming, the track has moved on, so point at the day just claimed.
  const today = claimed ? (loginIndex(save) + LOGIN_TRACK.length - 1) % LOGIN_TRACK.length : loginIndex(save);
  const claim = () => {
    const reward = LOGIN_TRACK[loginIndex(save)].label;
    if (update((s) => claimLogin(s))) setClaimed(reward);
  };
  return (
    <Modal title="Daily login" onClose={onClose} className="login-popup">
      <p className="muted small-text">One reward a day. Missing a day never resets the track.</p>
      <div className="login-track">
        {LOGIN_TRACK.map((r, i) => {
          const done = i < today || (claimed !== null && i === today);
          const state = done ? 'done' : i === today && ready ? 'next' : '';
          return (
            <div key={r.label} className={`login-day ${state} ${i === 6 ? 'big' : ''}`}>
              <b>Day {i + 1}</b>
              <span>{r.label}</span>
            </div>
          );
        })}
      </div>
      <div className="button-row login-actions">
        {claimed ? (
          <>
            <span className="login-got">You got: {claimed}</span>
            <button className="btn primary" onClick={onClose}>
              Nice!
            </button>
          </>
        ) : ready ? (
          <button className="btn primary big" onClick={claim}>
            Claim day {today + 1}
          </button>
        ) : (
          <button className="btn" onClick={onClose}>
            Come back tomorrow
          </button>
        )}
      </div>
    </Modal>
  );
}
