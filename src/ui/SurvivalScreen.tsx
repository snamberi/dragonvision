import { survivalCoins } from '../game/survival';
import type { SaveData } from '../game/types';
import { BuildingHeader } from './BuildingHeader';

export function SurvivalScreen({ save, onBack, onStart }: { save: SaveData; onBack: () => void; onStart: () => void }) {
  return (
    <div className="survival">
      <BuildingHeader title="Survival Gate" onBack={onBack}>
        <p className="muted">
          Endless waves of enemies, each stronger than the last. Your fighters keep their HP, Ki and special bars between waves:
          there is no healing. Every 5th wave has a mini-boss. When your team falls, you are paid for every wave cleared, plus a
          spin every 5 waves.
        </p>
      </BuildingHeader>
      <section className="panel survival-panel">
        <div className="gravity-level">
          Best: wave {save.survivalBest}
        </div>
        <p className="muted">Clearing 10 waves pays about ● {survivalCoins(10).toLocaleString()} and 2 spins.</p>
        <button className="btn primary big" onClick={onStart}>
          Enter the Gate
        </button>
      </section>
    </div>
  );
}
