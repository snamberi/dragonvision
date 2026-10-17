import { TOTAL_STAGES } from '../game/balance';
import { LOGIN_TRACK, claimLogin, loginIndex, loginReady } from '../game/login';
import type { SaveData } from '../game/types';
import type { Tab, Updater } from './App';
import { SettingsPanel } from './SettingsPanel';
import { TeamArena } from './TeamArena';

interface Props {
  save: SaveData;
  update: Updater;
  onNavigate: (tab: Tab) => void;
  onOpenSummon: () => void;
}

export function HomeScreen({ save, update, onNavigate, onOpenSummon }: Props) {
  const next = Math.min(TOTAL_STAGES, save.clearedStage + 1);
  return (
    <div className="home">
      <TeamArena save={save} title="Ready to fight" />
      <section className="panel">
        <div className="eyebrow">Welcome back, {save.title ?? 'fighter'}</div>
        <h2>Home</h2>
        <div className="button-row home-actions">
          <button className="btn primary big" onClick={() => onNavigate('stages')}>
            Next: Stage {next}
          </button>
          {save.spins > 0 && (
            <button className="btn big" onClick={onOpenSummon}>
              {save.spins} spin{save.spins === 1 ? '' : 's'} ready
            </button>
          )}
        </div>
      </section>
      <LoginCalendar save={save} update={update} />
      <SettingsPanel save={save} update={update} />
    </div>
  );
}

/** Seven-day login track; one claim per day, and missing a day never resets it. */
function LoginCalendar({ save, update }: { save: SaveData; update: Updater }) {
  const ready = loginReady(save);
  const today = loginIndex(save);
  return (
    <section className="panel">
      <div className="section-head">
        <h3>Daily login</h3>
        <button className="btn small primary" disabled={!ready} onClick={() => update((s) => claimLogin(s))}>
          {ready ? `Claim day ${today + 1}` : 'Come back tomorrow'}
        </button>
      </div>
      <div className="login-track">
        {LOGIN_TRACK.map((r, i) => {
          const state = i < today ? 'done' : i === today && ready ? 'next' : '';
          return (
            <div key={r.label} className={`login-day ${state} ${i === 6 ? 'big' : ''}`}>
              <b>Day {i + 1}</b>
              <span>{r.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
