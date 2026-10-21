import type { CSSProperties } from 'react';
export type ActivityKind = 'dojo'|'fusion'|'gravity'|'port'|'fortune'|'hall';
const TITLES: Record<ActivityKind,string>={dojo:'Practice makes power',fusion:'The resonance engine',gravity:'Push beyond your limits',port:'Beyond the horizon',fortune:'Written in the stars',hall:'Your legend, remembered'};
const COLORS: Record<ActivityKind,string>={dojo:'#e8bd79',fusion:'#86eac8',gravity:'#c1a0ff',port:'#84d5df',fortune:'#d5b2ff',hall:'#f3d186'};
/** A decorative vignette; its caption always reflects actual game state. */
export function ActivityScene({kind,status,active=false}:{kind:ActivityKind;status:string;active?:boolean}) {
 return <section className={`activity-scene activity-${kind} ${active?'is-working':''}`} style={{'--scene-light':COLORS[kind]} as CSSProperties} aria-label={`${TITLES[kind]}. ${status}`}>
 <svg viewBox="0 0 960 180" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
 <rect width="960" height="180" fill="#191d30"/>
 {Array.from({length:18},(_,i)=><rect key={i} x={i*59} y={(i*37)%130} width="3" height="3" fill={COLORS[kind]} opacity=".3"/>)}
 {kind==='port'?<>
 <path d="M0 115V90H70V66H120V92H160V110H225V80H270V60H310V98H370V115H960V180H0Z" fill="#354b59"/>
 <rect y="120" width="960" height="60" fill="#284956"/>
 {[0,1,2].map(i=><path key={i} className="activity-water" style={{animationDelay:`${i*-1.4}s`}} d={`M20 ${134+i*14}h130m55 0h90m80 0h180m70 0h150m65 0h100`} stroke="#73b0b1" strokeWidth="2" opacity=".4"/>)}
 <g className="activity-boat"><path d="M600 129H775L750 152H626Z" fill="#9c7151"/><path d="M610 132H765" stroke="#e5c78b" strokeWidth="4"/><path d="M679 130V24" stroke="#b58c65" strokeWidth="5"/><path d="M671 33V115H610Z" fill="#e9dcb5"/><path d="M689 52V115H745Z" fill="#bd8669"/><path d="M679 24H710L701 35H679Z" fill="#e6bf6e"/></g>
 </>:kind==='dojo'?<>
 <rect y="130" width="960" height="50" fill="#65483f"/>{Array.from({length:16},(_,i)=><path key={i} d={`M${i*70} 130v50`} stroke="#3f3032" strokeWidth="2"/>)}
 <path d="M560 160H810L790 126H580Z" fill="#a0a47a" stroke="#3e6255" strokeWidth="4"/>
 <g className="activity-dummy"><path d="M690 70V145M650 90H730M670 109H709" stroke="#bf8b5c" strokeWidth="12"/><path d="M677 48H703V72H677Z" fill="#e1b782"/><path d="M686 130L672 155M694 130L710 155" stroke="#976a4a" strokeWidth="8"/></g>
 <path className="activity-swish" d="M638 70H613M635 89H600M639 109H615" stroke="#f6d99a" strokeWidth="4"/>
 </>:kind==='hall'?<>
 {[585,680,775].map((x,i)=><g key={x}><rect x={x-25} y={125-i%2*18} width="70" height="55" fill="#49404a"/><rect x={x-30} y={123-i%2*18} width="80" height="7" fill="#988570"/><g transform={`translate(${x} ${-i%2*18})`}><path d="M0 54H20V88L10 98L0 88ZM6 98H14V112H28V118H-8V112H6Z" fill="#e6bc69"/><path d="M0 60H-13V80L0 88M20 60H33V80L20 88" fill="none" stroke="#b48851" strokeWidth="5"/><rect x="4" y="58" width="4" height="25" fill="#fff0b2"/></g></g>)}
 <path className="activity-glint" d="M725 39V55M717 47H733" stroke="#fff0c0" strokeWidth="3"/>
 </>:<>
 <path d="M540 145H830L850 170H520Z" fill="#484354"/><path d="M550 146H820" stroke={COLORS[kind]} strokeWidth="3"/>
 <g className="activity-orbit"><ellipse cx="685" cy="85" rx="105" ry="28" fill="none" stroke={COLORS[kind]} strokeWidth="2"/><ellipse cx="685" cy="85" rx="68" ry="60" fill="none" stroke={COLORS[kind]} strokeWidth="2" opacity=".45"/></g>
 <g className="activity-core"><path d={kind==='fortune'?'M655 45H715L735 65V105L715 125H655L635 105V65Z':'M685 35L728 82L685 129L642 82Z'} fill={COLORS[kind]} opacity=".75"/><path d="M685 48L710 82L685 113L660 82Z" fill="#effff0"/><rect x="669" y="61" width="7" height="19" fill="white"/></g>
 {[560,800].map(x=><g key={x}><rect x={x} y="60" width="15" height="80" fill="#555468"/>{[75,95,115].map(y=><rect className="activity-indicator" key={y} x={x+4} y={y} width="7" height="9" fill={COLORS[kind]}/>)}</g>)}
 </>}
 </svg><div className="activity-caption"><span>{kind==='port'?'EXPEDITION LOG':kind==='hall'?'HALL ARCHIVE':'SANCTUARY WORKSHOP'}</span><h3>{TITLES[kind]}</h3><p>{status}</p></div>
 </section>;
}
