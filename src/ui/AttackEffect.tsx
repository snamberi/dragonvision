import { basicMotion } from '../art/combatMotion';
import type { CSSProperties } from 'react';
import { identityFor, type AttackStyle } from '../art/identity';
import type { Fighter, ActionEvent } from '../game/battle';
import type { SpecialKind } from '../game/types';

/** Shared with the battle layout. SVG coordinates track each actual hit target. */
export function fighterFootPoint(f:Pick<Fighter,'side'|'row'|'slot'>) {
  return { x:(f.side==='enemy'?(f.row==='front'?31:12):(f.row==='front'?69:88))*10, y:([57,66,75,84,93][f.slot]??75)*5 };
}
export function fighterPoint(f:Pick<Fighter,'side'|'row'|'slot'>) {
  const foot=fighterFootPoint(f);return {...foot,y:foot.y-42};
}
const starPath='M0 -24L6 -7L24 0L7 6L0 24L-6 7L-24 0L-7 -6Z';
function Signature({kind,length}:{kind:AttackStyle;length:number}) {
  const end=Math.max(length,40);
  switch(kind) {
    case 'solar': return <><path className="fx-draw" d={`M0 0H${end}`} strokeWidth="22"/><path d={`M0 0H${end}`} stroke="#fff8db" strokeWidth="6"/>{[.2,.45,.7].map(t=><ellipse key={t} cx={end*t} rx="12" ry="29" className="fx-ring"/>)}</>;
    case 'cannon': return <><path className="fx-draw" d={`M0 -5L${end} -30V30L0 5Z`} fill="currentColor" stroke="none"/><path d={`M0 0H${end}`} stroke="#fff" strokeWidth="7"/><path d={`M${end-30} -43L${end+8} 0L${end-30} 43`} strokeWidth="5"/></>;
    case 'flash': return <g transform={`translate(${end} 0)`}><circle r="35" className="fx-ring"/>{Array.from({length:12},(_,i)=><path key={i} d="M16 0H65" transform={`rotate(${i*30})`} strokeWidth={i%2?3:6}/>)}</g>;
    case 'comets': return <>{[-1,1].map(n=><g key={n}><path className="fx-draw" d={`M0 0Q${end*.5} ${80*n} ${end} ${12*n}`} strokeWidth="9"/><circle cx={end} cy={12*n} r="13" fill="#fff9db"/></g>)}</>;
    case 'lightning': return <>{[-1,0,1].map((n,i)=><path key={n} className="fx-lightning" d={`M0 0L${end*.22} ${-20+n*15}L${end*.37} ${28+n*8}L${end*.49} ${-24+n*10}L${end*.71} ${20+n*8}L${end*.82} ${-16+n*8}L${end} 0`} strokeWidth={i===1?6:2} stroke={i===1?'#fff7df':undefined}/>)}</>;
    case 'ray': return <><path d={`M0 0H${end}`} strokeWidth="3" stroke="#fff"/>{[.1,.3,.5,.7,.9].map(t=><path key={t} d={`M${end*t-8} -10L${end*t+8} 0L${end*t-8} 10`} strokeWidth="3"/>)}</>;
    case 'volley': return <>{Array.from({length:7},(_,i)=><g className="fx-shot" key={i} style={{animationDelay:`${i*18}ms`}}><path d={`M${end*(i%3)/4} ${(i-3)*8}h${end*.5}`} strokeWidth="4"/><rect x={end*(i%3)/4+end*.5} y={(i-3)*8-3} width="14" height="6" fill="#fff" stroke="none"/></g>)}</>;
    case 'quake': case 'shatter': case 'magma': return <>{[.25,.5,.75,1].map((t,i)=><g key={t} className="fx-eruption" style={{animationDelay:`${i*30}ms`}} transform={`translate(${end*t} 25)`}><path d={`M-24 0L-12 -${25+i*9}L-4 -12L6 -${50+i*7}L25 0Z`} fill="currentColor"/><path d="M-10 0L5 -32L12 0" fill="#fff1b8" stroke="none"/>{kind==='magma'&&<path d="M-25 4H26M-15 -55q-10 -10-12 0q6 9 12 0M22 -73q-9-12-12 0q7 10 12 0" stroke="#ffe2a1" strokeWidth="3"/>}{kind==='shatter'&&<path d="M-36 -20l8 -12 9 10-8 10Z M22 -44l8 -5 9 12-10 6Z" fill="currentColor"/>}</g>)}</>;
    case 'crescent': case 'supernova': case 'night': return <><path className="fx-draw" d={`M0 0Q${end*.5} -40 ${end} 0`} strokeWidth="3"/><g transform={`translate(${end-20} 0)`}><path className="fx-slash" d="M-12 -65Q85 0 -12 65Q27 0 -12 -65Z" fill="currentColor" stroke="#fff3df" strokeWidth="2"/>{kind==='supernova'&&<path d={starPath} fill="#fff3df"/>}{kind==='night'&&<path d="M-45 -46Q25 0 -45 46" strokeWidth="5"/>}</g></>;
    case 'petals': return <>{Array.from({length:12},(_,i)=><path className="fx-petal" key={i} d="M0 0Q-15 -23 0 -31Q19 -10 0 0Z" fill={i%3?'currentColor':'#fff2dd'} stroke="none" transform={`translate(${end*(i+1)/12} ${Math.sin(i*2)*38}) rotate(${i*51})`}/>)}</>;
    case 'stars': return <>{[.35,.65,1].map((t,i)=><g key={t} transform={`translate(${end*t} ${i%2?-25:16})`}><path d="M-45 -65L0 0" strokeWidth="6"/><path className="fx-star" d={starPath} fill="#fff8df"/></g>)}</>;
    case 'souls': case 'absorb': case 'maw': case 'godfall': return <><path className="fx-drain" d={`M0 0Q${end*.5} -65 ${end} 0Q${end*.5} 65 0 0`} strokeWidth="5" strokeDasharray="16 12"/>{[.3,.6,.9].map(t=><g key={t} transform={`translate(${end*t} ${Math.sin(t*9)*18})`}><path d={kind==='absorb'?'M0 -16L13 -7V7L0 16L-13 7V-7Z':kind==='maw'?'M-20 -12L-11 -3L-5 -12L1 -3L7 -12L20 -9L12 12L3 6L-5 14L-15 8Z':'M-14 10V-9Q0 -31 14 -9V10L7 3L0 13L-7 3Z'} fill="currentColor"/><path d="M-6 -6h3m6 0h3" stroke="#1b1333" strokeWidth="3"/></g>)}{kind==='godfall'&&<path d={`M${end} -120V30M${end-40} -60L${end} 0L${end+40} -60`} strokeWidth="6"/>}</>;
    case 'void': return <><path className="fx-draw" d={`M0 0H${end}`} strokeWidth="15"/><circle className="fx-ring" cx={end} r="38"/><circle cx={end} r="23" fill="#100a20" strokeWidth="5"/><path d={`M${end-50} -24Q${end} 28 ${end+50} 24`} strokeWidth="4"/></>;
    case 'helix': return <>{[-1,1].map(n=><path key={n} d={`M0 0Q${end*.125} ${n*38} ${end*.25} 0T${end*.5} 0T${end*.75} 0T${end} 0`} strokeWidth="7" stroke={n===1?'#fff1b0':undefined}/>)}</>;
    case 'dragon': return <><path className="fx-draw" d={`M0 0Q${end*.3} -45 ${end*.6} 0T${end} 0`} strokeWidth="17"/><g transform={`translate(${end-18} 0)`}><path d="M-25 -10L-34 -35L-4 -24L12 -14L35 -9L23 0L38 10L6 18L-15 12Z" fill="currentColor"/><path d="M4 -8h8" stroke="#fff" strokeWidth="4"/></g></>;
    case 'tempest': return <>{[-1,0,1].map(n=><path className="fx-draw" key={n} d={`M0 ${n*9}Q${end*.4} ${n*60-25} ${end} ${n*16}`} strokeWidth="5"/>)}<ellipse className="fx-ring" cx={end} rx="24" ry="50"/></>;
    // Defensive signatures also appear around the actual recipient, below.
    default: return <><path className="fx-draw" d={`M0 0H${end}`} strokeWidth="5"/><path d={starPath} transform={`translate(${end} 0)`} fill="currentColor"/></>;
  }
}
function Blessing({kind}:{kind:AttackStyle}) {
  if(kind==='bulwark'||kind==='titan') return <><path d="M-37 -40H37V10Q30 44 0 58Q-30 44 -37 10Z" fill="currentColor" fillOpacity=".12" strokeWidth="4"/><path d="M0 -26V28M-18 0H18" strokeWidth="5"/>{kind==='titan'&&<path d="M-48 -20V25M48 -20V25" strokeWidth="7"/>}</>;
  if(kind==='wings') return <><path d="M0 4Q-34 -65 -61 -40L-35 0L-54 -15L-27 25Z M0 4Q34 -65 61 -40L35 0L54 -15L27 25Z" fill="currentColor" fillOpacity=".45"/><path d={starPath} fill="#fff"/></>;
  if(kind==='rift') return <><ellipse rx="28" ry="57" strokeWidth="5"/><ellipse rx="16" ry="43" strokeDasharray="5 8" strokeWidth="4"/><path d="M-8 10L0 -15L8 10" strokeWidth="5"/></>;
  if(kind==='lesson') return <><path d="M-27 -35H27V35H-27Z" fill="currentColor" fillOpacity=".15" strokeWidth="3"/><path d="M-33 -35H33M-33 35H33" strokeWidth="6"/><path d="M-12 -13H12M-12 0H8M-12 13H12" strokeWidth="4"/></>;
  if(kind==='hymn') return <><circle r="42" strokeWidth="3" strokeDasharray="8 5"/><path d="M-24 9V-8L-10 0L0 -22L10 0L24 -8V9Z" fill="currentColor"/><path d="M-18 22H18" strokeWidth="5"/></>;
  return <><circle r="36" strokeWidth="3"/><ellipse rx="49" ry="18" strokeWidth="3"/><path d={kind==='rite'?starPath:'M-6 -22H6V-6H22V6H6V22H-6V6H-22V-6H-6Z'} fill="currentColor" stroke="none"/></>;
}
export function AttackEffect({event,fighters,duration}:{event:ActionEvent;fighters:Fighter[];duration:number}) {
  const actor=fighters.find(f=>f.id===event.actorId);if(!actor)return null;
  const profile=identityFor(actor.familyId), start=fighterPoint(actor);
  const special=event.kind==='special'||event.kind==='combo';
  const hits=event.hits.filter((h,i,all)=>all.findIndex(x=>x.targetId===h.targetId&&x.kind===h.kind)===i);
  return <svg className={`signature-fx ${special?'signature-special':''}`} viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true" data-signature={profile.attack} style={{'--energy':profile.color,'--fx-duration':`${duration}ms`} as CSSProperties}>
    {hits.map((hit,i)=>{const target=fighters.find(f=>f.id===hit.targetId);if(!target)return null;const end=fighterPoint(target);const dx=end.x-start.x,dy=end.y-start.y;const length=Math.hypot(dx,dy);const angle=Math.atan2(dy,dx)*180/Math.PI;
      if(hit.kind!=='damage') return <g key={i} transform={`translate(${end.x} ${end.y})`}><g className="fx-blessing" fill="none" stroke="currentColor"><Blessing kind={profile.attack}/></g></g>;
      if(special && ['quake','shatter','magma'].includes(profile.attack)) return <g key={i} transform={`translate(${end.x-38} ${end.y+10})`} fill="none" stroke="currentColor"><Signature kind={profile.attack} length={60}/></g>;
      return <g key={i} transform={`translate(${start.x} ${start.y}) rotate(${angle})`} fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
        {special?<Signature kind={profile.attack} length={length}/>:(event.kind==='kiBlast'||basicMotion(actor.familyId)==='projectile')?<g className="travelling-ki" style={{'--travel':`${length}px`} as CSSProperties}><path d="M-68 0H-8" strokeWidth="6" opacity=".45"/><circle r="17" fill="currentColor"/><circle r="9" fill="#fff9cf"/><circle r="24" strokeWidth="2" opacity=".6"/></g>:<g transform={`translate(${length} 0)`}><path className="fx-slash" d="M-22 -18L24 19M-18 20L22 -16" stroke="#fff4da" strokeWidth="5"/></g>}
      </g>;
    })}
  </svg>;
}

/** The yard reuses signature artwork without creating a battle or spending resources. */
export function SignaturePreview({familyId,kind,duration}:{familyId:string;kind:SpecialKind;duration:number}) {
  const profile=identityFor(familyId),support=['heal','revive','shield','rally'].includes(kind);
  return <svg className="signature-fx signature-preview" viewBox="0 0 1000 350" preserveAspectRatio="none" aria-hidden="true" data-signature={profile.attack} style={{'--energy':profile.color,'--fx-duration':`${duration}ms`} as CSSProperties}>
    {support?<g transform="translate(280 220)" fill="none" stroke="currentColor" className="fx-blessing"><Blessing kind={profile.attack}/></g>
      :['quake','shatter','magma'].includes(profile.attack)?<g transform="translate(685 230)" fill="none" stroke="currentColor"><Signature kind={profile.attack} length={65}/></g>
      :<g transform="translate(280 220)" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round"><Signature kind={profile.attack} length={450}/></g>}
  </svg>;
}
