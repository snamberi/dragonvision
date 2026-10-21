import { useId } from 'react';
import type { HomeData } from '../game/types';

export const HOME_COLORS = {
  ember: { name: 'Ember', roof: '#a94d45', light: '#dd8058', dark: '#6f343d', flag: '#b4574e' },
  jade: { name: 'Jade', roof: '#397d74', light: '#72b5a1', dark: '#285355', flag: '#4b9382' },
  violet: { name: 'Twilight', roof: '#716195', light: '#aa91bf', dark: '#494263', flag: '#8571ab' },
};

export function HomeEmblem({ kind = 'sun' }: { kind?: HomeData['banner'] }) {
  return <svg className="home-emblem" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges">
    {kind === 'sun' ? <><path d="M9 5H15V7H17V9H19V15H17V17H15V19H9V17H7V15H5V9H7V7H9Z" fill="#ffe4a0"/><path d="M11 0h2v3h-2ZM11 21h2v3h-2ZM0 11h3v2H0ZM21 11h3v2h-3ZM2 2h3v3H2ZM19 2h3v3h-3ZM2 19h3v3H2ZM19 19h3v3h-3Z" fill="#edb765"/></>
      : kind === 'moon' ? <path d="M10 2H18V4H12V6H10V16H12V18H18V20H10V18H6V16H4V6H6V4H10ZM19 6H21V8H23V10H21V12H19V10H17V8H19Z" fill="#ffe4a0"/>
      : <><path d="M5 18V10H8V7H12V4H21V12H18V16H14V19H8V22H4V19Z" fill="#ffe4a0"/><path d="M7 19L17 9" stroke="#639176" strokeWidth="2"/></>}
  </svg>;
}

