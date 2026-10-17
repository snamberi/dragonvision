import { boardUrl, dojoUrl, gravityUrl, labUrl, portUrl, shrineUrl, tentUrl, towerUrl } from '../art/buildings';
import { BOUNTIES, bountyProgress } from '../game/bounty';
import { dojoProgress } from '../game/dojo';
import { expeditionDone } from '../game/expedition';
import { fortuneReady } from '../game/fortune';
import { spareUnits } from '../game/fusion';
import type { SaveData } from '../game/types';

export type Building = 'summon' | 'dojo' | 'fusion' | 'gravity' | 'port' | 'bounty' | 'fortune' | 'tower';

interface Props {
  save: SaveData;
  onOpen: (building: Building) => void;
}

export function CityScreen({ save, onOpen }: Props) {
  const now = Date.now();
  const dojoReady = save.dojo.reduce((sum, slot) => sum + dojoProgress(save, slot, now).ready, 0);
  const spares = spareUnits(save).length;
  const tripsBack = save.expeditions.filter((e) => expeditionDone(e, now)).length;
  const bountiesReady = BOUNTIES.filter((b) => {
    const p = bountyProgress(save, b);
    return !p.claimed && p.done >= b.goal;
  }).length;

  const buildings: { id: Building; name: string; art: string; badge?: string }[] = [
    { id: 'summon', name: 'Summoning Shrine', art: shrineUrl(), badge: save.spins > 0 ? `${save.spins} SPINS` : undefined },
    { id: 'fortune', name: 'Fortune Teller', art: tentUrl(), badge: fortuneReady(save) ? 'FREE' : undefined },
    { id: 'dojo', name: 'Training Dojo', art: dojoUrl(), badge: dojoReady > 0 ? `+${dojoReady} LV` : undefined },
    { id: 'fusion', name: 'Fusion Lab', art: labUrl(), badge: spares > 0 ? `${spares} SPARE` : undefined },
    { id: 'gravity', name: 'Gravity Chamber', art: gravityUrl() },
    { id: 'port', name: 'Expedition Port', art: portUrl(), badge: tripsBack > 0 ? `${tripsBack} BACK` : undefined },
    { id: 'bounty', name: 'Bounty Board', art: boardUrl(), badge: bountiesReady > 0 ? `${bountiesReady} DONE` : undefined },
    { id: 'tower', name: 'Rival Tower', art: towerUrl(), badge: save.towerFloor > 0 ? `${save.towerFloor}F` : undefined },
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
      </div>
    </div>
  );
}
