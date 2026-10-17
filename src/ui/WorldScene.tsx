/** Shared pixel landscape: fixed seeded detail, no layout changes on render. */
export function WorldScene({ city = false }: { city?: boolean }) {
 return <svg className="world-scene" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges">
 <defs><linearGradient id={city?'city-sky':'battle-sky'} x2="0" y2="1"><stop stopColor="#353563"/><stop offset="1" stopColor="#dc9f99"/></linearGradient><linearGradient id={city?'city-grass':'battle-grass'} x2="0" y2="1"><stop stopColor="#598477"/><stop offset="1" stopColor="#253e4d"/></linearGradient></defs>
 <path fill={`url(#${city?'city-sky':'battle-sky'})`} d="M0 0H1200V720H0Z"/>
 <path fill="#ffdfa8" d="M950 55H1010V65H1020V110H1010V120H950V110H940V65H950Z"/>
 {[0,1,2,3].map(i=><path key={i} className="world-cloud" fill="#e6ccd3" opacity=".35" transform={`translate(${i*330-50} ${35+(i%2)*45})`} d="M0 20H30V10H70V0H125V10H160V20H195V30H0Z"/>)}
 <path fill="#575379" d="M0 230L80 170L150 210L280 90L390 220L490 150L600 240L730 120L820 200L940 145L1070 240L1170 150L1200 175V390H0Z"/>
 <path fill="#b6a3b3" d="M245 128L280 90L325 144L280 128L266 143ZM699 155L730 120L772 163L735 150L721 164Z"/>
 <path fill="#466278" d="M0 270L130 205L210 260L350 210L470 300L600 210L710 285L890 225L1010 270L1140 215L1200 250V440H0Z"/>
 <path fill={`url(#${city?'city-grass':'battle-grass'})`} d="M0 310L170 290L350 320L600 285L820 310L1000 290L1200 315V720H0Z"/>
 {city ? <><path fill="#294e6a" d="M1200 370L1075 400L1105 465L1010 520L1050 600L960 720H1200Z"/><path fill="none" stroke="#659ba1" strokeWidth="8" d="M1200 380L1090 410L1120 470L1025 525L1065 603L977 720"/><path fill="none" stroke="#777c79" strokeWidth="42" d="M130 720L245 525L410 455L660 400L870 320M410 455L510 650M660 400L820 550L1070 605M245 525L150 360"/><path fill="none" stroke="#b0a695" strokeWidth="30" strokeDasharray="18 3" d="M130 720L245 525L410 455L660 400L870 320M410 455L510 650M660 400L820 550L1070 605M245 525L150 360"/></> : <><path fill="#8d8d8c" d="M180 350H1020L1200 720H0Z"/><path fill="#b3aca0" d="M190 350H1010L1160 690H40Z"/>{[400,470,560,670].map(y=><path key={y} stroke="#787a80" strokeWidth="4" d={`M0 ${y}H1200`}/>)}{[-200,0,200,400,600,800,1000,1200,1400].map(x=><path key={x} stroke="#787a80" strokeWidth="3" d={`M${600+(x-600)*.5} 350L${x} 720`}/>)}<path fill="none" stroke="#d7c99e" strokeWidth="6" d="M600 435L790 535L600 635L410 535Z"/><path fill="none" stroke="#777d86" strokeWidth="3" d="M200 560L230 570L220 590L250 600M930 410L910 430L920 445"/></>}
 {Array.from({length:city?65:25},(_,i)=>{const x=(i*197+31)%1200,y=330+(i*83)%380;return <g key={i} opacity=".65"><path fill="#74947b" d={`M${x} ${y}h8v-5h3v8h-14v-4h3Z`}/>{city&&i%4===0&&<><path fill="#343044" d={`M${x} ${y}h7v-26h-7Z`}/><path fill="#294e50" d={`M${x-20} ${y-18}h46v-14h-7v-14h-9v-10h-14v10h-9v14h-7Z`}/><path fill="#508274" d={`M${x-15} ${y-34}h28v-8h-8v-9h-10v9h-10Z`}/></>}</g>})}
 </svg>;
}
