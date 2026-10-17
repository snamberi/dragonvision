import { lotUrl, shrineUrl } from '../art/buildings';
import type { SaveData } from '../game/types';

interface Props {
  save: SaveData;
  onOpenSummon: () => void;
}

// Empty lots mark where future City buildings will go.
const LOTS = 3;

export function CityScreen({ save, onOpenSummon }: Props) {
  return (
    <div className="city">
      <section className="panel">
        <div className="eyebrow">Vision City</div>
        <h2>City</h2>
        <p className="muted">Tap a building to go inside.</p>
      </section>

      <div className="city-map">
        <button className={`building ${save.spins > 0 ? 'ready' : ''}`} onClick={onOpenSummon}>
          <img className="building-art" src={shrineUrl()} alt="" draggable={false} />
          <span className="building-name">Summoning Shrine</span>
          {save.spins > 0 && <span className="badge">{save.spins} SPINS</span>}
        </button>
        {Array.from({ length: LOTS }, (_, i) => (
          <div key={i} className="building lot" aria-label="Empty lot">
            <img className="building-art small" src={lotUrl()} alt="" draggable={false} />
            <span className="building-name">Coming soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}