/** Hand-drawn architectural pixels, matching the town's warm stone and timber. */
export function HouseArt({ palette = 'ember', banner = 'sun' }: { palette?: HomeData['palette']; banner?: HomeData['banner'] }) {
  const c = HOME_COLORS[palette];
  const id = useId().replace(/:/g, '');
  return <svg className="house-art" viewBox="0 0 380 310" aria-hidden="true" shapeRendering="crispEdges">
    <defs>
      <pattern id={`roof-${id}`} width="24" height="14" patternUnits="userSpaceOnUse"><rect width="24" height="14" fill={c.roof}/><path d="M0 12H24M1 0V12M13 0V6" stroke={c.dark} strokeWidth="2"/><path d="M3 3H20" stroke={c.light} strokeWidth="2"/></pattern>
      <pattern id={`stone-${id}`} width="32" height="16" patternUnits="userSpaceOnUse"><rect width="32" height="16" fill="#ead6ad"/><path d="M0 15H32M16 0V15" stroke="#d0b88d" strokeWidth="2"/></pattern>
    </defs>
    <path d="M39 286H345V300H39Z" fill="#203b37" opacity=".45"/>
    <g className="home-smoke" fill="#d2c6c8"><path d="M274 31H286V19H280V8H270V17H266V25H274Z"/><path d="M284 3h13v-9h-13Z"/></g>
    <path d="M265 39V8H294V48" fill="#705455"/><path d="M262 8H297V16H262ZM269 22h20v4h-20ZM276 32h19v4h-19" fill="#ad7b65"/>
    <path d="M53 117H325V267H53Z" fill="#594449"/>
    <path d="M62 122H316V260H62Z" fill={`url(#stone-${id})`}/>
    <path d="M62 125H316V140H62Z" fill="#a78b6e"/>
    <path d="M51 109H329V120H51Z" fill="#362b3d"/>
    <path d="M50 88H61V76H76V64H90V52H107V40H275V52H291V64H306V76H320V88H335V103H349V115H31V103H50Z" fill={c.dark}/>
    <path d="M52 87H66V75H80V63H95V51H111V44H270V56H285V68H300V80H315V92H331V104H48V98H52Z" fill={`url(#roof-${id})`}/>
    <path d="M105 36H276V43H105ZM32 104H349V111H32Z" fill={c.light}/>
    <path d="M37 115H342V123H37Z" fill="#73514d"/>
    <path d="M42 121H337V125H42Z" fill="#d2a175"/>
    <path d="M174 51H206V82H174Z" fill="#6d4a4b"/><path d="M178 55H202V78H178Z" fill="#f6ce80"/><path d="M188 55H192V78H188ZM178 65H202V69H178Z" fill="#9f6a4d"/>
    <path d="M65 133H73V260H65ZM306 133H314V260H306ZM64 208H316V215H64Z" fill="#91654e"/>
    {[88, 248].map(x => <g key={x}>
      <path d={`M${x-6} 145h57v62h-57Z`} fill="#b58a60"/>
      <path d={`M${x} 148h44v51h-44Z`} fill="#57434a"/>
      <path d={`M${x+5} 153h34v40h-34Z`} fill="#ffd994" className="home-window"/>
      <path d={`M${x+5} 153h12v40h-12Z`} fill="#f3b56d"/>
      <path d={`M${x+19} 151h5v44h-5ZM${x+3} 171h38v5h-38Z`} fill="#9f704f"/>
      <path d={`M${x-5} 200h54v6h-54Z`} fill="#65444a"/>
      <path d={`M${x-3} 208h50v17h-50Z`} fill="#a46a4a"/>
      <path d={`M${x+1} 205v-9h8v7h8v-11h7v11h9v-8h8v10Z`} fill="#5d8c68"/>
      <path d={`M${x+5} 192h5v5h-5ZM${x+21} 189h6v6h-6ZM${x+36} 191h5v5h-5Z`} fill="#e9a3a4"/>
    </g>)}
    <path d="M163 153H218V264H163Z" fill="#947153"/>
    <path d="M169 159H212V264H169Z" fill="#5b3c43"/>
    <path d="M175 165H206V252H175Z" fill="#825348"/>
    <path d="M179 170H201V194H179ZM179 203H201V247H179Z" fill="#9d6951"/>
    <path d="M200 211h5v5h-5Z" fill="#ffe2a0"/>
    <path d="M164 139H218V149H164Z" fill="#835a48"/>
    <path d="M144 145h6v34h-6M227 145h6v34h-6" fill="#463846"/>
    {[138,221].map(x=><g key={x}><path d={`M${x} 158h18v25h-18Z`} fill="#60494a"/><path d={`M${x+4} 162h10v16h-10Z`} fill="#ffe6a4" className="home-window"/><path d={`M${x-2} 157h22v4h-22Z`} fill="#ad8154"/></g>)}
    <path d="M47 259H331V270H47Z" fill="#806551"/><path d="M47 259H331V263H47Z" fill="#ceb086"/>
    <path d="M142 269H240V279H142ZM131 279H251V290H131Z" fill="#bda680"/>
    <path d="M142 270H240V273H142ZM131 280H251V283H131Z" fill="#ebd4a7"/>
    <path d="M38 222H44V271H38ZM44 228H137V234H44ZM44 250H137V256H44ZM69 228H75V257H69ZM101 228H107V257H101ZM331 222H337V271H331ZM243 228H331V234H243ZM243 250H331V256H243ZM268 228H274V257H268ZM300 228H306V257H300Z" fill="#9d7858"/>
    <path d="M32 220H50V225H32ZM325 220H343V225H325Z" fill="#e2be83"/>
    <path d="M322 129H329V204H322Z" fill="#5b454b"/>
    <path className="home-banner" d="M326 136H362V193L344 184L326 193Z" fill={c.flag}/><path d="M326 136H362V141H326Z" fill="#eed18d"/>
    <g transform="translate(333 149) scale(.9)"><HomeEmblem kind={banner}/></g>
    <path d="M46 266H67V285H46ZM311 266H332V285H311Z" fill="#bb7e5b"/><path d="M42 264H71V270H42ZM307 264H336V270H307Z" fill="#deac79"/>
    <path d="M50 264V246H58V255H64V243H70V256H64V264ZM315 264V247H322V255H329V243H335V258H328V264Z" fill="#66916c"/>
  </svg>;
}

