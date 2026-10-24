import type { CSSProperties, ReactNode } from 'react';
import { BuildingInterior, INTERIOR_TITLES } from './BuildingInterior';

export interface District {
  name: string;
  accent: string;
}

/** The City's four streets; each building screen wears its street's accent color. */
const DISTRICTS: Record<string, District> = {
  market: { name: 'Market Row', accent: '#e0a65a' },
  training: { name: 'Training Grounds', accent: '#7fb88a' },
  arena: { name: 'Arena Quarter', accent: '#d9736b' },
  harbor: { name: 'Harbor & Depths', accent: '#6fb0c8' },
};

const DISTRICT_OF: Record<string, keyof typeof DISTRICTS> = {
  'Summoning Shrine': 'market',
  Shop: 'market',
  Armory: 'market',
  'Fusion Lab': 'market',
  'Fortune Teller': 'market',
  'Upgrades House': 'market',
  'Training Dojo': 'training',
  'Gravity Chamber': 'training',
  'Bounty Board': 'training',
  'Hall of Legends': 'training',
  "Collector's Journal": 'training',
  Colosseum: 'arena',
  'Rival Tower': 'arena',
  'Survival Gate': 'arena',
  'Infinite Climb': 'arena',
  'Expedition Port': 'harbor',
  'Daily Dungeon': 'harbor',
  'Boss Raid': 'harbor',
};

const PLAZA: District = { name: '', accent: '#ffd23f' };

export function districtFor(title: string): District {
  const id = DISTRICT_OF[title];
  return id ? DISTRICTS[id] : PLAZA;
}

export function districtStyle(title: string): CSSProperties {
  return { '--accent': districtFor(title).accent } as CSSProperties;
}

export function BackToCity({ onBack, className = '' }: { onBack: () => void; className?: string }) {
  return (
    <button className={`bh-back ${className}`} onClick={onBack}>
      <span aria-hidden="true">←</span> City
    </button>
  );
}

/** Each destination opens onto its own room, framed like Home's scenes; controls stay outside the artwork. */
export function BuildingHeader({ title, onBack, children }: { title: string; onBack: () => void; children?: ReactNode }) {
  const kind = INTERIOR_TITLES[title];
  return (
    <>
      <BackToCity onBack={onBack} />
      <section className={`bh-frame interior-header ${kind ? `room-${kind}` : 'no-room'}`} style={districtStyle(title)}>
        {kind && <BuildingInterior kind={kind} />}
        <div className="bh-copy">
          <span className="bh-eyebrow">Vision City{districtFor(title).name && ` · ${districtFor(title).name}`}</span>
          <h2>{title}</h2>
          {children}
        </div>
      </section>
    </>
  );
}
