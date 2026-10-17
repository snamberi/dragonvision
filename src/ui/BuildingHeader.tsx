import { armoryUrl, boardUrl, colosseumUrl, dojoUrl, gateUrl, gravityUrl, hallUrl, labUrl, portUrl, tentUrl, towerUrl } from '../art/buildings';
import type { ReactNode } from 'react';

/** Back button and title panel shared by every City building. */
export function BuildingHeader({ title, onBack, children }: { title: string; onBack: () => void; children?: ReactNode }) {
  const art = ({ 'Training Dojo': dojoUrl, 'Fusion Lab': labUrl, 'Gravity Chamber': gravityUrl, 'Expedition Port': portUrl, 'Bounty Board': boardUrl, 'Fortune Teller': tentUrl, 'Rival Tower': towerUrl, Armory: armoryUrl, 'Hall of Legends': hallUrl, Colosseum: colosseumUrl, 'Survival Gate': gateUrl } as Record<string, () => string>)[title];
  return (
    <>
      <button className="btn ghost" onClick={onBack}>
        ← City
      </button>
      <section className="panel building-header">{art && <img className="header-building-art" src={art()} alt="" />}
        <div className="eyebrow">Vision City</div>
        <h2>{title}</h2>
        {children}
      </section>
    </>
  );
}
