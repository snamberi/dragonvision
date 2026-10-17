import { dojoUrl, labUrl, lotUrl, shrineUrl } from '../art/buildings';
import { dojoProgress } from '../game/dojo';
import { spareUnits } from '../game/fusion';
import type { SaveData } from '../game/types';

export type Building = 'summon' | 'dojo' | 'fusion';

interface Props {
  save: SaveData;
  onOpen: (building: Building) => void;
}

export function CityScreen({ save, onOpen }: Props) {
  const now = Date.now();
  const dojoReady = save.dojo.reduce((sum, slot) => sum + dojoProgress(save, slot, now).ready, 0);
  const spares = spareUnits(save).length;

  const buildings: { id: Building; name: string; art: string; badge?: string }[] = [
    { id: 'summon', name: 'Summoning Shrine', art: shrineUrl(), badge: save.spins > 0 ? `${save.spins} SPINS` : undefined },
    { id: 'dojo', name: 'Training Dojo', art: dojoUrl(), badge: dojoReady > 0 ? `+${dojoReady} LV` : undefined },
    { id: 'fusion', name: 'Fusion Lab', art: labUrl(), badge: spares > 0 ? `${spares} SPARE` : undefined },
  ];

  return (
    <div className="city">
      <section className="panel">
        <div className="eyebrow">Vision City</div>
        <h2>City</h2>
        <p className="muted">Tap a building to go inside.</p>
      </section>

      <div className="city-map">
        {buildings.map((b) => (
          <button key={b.id} className={`building ${b.badge ? 'ready' : ''}`} onClick={() => onOpen(b.id)}>
            <img className="building-art" src={b.art} alt="" draggable={false} />
            <span className="building-name">{b.name}</span>
            {b.badge && <span className="badge">{b.badge}</span>}
          </button>
        ))}
        <div className="building lot" aria-label="Empty lot">
          <img className="building-art small" src={lotUrl()} alt="" draggable={false} />
          <span className="building-name">Coming soon</span>
        </div>
      </div>
    </div>
  );
}
