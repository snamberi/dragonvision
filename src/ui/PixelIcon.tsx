export function PixelIcon({ kind, size = 24 }: { kind: string; size?: number }) {
 const paths: Record<string, string> = {
 coin: 'M5 2H11V3H13V5H14V11H13V13H11V14H5V13H3V11H2V5H3V3H5Z',
 gem: 'M4 2H12L15 6L8 15L1 6Z',
 spin: 'M6 1H10V5H14V9H10V13H6V9H2V5H6Z',
 shard: 'M8 1L13 5L11 12L6 15L3 10L5 4Z',
 home: 'M1 7L8 1L15 7H13V14H10V9H6V14H3V7Z',
 city: 'M1 14V6H5V2H10V8H14V14ZM7 4V6H8V4ZM3 8V10H4V8Z',
 inventory: 'M2 5H14V14H2ZM5 2H11V5H9V4H7V5H5Z',
 stages: 'M2 14V11H6V7H10V3H14V14Z',
 fighters: 'M5 1H11V7H5ZM3 9H13V15H3Z',
 attack: 'M2 2H5L13 10L14 14L10 13L2 5ZM1 10L5 14L7 12L3 8Z',
 guard: 'M2 2H14V8L11 12L8 15L5 12L2 8Z',
 charge: 'M8 1H13L9 6H13L4 15L6 9H2Z',
 orb: 'M6 1H10V2H12V3H13V4H14V6H15V10H14V12H13V13H12V14H10V15H6V14H4V13H3V12H2V10H1V6H2V4H3V3H4V2H6Z',
 settings: 'M7 1H9V3H11V2H12V4H14V5H13V7H15V9H13V11H14V12H12V14H11V13H9V15H7V13H5V14H4V12H2V11H3V9H1V7H3V5H2V4H4V2H5V3H7ZM6 6V10H10V6Z',
 news: 'M3 1H13V3H15V13H13V15H3V13H1V3H3ZM4 4V5H12V4ZM4 7V8H12V7ZM4 10V11H9V10Z',
 shop: 'M2 2H14L15 6H1ZM2 7H14V14H9V10H7V14H2Z',
 };
 const color = ({coin:'#ffcb4b',gem:'#58dfff',spin:'#c89bff',shard:'#88ffc8',orb:'#4ade80',settings:'#d8cfee',news:'#f4ecd8',shop:'#ffb35a'} as Record<string,string>)[kind] || '#e5c7ff';
 return <svg className={`pixel-icon icon-${kind}`} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges"><path d={paths[kind] || paths.spin} fill={color} stroke="#19132e" strokeWidth="1"/><path d={kind === 'coin' ? 'M6 5H10V6H8V10H10V11H6V10H7V6H6Z' : 'M5 4H9V5H6V7H4V5H5Z'} fill="#fff4cd"/><path d={kind === 'gem' ? 'M1 6H15M8 3L5 6L8 14L11 6Z' : 'M4 12H11V13H5Z'} fill="none" stroke="#362460" strokeOpacity=".45"/></svg>;
}
