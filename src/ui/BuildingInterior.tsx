import { useId, type CSSProperties } from 'react';
import { Sprite } from './Sprite';
export type InteriorKind = 'dojo'|'armory'|'fusion'|'gravity'|'port'|'bounty'|'fortune'|'tower'|'hall'|'colosseum'|'gate'|'shop'|'summon'|'upgrades'|'journal';
export const INTERIOR_TITLES:Record<string,InteriorKind>={'Training Dojo':'dojo','Armory':'armory','Fusion Lab':'fusion','Gravity Chamber':'gravity','Expedition Port':'port','Bounty Board':'bounty','Fortune Teller':'fortune','Rival Tower':'tower','Hall of Legends':'hall','Colosseum':'colosseum','Survival Gate':'gate','Shop':'shop','Summoning Shrine':'summon','Upgrades House':'upgrades',"Collector's Journal":'journal'};
const ROOMS:Record<InteriorKind,{wall:string;floor:string;light:string;resident:string;caption:string}>={
 dojo:{wall:'#684b43',floor:'#765942',light:'#ffd898',resident:'mei',caption:'THE TRAINING HALL'},
 armory:{wall:'#3e3948',floor:'#4c4346',light:'#ffac65',resident:'bruno',caption:'THE EMBER FORGE'},
 fusion:{wall:'#253c4d',floor:'#263747',light:'#98f3d7',resident:'nyx',caption:'THE FUSION WORKSHOP'},
 gravity:{wall:'#33334c',floor:'#3e3d54',light:'#bdadff',resident:'varek',caption:'THE GRAVITY ENGINE'},
 port:{wall:'#4a5865',floor:'#67594d',light:'#a5e8ec',resident:'sora',caption:'THE FAR HORIZON'},
 bounty:{wall:'#66513f',floor:'#64513e',light:'#edc690',resident:'jin',caption:'THE HUNTERS’ LODGE'},
 fortune:{wall:'#422d50',floor:'#573b54',light:'#e9b3ff',resident:'zeno',caption:'THE STARWEAVER’S TENT'},
 tower:{wall:'#414353',floor:'#4e4958',light:'#d6c4f0',resident:'kael',caption:'THE RIVAL ASCENT'},
 hall:{wall:'#4b3c56',floor:'#4a3f50',light:'#ffe0a0',resident:'aurel',caption:'THE HALL OF LEGENDS'},
 colosseum:{wall:'#6d5350',floor:'#8d7660',light:'#ffcc97',resident:'mogra',caption:'THE CHAMPIONS’ GATE'},
 gate:{wall:'#30283f',floor:'#42434e',light:'#b5a1ff',resident:'grimm',caption:'BEYOND THE VEIL'},
 shop:{wall:'#604348',floor:'#715148',light:'#ffd891',resident:'kenji',caption:'THE LANTERN MARKET'},
 summon:{wall:'#352743',floor:'#45374e',light:'#d7b4ff',resident:'orrin',caption:'THE SUMMONING SANCTUM'},
 upgrades:{wall:'#2a2450',floor:'#3a3264',light:'#ffd23f',resident:'kairo',caption:'THE UPGRADES HOUSE'},
 journal:{wall:'#4e3f3c',floor:'#5c4739',light:'#f3d186',resident:'tobi',caption:'THE ARCHIVIST’S STUDY'},
};
function Sword({x,y,flip=false}:{x:number;y:number;flip?:boolean}) {return <g transform={`translate(${x} ${y}) rotate(${flip?-22:22})`}><path d="M0 0L-5 6V48L0 54L5 48V6Z" fill="#c9dce8"/><path d="M0 4V45" stroke="#f5f3df" strokeWidth="2"/><path d="M-12 51H12" stroke="#d9a458" strokeWidth="5"/><path d="M0 53V70" stroke="#8e5d45" strokeWidth="5"/></g>}
function Trophy({x,y}:{x:number;y:number}) {return <g transform={`translate(${x} ${y})`}><path d="M-14 0H14V17L5 26V36H15V42H-15V36H-5V26L-14 17Z" fill="#edbe61"/><path d="M-14 5H-25V16L-14 23M14 5H25V16L14 23" fill="none" stroke="#a77a3e" strokeWidth="5"/><path d="M-8 4V16L-3 23" stroke="#ffe8a0" strokeWidth="4"/></g>}
export function BuildingInterior({kind}:{kind:InteriorKind}) {
 const cfg=ROOMS[kind],id=useId().replace(/:/g,'');
 return <div className={`interior-scene interior-${kind}`} style={{'--room-light':cfg.light} as CSSProperties} aria-hidden="true">
  <svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
   <defs>
    <pattern id={`${id}-wall`} width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill={cfg.wall}/><path d="M0 0H64M0 16H64M32 0V16M0 16V32" fill="none" stroke="#0e0e241c" strokeWidth="2"/></pattern>
    <radialGradient id={`${id}-light`}><stop stopColor={cfg.light} stopOpacity=".25"/><stop offset="1" stopColor={cfg.light} stopOpacity="0"/></radialGradient>
   </defs>
   <rect width="800" height="260" fill={`url(#${id}-wall)`}/>
   <path d="M0 175H800V260H0Z" fill={cfg.floor}/>
   <path d="M0 175H800" stroke="#251e31" strokeWidth="8"/>
   {[0,1,2,3,4,5,6,7].map(i=><path key={i} d={`M${120+i*80} 175L${-300+i*200} 260`} stroke="#1a152c2e" strokeWidth="2"/>)}
   {[190,212,243].map(y=><path key={y} d={`M0 ${y}H800`} stroke="#18142b2a" strokeWidth="2"/>)}
   {[24,750].map(x=><g key={x}><rect x={x} y="0" width="26" height="184" fill="#251f31"/><rect x={x+4} y="0" width="6" height="180" fill="#a2938e55"/><rect x={x-3} y="164" width="32" height="20" fill="#302738"/></g>)}
   {kind==='dojo'&&<>
     {[95,525].map(x=><g key={x}><rect x={x} y="28" width="178" height="103" fill="#27283d"/><rect x={x+6} y="34" width="166" height="90" fill="#d7bf98"/>{[1,2,3,4].map(i=><path key={i} d={`M${x+i*35} 34V124`} stroke="#69534a" strokeWidth="4"/>)}<path d={`M${x} 77h178`} stroke="#69534a" strokeWidth="4"/></g>)}
     <rect x="350" y="20" width="100" height="128" fill="#dfc9a1"/><path d="M344 18H456M344 150H456" stroke="#4b2936" strokeWidth="8"/><path d="M379 54L400 38L420 54L400 70Z M379 95L400 78L420 95L400 112Z" fill="none" stroke="#6b4b48" strokeWidth="5"/>
     {[140,330,520].map(x=><g key={x}><path d={`M${x} 194h130l25 43H${x-25}Z`} fill="#a39967" stroke="#4f594e" strokeWidth="4"/><path d={`M${x} 204h132`} stroke="#d0c58c" strokeWidth="2"/></g>)}
     <path d="M680 149V210M650 167H708" stroke="#a08058" strokeWidth="12"/><circle cx="681" cy="134" r="15" fill="#aa825b"/>
   </>}
   {kind==='armory'&&<>
     <rect x="315" y="12" width="172" height="169" fill="#2a2633"/><path d="M338 12V66H466V12" fill="#56505c"/><path d="M330 178V111L355 81H448L474 111V178Z" fill="#7e5a4b"/><path d="M350 177V117L366 100H437L454 117V177Z" fill="#251c2c"/>
     <g className="forge-flame"><path d="M354 173L366 127L381 145L400 106L416 148L436 121L450 173Z" fill="#f48244"/><path d="M376 174L389 145L403 126L422 174Z" fill="#ffe39c"/></g>
     {[100,560].map(x=><g key={x}><rect x={x} y="48" width="144" height="90" fill="#251e32"/><path d={`M${x} 124H${x+144}`} stroke="#98755e" strokeWidth="9"/><Sword x={x+33} y={55}/><Sword x={x+102} y={55} flip/></g>)}
     <path d="M514 188H626L610 204H565V222H594V230H542V222H551V203H530Z" fill="#343343"/><path d="M510 186H626" stroke="#9ba0aa" strokeWidth="5"/>
   </>}
   {(kind==='fusion'||kind==='gravity')&&<>
     <path d="M110 0V32H690V0M110 33V165M690 33V165" fill="none" stroke="#5b677b" strokeWidth="10"/>
     <path d="M110 32H690" stroke={cfg.light} strokeWidth="2" className="room-energy"/>
     {kind==='fusion'?[190,400,610].map((x,i)=><g key={x}><rect x={x-44} y="38" width="88" height="120" rx="16" fill="#132a37" stroke="#687c8e" strokeWidth="7"/><rect x={x-32} y="51" width="64" height="95" fill="#85e9c522"/><path d={`M${x-23} 60v70`} stroke="#b5fff3" strokeWidth="3"/><path d={`M${x} 74l20 27-20 27-20-27Z`} fill={i===1?'#dcb8ff':cfg.light} className="room-crystal"/><rect x={x-54} y="153" width="108" height="23" fill="#455063"/><rect x={x-14} y="159" width="28" height="6" fill={cfg.light}/></g>):<g><ellipse cx="400" cy="163" rx="126" ry="22" fill="#131726" stroke="#8584a2" strokeWidth="6"/><circle cx="400" cy="95" r="60" fill="#201d33" stroke="#8782aa" strokeWidth="8"/><circle className="room-energy" cx="400" cy="95" r="46" fill="none" stroke={cfg.light} strokeDasharray="12 6" strokeWidth="3"/><path d="M400 58L430 95L400 130L370 95Z" fill={cfg.light} className="room-crystal"/>{[160,620].map(x=><g key={x}><rect x={x} y="51" width="30" height="118" fill="#252438"/><path d={`M${x+8} 66v87m14-87v87`} stroke={cfg.light} strokeWidth="4"/></g>)}</g>}
     <path d="M315 217L330 189H470L485 217Z" fill="#1c2537" stroke="#5b7482" strokeWidth="3"/><path d="M350 203h43m24 0h33" stroke={cfg.light} strokeWidth="6"/>
   </>}
   {kind==='shop'&&<>
     {[90,505].map(x=><g key={x}><rect x={x} y="44" width="196" height="125" fill="#302439"/>{[81,123,165].map((y,i)=><g key={y}><path d={`M${x-8} ${y}h212`} stroke="#a47856" strokeWidth="8"/>{[22,65,108,151].map((ox,j)=><g key={ox}><rect x={x+ox} y={y-26} width="19" height="24" fill={['#76b5a5','#daae69','#b893c8'][(i+j)%3]}/><rect x={x+ox+3} y={y-30} width="13" height="6" fill="#cfbd99"/></g>)}</g>)}</g>)}
     <path d="M60 12H740V38L710 51L680 38L650 51L620 38L590 51L560 38L530 51L500 38L470 51L440 38L410 51L380 38L350 51L320 38L290 51L260 38L230 51L200 38L170 51L140 38L110 51L80 38L60 49Z" fill="#a75a64"/>
     <rect x="289" y="151" width="223" height="64" fill="#815747"/><rect x="279" y="147" width="243" height="12" fill="#c79a6b"/><path d="M300 205H500" stroke="#443144" strokeWidth="5"/>
   </>}
   {kind==='bounty'&&<>
     <rect x="145" y="27" width="510" height="138" fill="#a77d55" stroke="#392b35" strokeWidth="12"/>{[195,302,409,516].map((x,i)=><g key={x} transform={`rotate(${i%2?3:-3} ${x} 80)`}><rect x={x} y="48" width="65" height="96" fill="#dfcb9e"/><rect x={x+29} y="45" width="6" height="6" fill="#8c4e4d"/><circle cx={x+32} cy="80" r="12" fill="#7e6b5e"/><path d={`M${x+16} 113v-17l16-7 16 7v17Z`} fill="#7e6b5e"/><path d={`M${x+12} 127h41`} stroke="#947354" strokeWidth="4"/></g>)}
     <rect x="102" y="189" width="85" height="43" fill="#714f3b"/><path d="M102 202H187M122 189V230M166 189V230" stroke="#b28c60" strokeWidth="4"/>
   </>}
   {kind==='fortune'&&<>
     <path d="M50 0H750L650 65H150Z" fill="#705079"/><path d="M60 0L168 60L100 180H60ZM740 0L632 60L700 180H740Z" fill="#593663"/>
     {[175,245,335,465,555,625].map((x,i)=><g key={x}><path d={`M${x} 0v${30+i%3*19}`} stroke="#bd957a"/><path d="M0 -6L2 -2L6 0L2 2L0 6L-2 2L-6 0L-2 -2Z" transform={`translate(${x} ${38+i%3*19})`} fill="#e5c68d"/></g>)}
     <path d="M220 197H580L640 248H160Z" fill="#6f4267" stroke="#b3938f" strokeWidth="4"/>
     <path d="M335 163H465L482 179H320Z" fill="#9b7489"/><rect x="350" y="178" width="100" height="33" fill="#58384f"/><circle cx="400" cy="126" r="38" fill="#b597e8" stroke="#e9c6ff" strokeWidth="3"/><circle cx="400" cy="126" r="23" fill="#ddd1ff99" className="room-energy"/>
   </>}
   {kind==='port'&&<>
     <rect x="80" y="20" width="640" height="135" fill="#517e91"/><path d="M80 50H720V90H80Z" fill="#8495ac"/><path d="M80 120H720M120 140H340M470 135H660" stroke="#a6d8de" strokeWidth="3" className="shore-ripple"/>
     <path d="M465 102H646L620 125H496Z" fill="#493845"/><path d="M552 31V105M552 34L604 88H552Z" fill="#ede1bb" stroke="#69525a" strokeWidth="4"/>
     <path d="M60 162H740M110 129V197M250 129V197M550 129V197M690 129V197" stroke="#7c5a45" strokeWidth="12"/>
     <path d="M300 190h180l-10 35H310Z" fill="#ad8c63"/><path d="M327 192l21 20 35-10 37 14 32-15" fill="none" stroke="#765f58" strokeWidth="4"/>
   </>}
   {kind==='upgrades'&&<>
     {[80,560].map(x=><g key={x}><rect x={x} y="30" width="160" height="140" fill="#1d1838"/>{[70,118,166].map(y=><path key={y} d={`M${x-6} ${y}h172`} stroke="#8a7a3a" strokeWidth="7"/>)}{[0,1,2].map(r=>[0,1,2,3].map(c=><g key={`${r}${c}`}><rect x={x+10+c*37} y={36+r*48} width="30" height="30" fill={(r+c)%2?'#b08a4c':'#8c6a3e'}/><path d={`M${x+10+c*37} ${51+r*48}h30M${x+25+c*37} ${36+r*48}v30`} stroke="#5a4428" strokeWidth="2"/></g>))}</g>)}
     <rect x="320" y="150" width="160" height="40" fill="#5a4a2c"/><rect x="312" y="144" width="176" height="10" fill="#d0b064"/><path d="M350 140L400 128L450 140L400 148Z" fill="#f1e2bf"/>
     <g className="room-crystal"><path d="M400 40L420 64L400 88L380 64Z" fill={cfg.light}/></g><circle cx="400" cy="64" r="38" fill={cfg.light} opacity=".12"/>
   </>}
   {kind==='journal'&&<>
     {[70,530].map(x=><g key={x}><rect x={x} y="20" width="200" height="150" fill="#2c2228"/>{[58,100,142].map((y,i)=><g key={y}><path d={`M${x-6} ${y}h212`} stroke="#9a6f4f" strokeWidth="7"/>{Array.from({length:11},(_,j)=><rect key={j} x={x+8+j*17} y={y-32+((i+j)%3)*3} width={12} height={30-((i+j)%3)*3} fill={['#a5574f','#4f7aa5','#7fa36a','#d0a55a','#8c6aa5'][(i*3+j)%5]}/>)}</g>)}</g>)}
     <path d="M372 196L392 128H408L428 196Z" fill="#6e4a38"/><path d="M350 128L400 112L450 128L400 140Z" fill="#f1e2bf"/><path d="M400 113V140" stroke="#a88a62" strokeWidth="3"/><path d="M362 125L392 117M410 117L440 125" stroke="#b39b7a" strokeWidth="2"/>
     <circle cx="400" cy="60" r="26" fill="#f3d18633"/><path d="M400 34V20" stroke="#5a4636" strokeWidth="4"/><rect x="390" y="40" width="20" height="22" fill="#f3d186"/>
   </>}
   {kind==='hall'&&<>
     {[140,330,520].map((x,i)=><g key={x}><path d={`M${x} 20h140v107l-70-23-70 23Z`} fill={['#81485a','#4a597d','#566a58'][i]}/><path d={`M${x+17} 23v80m106-80v80`} stroke="#caa775" strokeWidth="3"/><Trophy x={x+70} y={50}/><rect x={x+25} y="171" width="90" height="45" fill="#a19691"/><rect x={x+18} y="165" width="104" height="10" fill="#cdc0a9"/><Trophy x={x+70} y={120}/></g>)}
   </>}
   {kind==='tower'&&<>
     <path d="M300 176V155H330V130H360V105H390V80H420V55H450V30H480V5H510V176Z" fill="#94909e"/>
     <path d="M300 176H510M330 155H510M360 130H510M390 105H510M420 80H510M450 55H510" stroke="#565262" strokeWidth="4"/>
     {[170,590].map(x=><g key={x}><rect x={x} y="27" width="64" height="107" fill="#262337"/><path d={`M${x+12} 34h40v79l-20-12-20 12Z`} fill="#965767"/><path d={`M${x+32} 48v38m-10-19h20`} stroke="#e1bf94" strokeWidth="4"/></g>)}
   </>}
   {kind==='colosseum'&&<>
     <path d="M80 170V95Q80 0 400 0Q720 0 720 95V170" fill="#ad8b73"/>
     <path d="M235 175V84Q400 -22 565 84V175" fill="#251f33"/>
     <path d="M270 175V90Q400 12 530 90V175" fill="#8f9ca7"/><path d="M270 145H530V175H270Z" fill="#b79e79"/>
     {[110,165,605,660].map(x=><path key={x} d={`M${x} 60v109`} stroke="#624d4b" strokeWidth="22"/>)}
     <path d="M277 94h246m-246 21h246m-246 21h246" stroke="#706878" strokeWidth="5"/>
   </>}
   {(kind==='gate'||kind==='summon')&&<>
     <path d="M280 185V70L320 27H480L520 70V185" fill="none" stroke="#737185" strokeWidth="25"/><path d="M310 184V73L339 47H461L490 73V184Z" fill="#18132e"/>
     <ellipse cx="400" cy="117" rx="62" ry="68" fill="#9b7bd52b" stroke={cfg.light} strokeWidth="3" className="room-energy"/>
     <path d="M355 185h90l25 25H330Z" fill="#858095"/><path d="M325 216H475L500 237H300Z" fill="#615a74"/>
     {[300,500].map(x=><g key={x}><path d={`M${x} 64v108`} stroke="#d8c1ed" strokeWidth="3" strokeDasharray="7 10"/><rect x={x-7} y="175" width="14" height="20" fill="#9f8d99"/></g>)}
   </>}
   <ellipse cx="400" cy="100" rx="330" ry="175" fill={`url(#${id}-light)`}/>
   {[72,716].map(x=><g key={x}><rect x={x} y="68" width="14" height="28" fill="#2d2539"/><rect className="room-energy" x={x+3} y="72" width="8" height="17" fill={cfg.light}/><circle cx={x+7} cy="82" r="32" fill={`url(#${id}-light)`}/></g>)}
  </svg>
  <span className="interior-resident"><Sprite familyId={cfg.resident} star={1} size={92} pose={kind==='dojo'?'punch':'idle'}/></span>
  <span className="interior-scene-label">{cfg.caption}</span>
 </div>;
}
