/** Crisp, deterministic pixel scenery with no external image dependencies. */
export function PixelBackdrop({room = false}: {room?: boolean}) {
 return <svg viewBox="0 0 960 280" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" aria-hidden="true">
 <rect width="960" height="280" fill={room?'#241e35':'#171d38'}/>
 {room ? <>
 {Array.from({length:12},(_,y)=>Array.from({length:25},(_,x)=><rect key={`${x}-${y}`} x={x*42-(y%2)*21} y={y*22} width="40" height="20" fill={(x+y)%4===0?'#3d3444':'#302938'}/>))}
 <path d="M0 225H960V280H0Z" fill="#4d3540"/>
 {[80,390,700].map(x=><g key={x}><rect x={x} y="30" width="180" height="190" fill="#171c2c"/><rect x={x+8} y="38" width="164" height="170" fill="#293247"/>{[85,145,205].map((y,i)=><g key={y}><rect x={x-8} y={y} width="196" height="10" fill="#996b4f"/><rect x={x-8} y={y+10} width="196" height="5" fill="#4d3331"/>{[20,65,115].map((a,j)=><g key={a}><rect x={x+a} y={y-28} width="28" height="27" fill={['#6c7c9b','#92714b','#63658c'][(i+j)%3]}/><rect x={x+a+4} y={y-24} width="20" height="4" fill="#c1ae7e"/><rect x={x+a+11} y={y-14} width="6" height="8" fill="#f9d373"/></g>)}</g>)}</g>)}
 {[32,315,625,920].map(x=><g key={x}><rect x={x} y="0" width="8" height="58" fill="#6c4f3e"/><rect x={x-7} y="58" width="22" height="32" fill="#b4814b"/><rect x={x-3} y="62" width="14" height="23" fill="#ffe2a0"/></g>)}
 </> : <>
 {Array.from({length:40},(_,i)=><rect key={i} x={(i*137)%960} y={(i*47)%130} width={i%4===0?3:2} height="2" fill="#b9b6c9" opacity=".5"/>)}
 <path d="M0 180V138H45V110H85V80H120V110H155V145H200V90H250V55H280V95H310V145H390V120H420V80H460V45H490V85H525V135H600V105H640V65H680V100H720V130H790V90H830V50H865V100H910V140H960V280H0Z" fill="#343952"/>
 <path d="M0 215V175H70V155H140V195H225V165H295V135H345V185H420V155H470V190H560V145H635V175H700V150H780V180H860V145H920V185H960V280H0Z" fill="#242d42"/>
 {Array.from({length:28},(_,i)=><g key={i} transform={`translate(${i*37} ${205+(i%3)*12})`}><rect x="8" y="0" width="8" height="55" fill="#253537"/><path d="M0 28V15H5V5H11V-6H17V5H23V15H28V28Z" fill="#354e49"/></g>)}
 <path d="M0 257H960V280H0Z" fill="#1b2735"/>
 </>}
 </svg>;
}