export type HomePropKind = 'mail' | 'chest' | 'dummy' | 'trophy' | 'sign';
export function HomeProp({ kind, active = false, open = false, count = 0 }: { kind: HomePropKind; active?: boolean; open?: boolean; count?: number }) {
  return <svg className={`home-prop-art prop-${kind}`} viewBox="0 0 120 112" aria-hidden="true" shapeRendering="crispEdges">
    <ellipse cx="61" cy="105" rx="38" ry="5" fill="#152e30" opacity=".35"/>
    {kind === 'mail' ? <>
      <path d="M55 52H66V106H55Z" fill="#80604b"/><path d="M56 58H60V101H56Z" fill="#c19a68"/>
      <path d="M27 20H81V26H92V36H97V64H24V31H27Z" fill="#454d61"/>
      <path d="M30 24H76V31H85V58H29Z" fill="#708599"/><path d="M78 31H90V60H78Z" fill="#333b50"/>
      <path d="M37 36H72V54H37Z" fill="#f0dfb8"/><path d="M38 37L54 46L70 37" stroke="#bbaa8c" strokeWidth="3" fill="none"/>
      <path d="M24 59H97V66H24Z" fill="#a5b4b2"/>
      <g transform={active ? undefined : 'rotate(90 83 39)'}><path d="M81 6H86V41H81Z" fill="#bf8966"/><path d="M85 6H107V20H85Z" fill="#e38d6a"/><path d="M88 8H105V11H88Z" fill="#ffd69c"/></g>
      <path d="M48 79H75V90H48Z" fill="#b39369"/>
    </> : kind === 'chest' ? <>
      {open && <path d="M28 13H93V44H28Z" fill="#795837"/>}
      <path d={open?'M25 14H96V21H25V44H32V21H89V44H96V14Z':'M28 39V30H36V24H87V30H95V39Z'} fill="#daa851"/>
      <path d={open?'M28 42H95V51H28Z':'M25 38H98V55H25Z'} fill="#a96e3d"/>
      <path d="M25 52H98V91H25Z" fill="#99613e"/><path d="M29 57H94V84H29Z" fill="#ba8050"/>
      <path d="M25 51H98V58H25ZM25 84H98V92H25ZM34 50H41V91H34ZM82 50H89V91H82Z" fill="#edbf64"/>
      <path d="M54 47H69V66H54Z" fill="#ffe39a"/><path d="M60 52H64V60H60Z" fill="#705044"/>
      {active && <g fill="#fff2b3" className="chest-sparks"><path d="M18 26h5v5h-5ZM101 41h5v5h-5ZM60 6h5v5h-5ZM13 72h4v4h-4Z"/></g>}
      {open && <path d="M38 43V37H51V31H63V38H78V43Z" fill="#ffe5a3"/>}
    </> : kind === 'dummy' ? <>
      <path d="M55 65H64V105H55ZM36 100H82V107H36Z" fill="#78533d"/>
      <path d="M40 35H78V74H40Z" fill="#c39a64"/><path d="M37 38H81V42H37ZM37 68H81V73H37Z" fill="#735947"/>
      <path d="M17 44H103V53H17Z" fill="#b68d58"/><path d="M19 44H25V56H19ZM95 44H101V56H95Z" fill="#dcc091"/>
      <path d="M46 11H73V16H78V33H73V39H46V33H41V16H46Z" fill="#d4b17c"/><path d="M46 24H73V28H46Z" fill="#8f6f51"/>
      <path d="M49 18h5v5h-5ZM65 18h5v5h-5Z" fill="#534342"/><path d="M51 45H69V62H51Z" fill="#b35e50"/><path d="M56 49H64V57H56Z" fill="#efc898"/>
      <path d="M29 53H40V57H29ZM81 53H94V57H81Z" fill="#65514a"/>
    </> : kind === 'trophy' ? <>
      <path d="M9 81H112V91H9ZM16 89H24V108H16ZM97 89H105V108H97Z" fill="#795a4b"/><path d="M8 77H113V83H8Z" fill="#c29a68"/>
      {[24,60,96].map((x,i)=><g key={i} opacity={i<count?1:.22} transform={`translate(${x} ${i===1?0:10})`}>
        <path d="M-10 29H10V47L5 54H-5L-10 47Z" fill={i===1?'#f4ca65':'#c3a97e'}/><path d="M-10 32H-18V44L-10 48M10 32H18V44L10 48" fill="none" stroke="#d5a955" strokeWidth="4"/>
        <path d="M-3 53H3V63H-3ZM-11 63H11V69H-11Z" fill="#ba8c4a"/><path d="M-7 32H-3V46H-7Z" fill="#fff0b6"/>
      </g>)}
      <path d="M49 87H72V97H49Z" fill="#d0ad73"/>
    </> : <>
      <path d="M53 45H64V108H53Z" fill="#8d654a"/><path d="M56 49H60V104H56Z" fill="#be9365"/>
      <path d="M12 24H93L111 42L93 60H12Z" fill="#62494a"/><path d="M17 29H91L104 42L91 55H17Z" fill="#bb9462"/><path d="M21 32H88V35H21Z" fill="#e0bc83"/>
      <path d="M63 39H81V34L92 43L81 51V46H63Z" fill="#f5ddac"/><path d="M23 39H49V44H23Z" fill="#614a44"/>
    </>}
  </svg>;
}

