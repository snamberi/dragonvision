import { useId } from 'react';
import { ARENAS, type Arena } from '../game/arenas';
import { ArenaProp, Lantern, isNightSky, propsFor } from './StageArt';

/** Shared pixel landscape: fixed seeded detail, no layout changes on render. Colors come from the arena. */
export function WorldScene({ city = false, arena = ARENAS.cliffs }: { city?: boolean; arena?: Arena }) {
 if (!city) return <BattleScene arena={arena} />;
 const a = arena;
 const sky = `${city ? 'city' : 'battle'}-sky-${a.id}`;
 const grass = `${city ? 'city' : 'battle'}-grass-${a.id}`;
 return <svg className="world-scene" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges">
 <defs><linearGradient id={sky} x2="0" y2="1"><stop stopColor={a.skyTop}/><stop offset="1" stopColor={a.skyBottom}/></linearGradient><linearGradient id={grass} x2="0" y2="1"><stop stopColor={a.groundTop}/><stop offset="1" stopColor={a.groundBottom}/></linearGradient></defs>
 <path fill={`url(#${sky})`} d="M0 0H1200V720H0Z"/>
 <path fill="#ffdfa8" d="M950 55H1010V65H1020V110H1010V120H950V110H940V65H950Z"/>
 {[0,1,2,3].map(i=><path key={i} className="world-cloud" fill="#e6ccd3" opacity=".35" transform={`translate(${i*330-50} ${35+(i%2)*45})`} d="M0 20H30V10H70V0H125V10H160V20H195V30H0Z"/>)}
 <path fill={a.far} d="M0 230L80 170L150 210L280 90L390 220L490 150L600 240L730 120L820 200L940 145L1070 240L1170 150L1200 175V390H0Z"/>
 <path fill="#b6a3b3" d="M245 128L280 90L325 144L280 128L266 143ZM699 155L730 120L772 163L735 150L721 164Z"/>
 <path fill={a.near} d="M0 270L130 205L210 260L350 210L470 300L600 210L710 285L890 225L1010 270L1140 215L1200 250V440H0Z"/>
 <path fill={`url(#${grass})`} d="M0 310L170 290L350 320L600 285L820 310L1000 290L1200 315V720H0Z"/>
 {city ? <><path fill="#294e6a" d="M1200 370L1075 400L1105 465L1010 520L1050 600L960 720H1200Z"/><path fill="none" stroke="#659ba1" strokeWidth="8" d="M1200 380L1090 410L1120 470L1025 525L1065 603L977 720"/><path fill="none" stroke="#777c79" strokeWidth="42" d="M130 720L245 525L410 455L660 400L870 320M410 455L510 650M660 400L820 550L1070 605M245 525L150 360"/><path fill="none" stroke="#b0a695" strokeWidth="30" strokeDasharray="18 3" d="M130 720L245 525L410 455L660 400L870 320M410 455L510 650M660 400L820 550L1070 605M245 525L150 360"/></> : <><path fill={a.floorEdge} d="M180 350H1020L1200 720H0Z"/><path fill={a.floor} d="M190 350H1010L1160 690H40Z"/>{[400,470,560,670].map(y=><path key={y} stroke="#787a80" strokeWidth="4" d={`M0 ${y}H1200`}/>)}{[-200,0,200,400,600,800,1000,1200,1400].map(x=><path key={x} stroke="#787a80" strokeWidth="3" d={`M${600+(x-600)*.5} 350L${x} 720`}/>)}<path fill="none" stroke={a.accent} strokeWidth="6" d="M600 435L790 535L600 635L410 535Z"/><path fill="none" stroke="#777d86" strokeWidth="3" d="M200 560L230 570L220 590L250 600M930 410L910 430L920 445"/></>}
 {Array.from({length:city?65:25},(_,i)=>{const x=(i*197+31)%1200,y=330+(i*83)%380;return <g key={i} opacity=".65"><path fill="#74947b" d={`M${x} ${y}h8v-5h3v8h-14v-4h3Z`}/>{city&&i%4===0&&<><path fill="#343044" d={`M${x} ${y}h7v-26h-7Z`}/><path fill="#294e50" d={`M${x-20} ${y-18}h46v-14h-7v-14h-9v-10h-14v10h-9v14h-7Z`}/><path fill="#508274" d={`M${x-15} ${y-34}h28v-8h-8v-9h-10v9h-10Z`}/></>}</g>})}
 </svg>;
}

/** Falling or drifting particles for the arena weather. */
export function WeatherLayer({ weather }: { weather: string }) {
 if (weather === 'clear') return null;
 return <div className={`weather weather-${weather}`} aria-hidden="true">{Array.from({length:28},(_,i)=><i key={i} style={{left:`${(i*37)%100}%`,animationDelay:`${(i*0.27)%3}s`,animationDuration:`${1.6+(i%5)*0.35}s`}}/>)}</div>;
}

/** Back-row scenery along the horizon: [x, ground y, scale]. The middle stays clear for the plaza. */
const HORIZON_PROPS: [number, number, number][] = [
  [-330, 380, 1.6], [-170, 350, 1.15], [-40, 336, 0.9], [100, 326, 0.7], [250, 318, 0.55], [352, 314, 0.45],
  [848, 314, 0.45], [950, 318, 0.55], [1100, 326, 0.7], [1240, 336, 0.9], [1370, 350, 1.15], [1530, 380, 1.6],
];

/**
 * A battle arena in Home's language: warm sky, two ridges, grass with tufts and flowers, a paved plaza with lanterns.
 * The art is 2000 wide around a 1200-wide core, so narrow fields crop the sides and wide fields still see the sky.
 */
