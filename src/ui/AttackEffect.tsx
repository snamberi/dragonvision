import type { CSSProperties } from 'react';
import { FAMILIES } from '../game/roster';
const COLORS = ['#ffbd49','#ad89ff','#fff397','#6bffd2','#79dfff','#ff87cd','#a4ef57','#b699ff','#ff8370','#f8db7a','#77ecfa','#ffae68','#8aaeff','#f7a1f0','#d5faff','#bded81','#6fffc0','#ff557f'];
/** Each family has its own color, beam silhouette, particle count and ring cadence. */
export function AttackEffect({ familyId, side, special, duration, support = false }: { familyId: string; side: string; special: boolean; duration: number; support?: boolean }) {
 const index = Math.max(0,FAMILIES.findIndex(f => f.id === familyId));
 if (support) return <span className="support-fx" style={{'--energy':COLORS[index%COLORS.length], '--duration':`${duration}ms`} as CSSProperties} aria-hidden="true"><i/><i/><i/></span>;
 return <span className={`attack-fx ${side} pattern-${index%6} ${special?'is-special':''}`} style={{'--energy':COLORS[index%COLORS.length], '--duration':`${duration}ms`, '--beam-size':`${7+index%5*2}px`} as CSSProperties} aria-hidden="true">
 <span className="energy-core"/><span className="energy-trail"/>
 {Array.from({length:3+index%4},(_,i)=><i className="energy-ring" key={i} style={{left:`${12+i*15}%`,animationDelay:`${i*12}ms`, transform:`rotate(${index*13}deg)`}}/>)}
 <span className="energy-head"/>
 </span>;
}
