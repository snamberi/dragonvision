import type { ReactNode } from 'react';
import { BuildingInterior, INTERIOR_TITLES } from './BuildingInterior';

/** Each destination opens onto its own room; controls stay outside the artwork. */
export function BuildingHeader({title,onBack,children}:{title:string;onBack:()=>void;children?:ReactNode}) {
  const kind=INTERIOR_TITLES[title];
  return <>
    <button className="btn ghost" onClick={onBack}>← City</button>
    <section className={`panel building-header interior-header room-${kind}`}>
      {kind&&<BuildingInterior kind={kind}/>}
      <div className="interior-copy"><div className="eyebrow">Vision City</div><h2>{title}</h2>{children}</div>
    </section>
  </>;
}