function BattleScene({ arena: a }: { arena: Arena }) {
  const id = useId().replace(/:/g, '');
  const night = isNightSky(a);
  const kinds = propsFor(a);
  const rows = [372, 400, 436, 480, 534, 600, 680];
  const spokes = [-700, -400, -150, 50, 200, 350, 500, 600, 700, 850, 1000, 1150, 1350, 1600, 1900];
  const ridge = 'translate(-400 0) scale(1.6667 1)';
  return (
    <svg className="world-scene battle-scene" viewBox="-400 0 2000 720" preserveAspectRatio="xMidYMax slice" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <linearGradient id={`bs-sky-${id}`} x2="0" y2="1"><stop stopColor={a.skyTop} /><stop offset="1" stopColor={a.skyBottom} /></linearGradient>
        <linearGradient id={`bs-grass-${id}`} x2="0" y2="1"><stop stopColor={a.groundTop} /><stop offset="1" stopColor={a.groundBottom} /></linearGradient>
        <linearGradient id={`bs-floor-${id}`} x2="0" y2="1"><stop stopColor={a.floor} /><stop offset="1" stopColor={a.floorEdge} stopOpacity=".9" /></linearGradient>
        <pattern id={`bs-tuft-${id}`} width="37" height="31" patternUnits="userSpaceOnUse"><path d="M6 10v4h3v-7M27 25v-3h3v4" stroke="#ffffff" strokeWidth="2" opacity=".14" /></pattern>
      </defs>
      <path fill={`url(#bs-sky-${id})`} d="M-400 0H1600V720H-400Z" />
      {night ? (
        <>
          {Array.from({ length: 30 }, (_, i) => <path key={i} className="world-star" fill="#ffffff" opacity={0.4 + (i % 3) * 0.2} d={`M${((i * 157 + 40) % 2000) - 400} ${(i * 67) % 230 + 20}h4v4h-4Z`} />)}
          <path fill="#e8ecff" d="M950 55H1010V65H1020V110H1010V120H950V110H940V65H950Z" />
          <path fill={a.skyTop} opacity=".55" d="M975 60H1015V72H1020V102H1012V112H985V104H972V88H975Z" />
        </>
      ) : (
        <path fill="#f7dfac" d="M950 55H1010V65H1020V110H1010V120H950V110H940V65H950Z" />
      )}
      {[0, 1, 2, 3].map((i) => <path key={i} className="world-cloud" fill="#dec5bc" opacity=".38" transform={`translate(${i * 520 - 360} ${40 + (i % 2) * 50})`} d="M0 20H30V10H70V0H125V10H160V20H195V30H0Z" />)}
      <g transform={ridge}>
        <path fill={a.far} d="M0 230L80 170L150 210L280 90L390 220L490 150L600 240L730 120L820 200L940 145L1070 240L1170 150L1200 175V390H0Z" />
        <path fill="#ffffff" opacity=".3" d="M245 128L280 90L325 144L280 128L266 143ZM699 155L730 120L772 163L735 150L721 164Z" />
        <path fill={a.near} d="M0 270L130 205L210 260L350 210L470 300L600 210L710 285L890 225L1010 270L1140 215L1200 250V440H0Z" />
      </g>
      <path fill={`url(#bs-grass-${id})`} d="M-400 300Q100 282 600 300T1600 296V720H-400Z" />
      <path fill={`url(#bs-tuft-${id})`} d="M-400 300Q100 282 600 300T1600 296V720H-400Z" />
      {HORIZON_PROPS.map(([x, y, sc], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${sc})`}><ArenaProp kind={kinds[i % kinds.length]} arena={a} /></g>
      ))}
      {/* The plaza: a rim, warm paving with perspective joints, and the arena's emblem. */}
      <path fill="#000000" opacity=".22" d="M150 356H1050L1540 720H-340Z" />
      <path fill={a.floorEdge} d="M160 350H1040L1520 720H-320Z" />
      <path fill={`url(#bs-floor-${id})`} d="M176 358H1024L1490 720H-290Z" />
      {rows.map((y) => <path key={y} stroke={a.floorEdge} strokeWidth="3" opacity=".55" d={`M-400 ${y}H1600`} />)}
      {spokes.map((x) => <path key={x} stroke={a.floorEdge} strokeWidth="3" opacity=".45" d={`M${600 + (x - 600) * 0.3} 358L${x} 720`} />)}
      {rows.map((y, i) => <path key={`h${y}`} stroke="#ffffff" strokeWidth="2" opacity=".14" d={`M${120 + i * 40} ${y + 3}h120M${780 - i * 30} ${y + 3}h140`} />)}
      <path fill="none" stroke={a.accent} strokeWidth="6" d="M600 440L790 530L600 620L410 530Z" />
      <path fill="none" stroke={a.accent} strokeWidth="3" opacity=".5" d="M600 466L736 530L600 594L464 530Z" />
      {/* Lanterns at the plaza's back corners. */}
      {[176, 1024].map((x) => <g key={x} transform={`translate(${x} 356) scale(1.25)`}><Lantern /></g>)}
      {/* Flowers on the grass beyond the plaza. */}
      {Array.from({ length: 24 }, (_, i) => {
        const left = i % 2 === 0;
        const y = 380 + ((i * 53) % 320);
        const spread = (y - 350) * 1.3;
        const x = left ? 140 - spread - ((i * 37) % 140) : 1060 + spread + ((i * 41) % 140);
        return <g key={i} opacity=".85"><path d={`M${x} ${y}v9m-3 -5h6`} stroke="#73a279" strokeWidth="2" /><path d={`M${x - 2} ${y - 2}h5v4h-5Z`} fill={night ? a.accent : ['#f2d49d', '#d89caa', '#b4bec7'][i % 3]} /></g>;
      })}
    </svg>
  );
}