export const HOME_PLACES = {
  wide: { w:1200,h:780,house:[610,445],mail:[325,525],chest:[835,476],resident:[555,617],dummy:[935,672],trophy:[280,715],sign:[1080,752] },
  tall: { w:600,h:1120,house:[300,485],mail:[110,653],chest:[460,607],resident:[290,736],dummy:[465,890],trophy:[130,900],sign:[451,1080] },
};

function Tree({ x, y, size = 1, pink = false }: { x:number;y:number;size?:number;pink?:boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse cx="0" cy="0" rx="48" ry="13" fill="#1f3c3b" opacity=".3"/>
    <path d="M-9 -65H10V1H-9ZM-24 -65H-7V-39H-17V-48H-24Z" fill="#705440"/><path d="M-4 -56H3V-4H-4Z" fill="#a47c50"/>
    <path d="M-47 -35H-60V-73H-48V-98H-29V-113H9V-105H35V-91H51V-59H42V-38H17V-29H-28V-35Z" fill={pink?'#9a647d':'#315e51'}/>
    <path d="M-49 -69V-91H-30V-106H7V-99H32V-85H42V-64H19V-52H-17V-59H-36V-69Z" fill={pink?'#ce91a0':'#579377'}/>
    <path d="M-33 -86H-17V-96H5V-87H23V-80H-10V-72H-34Z" fill={pink?'#ecc1b5':'#88b286'}/>
    <path d="M-43 -49h14v5h-14ZM18 -44h15v5H18ZM27 -70h9v5h-9Z" fill={pink?'#e7b1ac':'#71a57d'}/>
  </g>;
}

export function HomeLandscape({ compact }: { compact: boolean }) {
  const l=HOME_PLACES[compact?'tall':'wide'];
  const id=useId().replace(/:/g,'');
  const road=compact?'M300 475V573L290 680V795L310 930L420 1025H600':'M610 430V500L555 580L610 675L750 730H1200';
  const pond=compact?{x:121,y:1030,s:.7}:{x:150,y:543,s:1};
  return <svg className="home-landscape" viewBox={`0 0 ${l.w} ${l.h}`} preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
    <defs><linearGradient id={`hs-${id}`} x2="0" y2="1"><stop stopColor="#3b3459"/><stop offset="1" stopColor="#b68c8c"/></linearGradient><linearGradient id={`hg-${id}`} x2="0" y2="1"><stop stopColor="#789980"/><stop offset="1" stopColor="#395b50"/></linearGradient><pattern id={`tuft-${id}`} width="37" height="31" patternUnits="userSpaceOnUse"><path d="M6 10v4h3v-7M27 25v-3h3v4" stroke="#93b18c" strokeWidth="2" opacity=".3"/></pattern><pattern id={`hp-${id}`} width="25" height="18" patternUnits="userSpaceOnUse"><rect width="25" height="18" fill="#c7b18e"/><path d="M0 1H25M0 17H25M12 2V17" stroke="#a28c70" strokeWidth="2"/><path d="M2 4H9M16 4H23" stroke="#e0cda7" strokeWidth="2"/></pattern></defs>
    <path d={`M0 0H${l.w}V${l.h}H0Z`} fill={`url(#hg-${id})`}/><path d={`M0 0H${l.w}V210H0Z`} fill={`url(#hs-${id})`}/>
    <path d={`M0 178L${l.w*.12} 115L${l.w*.22} 159L${l.w*.38} 94L${l.w*.53} 177L${l.w*.7} 110L${l.w*.86} 161L${l.w} 103V225H0Z`} fill="#625573"/>
    <path d={`M0 206L${l.w*.19} 163L${l.w*.37} 197L${l.w*.59} 156L${l.w*.82} 190L${l.w} 172V235H0Z`} fill="#4e726b"/>
    <path d={`M${l.w*.83} 58h33v5h5v29h-5v5h-33v-5h-5V63h5Z`} fill="#f7dfac"/>
    <path className="home-cloud" d={`M${l.w*.48} 40h30v-8h50v8h27v9h-107Z M${l.w*.08} 80h32v-7h44v7h26v8h-102Z`} fill="#dec5bc" opacity=".4"/>
    <path d={`M0 225Q${l.w*.25} 200 ${l.w*.5} 235T${l.w} 223V${l.h}H0Z`} fill={`url(#tuft-${id})`}/>
    {/* A low fence encloses the house, opening onto its front path. */}
    <g stroke="#adab86" strokeWidth="8"><path d={`M${compact?24:110} 344H${compact?100:395}M${compact?500:830} 344H${l.w-45}`} /><path d={`M${compact?24:110} 366H${compact?100:395}M${compact?500:830} 366H${l.w-45}`}/></g>
    {Array.from({length:compact?7:21},(_,i)=>{const x=compact?24+i*86:110+i*50;return x>l.house[0]-205&&x<l.house[0]+205?null:<path key={i} d={`M${x} 328h9v53h-9Z`} fill="#d0c4a1"/>;})}
    <path d={road} fill="none" stroke="#537364" strokeWidth="88" strokeLinejoin="round"/><path d={road} fill="none" stroke="#8e816b" strokeWidth="66" strokeLinejoin="round"/><path d={road} fill="none" stroke={`url(#hp-${id})`} strokeWidth="54" strokeLinejoin="round"/>
    <path d={compact?'M110 651H285M314 592H490':'M325 523H588M635 468H835'} fill="none" stroke="#a39477" strokeWidth="26"/><path d={compact?'M110 651H285M314 592H490':'M325 523H588M635 468H835'} fill="none" stroke={`url(#hp-${id})`} strokeWidth="19"/>
    <g transform={`translate(${pond.x} ${pond.y}) scale(${pond.s})`}>
      <path d="M-98 -28H-78V-48H-28V-58H30V-48H69V-32H91V-8H102V25H76V40H25V49H-33V40H-75V25H-98Z" fill="#8a9483"/>
      <path d="M-83 -24H-68V-39H-25V-47H27V-38H61V-24H80V-2H90V19H68V29H20V38H-26V29H-67V17H-83Z" fill="#397482"/>
      <path className="home-water" d="M-57 -20h46m25 12h45m-91 28h40m13 5h40" stroke="#89bbba" strokeWidth="3"/>
      <path d="M-60 2h20v8h-25V6h5ZM42 -27h20v8H37v-4h5Z" fill="#80a776"/><path d="M45 -31h9v6h-9" fill="#ebb5a7"/>
      <path d="M-89 20V-15h5v35M-99 22V-9h5v31M81 23V-9h5v32" stroke="#8d996e" strokeWidth="3"/>
    </g>
    <Tree x={compact?57:120} y={compact?340:360} size={compact?.85:1.6}/><Tree x={compact?550:1090} y={compact?395:403} size={compact?.8:1.2} pink/>
    {!compact&&<Tree x={60} y={750} size={1.2}/>}
    {/* A bench, stepping stones, little flower beds and lantern posts. */}
    <g transform={compact?'translate(54 513) scale(.7)':'translate(1015 472)'}><path d="M-38 -25H39V-17H-38ZM-38 -13H39V-5H-38ZM-42 1H43V10H-42ZM-31 10H-24V27H-31ZM25 10H32V27H25Z" fill="#b79465"/><path d="M-34 -29H-28V4H-34ZM29 -29H35V4H29Z" fill="#5a5150"/></g>
    {[compact?[47,757]:[375,620],compact?[550,973]:[1020,730]].map(([x,y],i)=><g key={i}><ellipse cx={x} cy={y-41} rx="28" ry="28" fill="#ffe0a1" opacity=".08"/><path d={`M${x-3} ${y-44}h6v51h-6Z`} fill="#4d484b"/><path d={`M${x-11} ${y-55}h22v20h-22Z`} fill="#5c5150"/><path d={`M${x-7} ${y-51}h14v12h-14Z`} fill="#ffe1a0"/></g>)}
    {Array.from({length:compact?34:55},(_,i)=>{const x=20+(i*137)%(l.w-40),y=387+(i*79)%(l.h-405);return <g key={i} opacity=".85"><path d={`M${x} ${y}v9m-3 -5h6`} stroke="#73a279" strokeWidth="2"/><path d={`M${x-2} ${y-2}h5v4h-5Z`} fill={['#f2d49d','#d89caa','#b4bec7'][i%3]}/></g>;})}
    <g className="home-butterfly" fill="#f5d3ab"><path d={compact?'M180 547h7v6h-7m9 -3h6v7h-6':'M210 441h7v6h-7m9 -3h6v7h-6'}/></g>
    <path className="home-leaf" d={compact?'M493 455h6v3h-6Z':'M1077 456h7v4h-7Z'} fill="#dcabb0"/>
  </svg>;
}
