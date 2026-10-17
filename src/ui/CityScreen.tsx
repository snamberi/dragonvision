import { useEffect, useState } from 'react';
import { shopUrl, armoryUrl, boardUrl, colosseumUrl, dojoUrl, gateUrl, hallUrl, gravityUrl, labUrl, portUrl, shrineUrl, tentUrl, towerUrl } from '../art/buildings';
import { ACHIEVEMENTS, achievementState } from '../game/achievements';
import { BOUNTIES, bountyProgress } from '../game/bounty';
import { attemptsLeft, bossProgress } from '../game/worldBoss';
import { dojoProgress } from '../game/dojo';
import { expeditionDone } from '../game/expedition';
import { fortuneReady } from '../game/fortune';
import { spareUnits } from '../game/fusion';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';

/** The Shop has stock you haven't bought from today. */
function marketFresh(save: SaveData): boolean {
  return save.market.day !== dayKey() || save.market.bought.length === 0;
}

export type Building = 'shop' | 'summon' | 'dojo' | 'fusion' | 'gravity' | 'port' | 'bounty' | 'fortune' | 'tower' | 'armory' | 'colosseum' | 'gate' | 'hall';

interface Props {
  save: SaveData;
  onOpen: (building: Building) => void;
}

export function CityScreen({ save, onOpen }: Props) {
  const now = Date.now();
  const dojoReady = save.dojo.reduce((sum, slot) => sum + dojoProgress(save, slot, now).ready, 0);
  const spares = spareUnits(save).length;
  const tripsBack = save.expeditions.filter((e) => expeditionDone(e, now)).length;
  const bountiesReady = BOUNTIES.filter((b) => {
    const p = bountyProgress(save, b);
    return !p.claimed && p.done >= b.goal;
  }).length;

  const achievementsReady = ACHIEVEMENTS.filter((a) => {
    const st = achievementState(save, a);
    return st.complete && !st.claimed;
  }).length;

  const buildings: { id: Building; name: string; art: string; badge?: string }[] = [
    { id: 'summon', name: 'Summoning Shrine', art: shrineUrl(), badge: save.spins > 0 ? `${save.spins} ORBS` : undefined },
    { id: 'shop', name: 'Shop', art: shopUrl(), badge: marketFresh(save) ? 'NEW' : undefined },
    { id: 'fortune', name: 'Fortune Teller', art: tentUrl(), badge: fortuneReady(save) ? 'FREE' : undefined },
    { id: 'dojo', name: 'Training Dojo', art: dojoUrl(), badge: dojoReady > 0 ? `+${dojoReady} LV` : undefined },
    { id: 'fusion', name: 'Fusion Lab', art: labUrl(), badge: spares > 0 ? `${spares} SPARE` : undefined },
    { id: 'gravity', name: 'Gravity Chamber', art: gravityUrl() },
    { id: 'port', name: 'Expedition Port', art: portUrl(), badge: tripsBack > 0 ? `${tripsBack} BACK` : undefined },
    { id: 'bounty', name: 'Bounty Board', art: boardUrl(), badge: bountiesReady > 0 ? `${bountiesReady} DONE` : undefined },
    { id: 'armory', name: 'Armory', art: armoryUrl() },
    { id: 'colosseum', name: 'Colosseum', art: colosseumUrl(), badge: attemptsLeft(save) > 0 && bossProgress(save) < 1 ? 'BOSS' : undefined },
    { id: 'gate', name: 'Survival Gate', art: gateUrl(), badge: save.survivalBest > 0 ? `BEST ${save.survivalBest}` : undefined },
    { id: 'hall', name: 'Hall of Legends', art: hallUrl(), badge: achievementsReady > 0 ? `${achievementsReady} NEW` : undefined },
    { id: 'tower', name: 'Rival Tower', art: towerUrl(), badge: save.towerFloor > 0 ? `${save.towerFloor}F` : undefined },
  ];

  const layout = useCityLayout();
  const byId = new Map(buildings.map((b) => [b.id, b]));

  return (
    <div className="city">
      <div className={`city-map ${layout.id}`} style={{ aspectRatio: `${layout.w} / ${layout.h}` }}>
        <CityGround layout={layout} />
        <div className="city-location">
          <span>VISION CITY</span>
          <small>THE HIGHLAND SANCTUARY</small>
        </div>
        {layout.plots.map((plot) => {
          const b = byId.get(plot.id);
          if (!b) return null;
          return (
            <button
              key={b.id}
              data-building={b.id}
              className={`building ${b.badge ? 'ready' : ''} ${plot.id === 'summon' ? 'main' : ''}`}
              style={{ left: `${(plot.x / layout.w) * 100}%`, top: `${((plot.y - SPUR) / layout.h) * 100}%`, width: `${(layout.plotW / layout.w) * 100}%` }}
              onClick={() => onOpen(b.id)}
            >
              <img className="building-art" src={b.art} alt="" draggable={false} />
              <span className="building-name">{b.name}</span>
              {b.badge && <span className="badge">{b.badge}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Town plan ---
// Buildings stand on terraced streets; every building has a short path down to its street, and the streets are joined,
// so the roads always connect. Wide screens get a landscape plan, phones a tall switchback plan.

/** Length of the path from a building's door down to its street. */
const SPUR = 26;

interface Plot {
  id: Building;
  x: number;
  /** The street this building stands on. */
  y: number;
}

interface Layout {
  id: 'wide' | 'tall';
  w: number;
  h: number;
  /** Building width in map units. */
  plotW: number;
  plots: Plot[];
  /** Road polylines (main streets and connectors). */
  roads: [number, number][][];
  plaza: { x: number; y: number; r: number };
  /** Sea in the bottom-right corner, by the port. */
  sea: [number, number][];
}

const WIDE: Layout = {
  id: 'wide',
  w: 1200,
  h: 780,
  plotW: 150,
  plots: [
    { id: 'hall', x: 190, y: 270 },
    { id: 'colosseum', x: 400, y: 270 },
    { id: 'tower', x: 830, y: 270 },
    { id: 'gate', x: 1030, y: 270 },
    { id: 'fortune', x: 130, y: 500 },
    { id: 'shop', x: 290, y: 500 },
    { id: 'armory', x: 450, y: 500 },
    { id: 'summon', x: 620, y: 500 },
    { id: 'fusion', x: 800, y: 500 },
    { id: 'dojo', x: 970, y: 500 },
    { id: 'bounty', x: 250, y: 720 },
    { id: 'gravity', x: 470, y: 720 },
    { id: 'port', x: 900, y: 720 },
  ],
  roads: [
    [[110, 270], [1110, 270]],
    [[30, 500], [1170, 500]],
    [[150, 720], [1040, 720]],
    [[620, 270], [620, 720]],
    [[110, 270], [80, 330], [80, 500]],
    [[1110, 270], [1140, 380], [1140, 500]],
    [[150, 720], [110, 640], [110, 500]],
  ],
  plaza: { x: 620, y: 500, r: 54 },
  sea: [[1000, 780], [1050, 735], [1100, 728], [1150, 700], [1200, 690], [1200, 780]],
};

const TALL_ROWS: [Building, Building | null][] = [
  ['summon', null],
  ['shop', 'armory'],
  ['fortune', 'fusion'],
  ['dojo', 'gravity'],
  ['hall', 'colosseum'],
  ['tower', 'gate'],
  ['bounty', 'port'],
];
const TALL_TOP = 370;
const TALL_ROW = 255;

const TALL: Layout = {
  id: 'tall',
  w: 600,
  h: TALL_TOP + TALL_ROW * (TALL_ROWS.length - 1) + 110,
  plotW: 200,
  plots: TALL_ROWS.flatMap(([a, b], i) => {
    const y = TALL_TOP + i * TALL_ROW;
    return b ? [{ id: a, x: 160, y }, { id: b, x: 440, y }] : [{ id: a, x: 300, y }];
  }),
  // One street per row, joined at alternating ends like a switchback path down the hill.
  roads: TALL_ROWS.flatMap((_, i) => {
    const y = TALL_TOP + i * TALL_ROW;
    const street: [number, number][] = [[50, y], [550, y]];
    if (i === TALL_ROWS.length - 1) return [street];
    const x = i % 2 === 0 ? 550 : 50;
    return [street, [[x, y], [x, y + TALL_ROW]] as [number, number][]];
  }),
  plaza: { x: 300, y: TALL_TOP, r: 46 },
  sea: [[330, 9999], [380, 1888], [460, 1872], [540, 1850], [600, 1840], [600, 9999]],
};
TALL.sea = TALL.sea.map(([x, y]) => [x, Math.min(y, TALL.h)]);

function useCityLayout(): Layout {
  const query = '(max-width: 700px)';
  const [tall, setTall] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setTall(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return tall ? TALL : WIDE;
}

/** Small deterministic noise so trees and flowers land in the same places every time. */
function noise(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function nearRoad(layout: Layout, x: number, y: number, gap: number): boolean {
  return layout.roads.some((line) =>
    line.slice(1).some(([x2, y2], i) => {
      const [x1, y1] = line[i];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
      return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) < gap;
    }),
  );
}

function onPlot(layout: Layout, x: number, y: number): boolean {
  return layout.plots.some((p) => Math.abs(x - p.x) < layout.plotW * 0.62 && y > p.y - (layout.id === 'tall' ? 215 : 185) && y < p.y + 14);
}

function decorFor(layout: Layout): { trees: [number, number, number][]; flowers: [number, number][]; lamps: [number, number][] } {
  const trees: [number, number, number][] = [];
  const flowers: [number, number][] = [];
  const skyLine = layout.id === 'wide' ? 120 : 110;
  for (let i = 0; i < 260 && trees.length < (layout.id === 'wide' ? 34 : 30); i++) {
    const x = 20 + noise(i) * (layout.w - 40);
    const y = skyLine + 30 + noise(i + 500) * (layout.h - skyLine - 50);
    if (nearRoad(layout, x, y, 36) || nearRoad(layout, x, y - 40, 30) || onPlot(layout, x, y) || Math.hypot(x - layout.plaza.x, y - layout.plaza.y) < layout.plaza.r + 30) continue;
    if (layout.sea.length && x > layout.sea[0][0] - 20 && y > layout.sea[layout.sea.length - 2][1] - 20) continue;
    if (trees.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 46)) continue;
    trees.push([x, y, 0.8 + noise(i + 900) * 0.5]);
  }
  for (let i = 0; i < 400 && flowers.length < 40; i++) {
    const x = 10 + noise(i + 2000) * (layout.w - 20);
    const y = skyLine + 20 + noise(i + 2600) * (layout.h - skyLine - 30);
    if (!nearRoad(layout, x, y, 22) && !onPlot(layout, x, y)) flowers.push([x, y]);
  }
  // Lamps line the main street on both sides of the plaza.
  const lamps: [number, number][] = [];
  const main = layout.plaza.y;
  for (let x = 90; x < layout.w - 60; x += layout.id === 'wide' ? 160 : 250) {
    if (Math.abs(x - layout.plaza.x) > layout.plaza.r + 30) lamps.push([x + 40, main + 26]);
  }
  return { trees, flowers, lamps };
}

function CityGround({ layout }: { layout: Layout }) {
  const { w, h, plaza } = layout;
  const { trees, flowers, lamps } = decorFor(layout);
  const sky = layout.id === 'wide' ? 130 : 120;
  const spurs = layout.plots.map((p) => `M${p.x} ${p.y - SPUR - 4}V${p.y}`).join('');
  const roadPath = layout.roads.map((line) => `M${line.map(([x, y]) => `${x} ${y}`).join('L')}`).join('');
  return (
    <svg className="city-ground" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <linearGradient id="city-sky" x2="0" y2="1">
          <stop stopColor="#2a2350" />
          <stop offset="1" stopColor="#8a6a8f" />
        </linearGradient>
        <linearGradient id="city-grass" x2="0" y2="1">
          <stop stopColor="#4f7a5a" />
          <stop offset="1" stopColor="#36584a" />
        </linearGradient>
        <pattern id="city-tufts" width="24" height="18" patternUnits="userSpaceOnUse">
          <rect x="3" y="4" width="2" height="2" fill="#5f8c66" />
          <rect x="15" y="12" width="2" height="2" fill="#2f4f40" />
          <rect x="9" y="9" width="1" height="2" fill="#6a9a6e" />
        </pattern>
        <pattern id="city-cobble" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#c9b48e" />
          <rect x="0" y="0" width="7" height="7" fill="#d6c39c" />
          <rect x="8" y="8" width="7" height="7" fill="#bba582" />
          <rect x="9" y="1" width="6" height="5" fill="#cdb993" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill="url(#city-grass)" />
      <rect width={w} height={h} fill="url(#city-tufts)" />
      {/* Sky and far mountains behind the top terrace. */}
      <rect width={w} height={sky} fill="url(#city-sky)" />
      <path
        d={`M0 ${sky}L${w * 0.08} ${sky - 50}L${w * 0.17} ${sky - 18}L${w * 0.3} ${sky - 78}L${w * 0.42} ${sky - 26}L${w * 0.55} ${sky - 64}L${w * 0.68} ${sky - 20}L${w * 0.8} ${sky - 72}L${w * 0.92} ${sky - 30}L${w} ${sky - 54}V${sky}Z`}
        fill="#4a3f6e"
      />
      <path d={`M0 ${sky}L${w * 0.2} ${sky - 26}L${w * 0.36} ${sky - 8}L${w * 0.6} ${sky - 30}L${w * 0.78} ${sky - 6}L${w} ${sky - 24}V${sky + 10}H0Z`} fill="#3f6150" />
      <rect x={w * 0.82} y={sky * 0.22} width="34" height="34" fill="#ffe6b3" />
      <rect x={w * 0.1} y={sky * 0.3} width="90" height="10" fill="#5a4a7a" />
      <rect x={w * 0.5} y={sky * 0.18} width="120" height="10" fill="#5a4a7a" />
      {/* Sea by the port. */}
      <path d={`M${layout.sea.map(([x, y]) => `${x} ${y}`).join('L')}Z`} fill="#2f6f8f" />
      <path d={`M${layout.sea.map(([x, y]) => `${x} ${y + 6}`).join('L')}`} fill="none" stroke="#7fc6d8" strokeWidth="3" />
      {/* Roads: dark curb, cobbles, then the paths to each door. */}
      <path d={roadPath} fill="none" stroke="#5c4a3a" strokeWidth="40" strokeLinejoin="round" strokeLinecap="round" />
      <path d={spurs} fill="none" stroke="#5c4a3a" strokeWidth="26" />
      <path d={roadPath} fill="none" stroke="url(#city-cobble)" strokeWidth="32" strokeLinejoin="round" strokeLinecap="round" />
      <path d={spurs} fill="none" stroke="url(#city-cobble)" strokeWidth="18" />
      {/* Central plaza and fountain. */}
      <circle cx={plaza.x} cy={plaza.y} r={plaza.r + 5} fill="#5c4a3a" />
      <circle cx={plaza.x} cy={plaza.y} r={plaza.r} fill="url(#city-cobble)" />
      <circle cx={plaza.x} cy={plaza.y} r={plaza.r * 0.45} fill="#8f8aa8" />
      <circle cx={plaza.x} cy={plaza.y} r={plaza.r * 0.34} fill="#3f9fd0" />
      <rect x={plaza.x - 3} y={plaza.y - 16} width="6" height="16" fill="#e9fbff" />
      {flowers.map(([x, y], i) => (
        <rect key={`f${i}`} x={x} y={y} width="4" height="4" fill={['#ffd23f', '#ff8fbf', '#f4ecd8', '#b794ff'][i % 4]} />
      ))}
      {lamps.map(([x, y], i) => (
        <g key={`l${i}`}>
          <rect x={x - 2} y={y - 30} width="4" height="30" fill="#2a2240" />
          <rect x={x - 6} y={y - 38} width="12" height="10" fill="#ffd36b" />
        </g>
      ))}
      {trees.map(([x, y, s], i) => (
        <g key={`t${i}`} transform={`translate(${x} ${y}) scale(${s})`}>
          <rect x="-12" y="2" width="24" height="5" fill="#00000033" />
          <rect x="-3" y="-8" width="6" height="12" fill="#5a3a22" />
          <path d="M-14 -6L0 -34L14 -6Z" fill="#2f5a3f" />
          <path d="M-10 -18L0 -42L10 -18Z" fill="#3f7350" />
        </g>
      ))}
    </svg>
  );
}
