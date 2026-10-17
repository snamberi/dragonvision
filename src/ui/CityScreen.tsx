import { WorldScene } from './WorldScene';
import { armoryUrl, boardUrl, colosseumUrl, dojoUrl, gateUrl, hallUrl, gravityUrl, labUrl, portUrl, shrineUrl, tentUrl, towerUrl } from '../art/buildings';
import { ACHIEVEMENTS, achievementState } from '../game/achievements';
import { BOUNTIES, bountyProgress } from '../game/bounty';
import { attemptsLeft, bossProgress } from '../game/worldBoss';
import { dojoProgress } from '../game/dojo';
import { expeditionDone } from '../game/expedition';
import { fortuneReady } from '../game/fortune';
import { spareUnits } from '../game/fusion';
import type { SaveData } from '../game/types';

export type Building = 'summon' | 'dojo' | 'fusion' | 'gravity' | 'port' | 'bounty' | 'fortune' | 'tower' | 'armory' | 'colosseum' | 'gate' | 'hall';

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

  const achievementsReady = ACHIEVEMENTS.filter((a) => {
    const st = achievementState(save, a);
    return st.complete && !st.claimed;
  }).length;

  const buildings: { id: Building; name: string; art: string; badge?: string }[] = [
    { id: 'summon', name: 'Summoning Shrine', art: shrineUrl(), badge: save.spins > 0 ? `${save.spins} SPINS` : undefined },
    { id: 'fortune', name: 'Fortune Teller', art: tentUrl(), badge: fortuneReady(save) ? 'FREE' : undefined },
    { id: 'dojo', name: 'Training Dojo', art: dojoUrl(), badge: dojoReady > 0 ? `+${dojoReady} LV` : undefined },
    { id: 'fusion', name: 'Fusion Lab', art: labUrl(), badge: spares > 0 ? `${spares} SPARE` : undefined },
    { id: 'gravity', name: 'Gravity Chamber', art: gravityUrl() },
    { id: 'port', name: 'Expedition Port', art: portUrl(), badge: tripsBack > 0 ? `${tripsBack} BACK` : undefined },
    { id: 'bounty', name: 'Bounty Board', art: boardUrl(), badge: bountiesReady > 0 ? `${bountiesReady} DONE` : undefined },
    { id: 'armory', name: 'Armory', art: armoryUrl() },
    { id: 'colosseum', name: 'Colosseum', art: colosseumUrl(), badge: attemptsLeft(save) > 0 && bossProgress(save) < 1 ? 'BOSS' : undefined },
    { id: 'gate', name: 'Survival Gate', art: gateUrl(), badge: save.survivalBest > 0 ? `BEST ${save.survivalBest}` : undefined },
    { id: 'hall', name: 'Hall of Legends', art: hallUrl(), badge: achievementsReady > 0 ? `${achievementsReady} NEW` : undefined },
    { id: 'tower', name: 'Rival Tower', art: towerUrl(), badge: save.towerFloor > 0 ? `${save.towerFloor}F` : undefined },
  ];

  return (
    <div className="city">
      <section className="panel">
        <div className="eyebrow">Vision City</div>
        <h2>City</h2>
        <p className="muted">Tap a building to go inside.</p>
      </section>

      <div className="city-map"><WorldScene city /><div className="city-location"><span>✦ VISION CITY</span><small>THE HIGHLAND SANCTUARY</small></div><div className="city-motes" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,top:`${25+(i*13)%65}%`,animationDelay:`${i*.4}s`}} />)}</div>
        {buildings.map((b) => (
          <button key={b.id} data-building={b.id} className={`building ${b.badge ? 'ready' : ''}`} onClick={() => onOpen(b.id)}>
            <img className="building-art" src={b.art} alt="" draggable={false} />
            <span className="building-name">{b.name}</span>
            {b.badge && <span className="badge">{b.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
