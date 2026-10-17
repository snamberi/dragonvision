import { TOTAL_STAGES } from '../game/balance';
import { teamUnits, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Tab } from './App';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  onNavigate: (tab: Tab) => void;
  onOpenSummon: () => void;
}

// Placeholder hub; its real features are still being designed.
export function HomeScreen({ save, onNavigate, onOpenSummon }: Props) {
  const next = Math.min(TOTAL_STAGES, save.clearedStage + 1);
  return (
    <div className="home">
      <section className="panel">
        <div className="eyebrow">Welcome back, fighter</div>
        <h2>Home</h2>
        <div className="team-row">
          {teamUnits(save).map((u) => (
            <div key={u.uid} className="team-slot filled">
              <Sprite familyId={u.familyId} star={u.star} size={56} className="idle" />
              <span>{unitName(u)}</span>
              <small>
                Lv {u.level} <Stars star={u.star} />
              </small>
            </div>
          ))}
        </div>
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
      <section className="panel coming-soon">
        <h3>More coming soon</h3>
        <p className="muted">New Home features are on the way.</p>
      </section>
    </div>
  );
}
