import { type CSSProperties, type ReactNode, useEffect, useId, useState } from 'react';
import { shopUrl, armoryUrl, boardUrl, colosseumUrl, dojoUrl, gateUrl, hallUrl, gravityUrl, labUrl, portUrl, shrineUrl, tentUrl, towerUrl, upgradesHouseUrl } from '../art/buildings';
import { ACHIEVEMENTS, achievementState } from '../game/achievements';
import { BOUNTIES, bountyProgress } from '../game/bounty';
import { attemptsLeft, bossProgress } from '../game/worldBoss';
import { dojoProgress } from '../game/dojo';
import { expeditionDone } from '../game/expedition';
import { fortuneReady } from '../game/fortune';
import { spareUnits } from '../game/fusion';
import { dayKey } from '../game/time';
import { EVENT_STAGES, currentEvent, eventProgress, eventTimeLeft, formatTimeLeft } from '../game/events';
import type { SaveData } from '../game/types';
import { type PendingKey, pendingBadges } from '../game/collect';
import { Tree } from './HomeArt';

/** The Shop has stock you haven't bought from today. */
function marketFresh(save: SaveData): boolean {
  return save.market.day !== dayKey() || save.market.bought.length === 0;
}

export type Building = 'shop' | 'summon' | 'dojo' | 'fusion' | 'gravity' | 'port' | 'bounty' | 'fortune' | 'tower' | 'armory' | 'colosseum' | 'gate' | 'hall' | 'upgrades' | 'dungeon' | 'raid' | 'climb' | 'journal' | 'event';

interface Props {
  save: SaveData;
  onOpen: (building: Building) => void;
}

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

const DAWN_HOUR = 5;
const DAY_HOUR = 8;
const DUSK_HOUR = 17;
const NIGHT_HOUR = 20;
const PHASE_REFRESH_MS = 300_000;
const COMPACT_QUERY = '(max-width: 700px)';

/** The city's light follows the player's own clock. */
export function dayPhase(hour: number): DayPhase {
  if (hour >= NIGHT_HOUR || hour < DAWN_HOUR) return 'night';
  if (hour < DAY_HOUR) return 'dawn';
  return hour < DUSK_HOUR ? 'day' : 'dusk';
}

function useDayPhase(): DayPhase {
  const [phase, setPhase] = useState(() => dayPhase(new Date().getHours()));
  useEffect(() => {
    const timer = setInterval(() => setPhase(dayPhase(new Date().getHours())), PHASE_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  return phase;
}

function useCompact(): boolean {
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(COMPACT_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const onChange = () => setCompact(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return compact;
}

const PHASE_TEXT: Record<DayPhase, { label: string; line: string }> = {
  dawn: { label: 'DAWN', line: 'The bakers are up and the shrine bells are ringing.' },
  day: { label: 'MIDDAY', line: 'Every street is open. Where to first?' },
  dusk: { label: 'DUSK', line: 'Lanterns are coming on along the high street.' },
  night: { label: 'NIGHT', line: 'The city sleeps, but its doors never close.' },
};

interface Spot {
  id: Building;
  name: string;
  art: string;
  badge?: string;
}

interface District {
  id: string;
  eyebrow: string;
  title: string;
  line: string;
  accent: string;
  water?: boolean;
  ids: Building[];
}

const DISTRICTS: District[] = [
  { id: 'market', eyebrow: 'TRADE & MAGIC', title: 'Market Row', line: 'Gear up, trade spares and hear your fortune.', accent: '#e0a65a', ids: ['shop', 'armory', 'fusion', 'fortune', 'upgrades'] },
  { id: 'training', eyebrow: 'GROW STRONGER', title: 'Training Grounds', line: 'Train, take bounties and record your legend.', accent: '#7fb88a', ids: ['dojo', 'gravity', 'bounty', 'hall', 'journal'] },
  { id: 'arena', eyebrow: 'PROVE YOURSELF', title: 'Arena Quarter', line: 'Rivals, bosses and the endless climb.', accent: '#d9736b', ids: ['colosseum', 'tower', 'gate', 'climb'] },
  { id: 'harbor', eyebrow: 'VENTURE OUT', title: 'Harbor & Depths', line: 'Send expeditions, delve dungeons, raid giants.', accent: '#6fb0c8', water: true, ids: ['port', 'dungeon', 'raid'] },
];

export function CityScreen({ save, onOpen }: Props) {
  const now = Date.now();
  const phase = useDayPhase();
  const compact = useCompact();
  const ev = currentEvent();
  const evProgress = eventProgress(save);
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

  const spots: Spot[] = [
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
    { id: 'upgrades', name: 'Upgrades House', art: upgradesHouseUrl() },
    { id: 'dungeon', name: 'Daily Dungeon', art: dojoUrl(), badge: save.dungeon?.cleared === false && (save.dungeon?.attempts ?? 0) > 0 ? 'OPEN' : undefined },
    { id: 'raid', name: 'Boss Raid', art: colosseumUrl(), badge: save.raid?.totalDamage ? `${(save.raid.totalDamage / 1000).toFixed(0)}K` : undefined },
    { id: 'climb', name: 'Infinite Climb', art: towerUrl(), badge: save.climbBest ? `BEST ${save.climbBest}` : undefined },
    { id: 'journal', name: "Collector's Journal", art: hallUrl() },
    { id: 'event', name: ev.name, art: tentUrl(), badge: evProgress.cleared < EVENT_STAGES ? `${formatTimeLeft(eventTimeLeft())} LEFT` : `${evProgress.currency} TOKENS` },
  ];
  const byId = new Map(spots.map((s) => [s.id, s]));
  const pending = pendingBadges(save);
  const isPending = (id: Building) => Boolean(pending[id as PendingKey]);
  const waiting = spots.find((s) => s.id !== 'event' && isPending(s.id));
  const text = PHASE_TEXT[phase];

  const spot = (s: Spot, style: CSSProperties, className = '') => (
    <button
      key={s.id}
      data-building={s.id}
      className={`vc-spot ${className} ${s.badge ? 'has-badge' : ''}`}
      style={style}
      onClick={() => onOpen(s.id)}
      aria-label={`${s.name}${s.badge ? `, ${s.badge}` : ''}${isPending(s.id) ? ', something is ready here' : ''}`}
    >
      {s.badge && <span className="vc-badge">{s.badge}</span>}
      <img className="vc-art" src={s.art} alt="" draggable={false} />
      <span className="vc-label">
        {isPending(s.id) && <span className="vc-dot" aria-hidden="true" />}
        {s.name}
        <i aria-hidden="true">↗</i>
      </span>
    </button>
  );

  const hero = compact ? HERO_TALL : HERO_WIDE;
  const at = (x: number, y: number, w: number): CSSProperties => ({ left: `${(x / hero.w) * 100}%`, top: `${(y / hero.h) * 100}%`, width: `${(w / hero.w) * 100}%` });

  return (
    <div className={`vc time-${phase}`} data-phase={phase}>
      <section className={`vc-hero ${compact ? 'compact' : ''}`} style={{ aspectRatio: `${hero.w} / ${hero.h}` }} aria-label="Vision City">
        <CityHeroArt layout={hero} phase={phase} />
        <div className="vc-tint" aria-hidden="true" />
        <header className="vc-welcome">
          <div>
            <span className="vc-eyebrow">VISION CITY · {text.label}</span>
            <h2>Welcome to Vision City.</h2>
            <p>{text.line}</p>
          </div>
          <button className="vc-next" onClick={() => onOpen(waiting?.id ?? 'event')}>
            <span>
              <small>{waiting ? 'SOMETHING IS WAITING' : 'THIS WEEK’S EVENT'}</small>
              <strong>{waiting ? waiting.name : ev.name}</strong>
            </span>
            <b aria-hidden="true">→</b>
          </button>
        </header>
        {spot(byId.get('summon')!, at(hero.summon[0], hero.summon[1], hero.summonW), 'vc-hero-spot')}
        {spot(byId.get('event')!, at(hero.event[0], hero.event[1], hero.eventW), 'vc-event-spot')}
        <div className="vc-note"><span aria-hidden="true">✦</span> The Highland Sanctuary</div>
      </section>

      {DISTRICTS.map((d) => (
        <DistrictScene key={d.id} district={d} compact={compact} phase={phase} spots={d.ids.map((id) => byId.get(id)!)} renderSpot={spot} />
      ))}
    </div>
  );
}

// --- Layout ---

interface HeroLayout {
  w: number;
  h: number;
  sky: number;
  summon: [number, number];
  summonW: number;
  event: [number, number];
  eventW: number;
  plaza: [number, number];
}

const HERO_WIDE: HeroLayout = { w: 1200, h: 600, sky: 250, summon: [600, 488], summonW: 260, event: [955, 540], eventW: 170, plaza: [600, 455] };
const HERO_TALL: HeroLayout = { w: 600, h: 980, sky: 300, summon: [300, 620], summonW: 300, event: [410, 930], eventW: 220, plaza: [300, 570] };

/** Spot positions inside a district street: one row on wide screens, two columns zig-zagging down on phones. */
function districtPlan(n: number, compact: boolean): { w: number; h: number; roads: [number, number][][]; plots: [number, number][]; plotW: number } {
  if (!compact) {
    const w = 1200;
    const h = 300;
    const road = 262;
    const gap = n > 1 ? 980 / (n - 1) : 0;
    const startX = n > 1 ? 110 : 600;
    const plots = Array.from({ length: n }, (_, i) => [startX + i * gap, road - 12] as [number, number]);
    return { w, h, roads: [[[0, road], [w, road]]], plots, plotW: Math.min(220, gap ? gap * 0.86 : 220) };
  }
  const w = 600;
  const rowH = 270;
  const rows = Math.ceil(n / 2);
  const top = 290;
  const h = top + (rows - 1) * rowH + 50;
  const plots: [number, number][] = [];
  const roads: [number, number][][] = [];
  for (let r = 0; r < rows; r++) {
    const y = top + r * rowH;
    const left = r * 2;
    if (left + 1 < n) plots.push([160, y - 12], [440, y - 12]);
    else plots.push([300, y - 12]);
    roads.push([[0, y], [w, y]]);
    if (r < rows - 1) {
      const x = r % 2 === 0 ? 560 : 40;
      roads.push([[x, y], [x, y + rowH]]);
    }
  }
  return { w, h, roads, plots, plotW: 250 };
}

function DistrictScene({ district, compact, phase, spots, renderSpot }: { district: District; compact: boolean; phase: DayPhase; spots: Spot[]; renderSpot: (s: Spot, style: CSSProperties, className?: string) => ReactNode }) {
  const plan = districtPlan(spots.length, compact);
  return (
    <section className={`vc-district vc-${district.id}`} style={{ '--accent': district.accent } as CSSProperties} aria-labelledby={`vc-${district.id}-title`}>
      <header className="vc-district-head">
        <span className="vc-eyebrow">{district.eyebrow}</span>
        <h3 id={`vc-${district.id}-title`}>{district.title}</h3>
        <p>{district.line}</p>
      </header>
      <div className="vc-street" style={{ aspectRatio: `${plan.w} / ${plan.h}` }}>
        <StreetArt plan={plan} water={district.water} phase={phase} seed={district.id.length * 31} />
        <div className="vc-tint" aria-hidden="true" />
        {spots.map((s, i) => {
          const [x, y] = plan.plots[i];
          return renderSpot(s, { left: `${(x / plan.w) * 100}%`, top: `${(y / plan.h) * 100}%`, width: `${(plan.plotW / plan.w) * 100}%` });
        })}
      </div>
    </section>
  );
}

// --- Art ---

const SKY: Record<DayPhase, [string, string]> = {
  dawn: ['#4b3a6e', '#f0a98f'],
  day: ['#5f8fc4', '#cfe0da'],
  dusk: ['#3b3459', '#b68c8c'],
  night: ['#0d1130', '#2e2c58'],
};

/** Small deterministic noise so props land in the same places every visit. */
function noise(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse className="vc-glow" cx={x} cy={y - 45} rx="34" ry="34" fill="#ffe0a1" />
      <path d={`M${x - 3} ${y - 44}h6v50h-6Z`} fill="#4d484b" />
      <path d={`M${x - 11} ${y - 55}h22v20h-22Z`} fill="#5c5150" />
      <path className="vc-lit" d={`M${x - 7} ${y - 51}h14v12h-14Z`} fill="#ffe1a0" />
    </g>
  );
}

function Flowers({ w, h, top, count, seed }: { w: number; h: number; top: number; count: number; seed: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = 14 + noise(i + seed) * (w - 28);
        const y = top + noise(i + seed + 400) * (h - top - 12);
        return (
          <g key={i} opacity=".85">
            <path d={`M${x} ${y}v9m-3 -5h6`} stroke="#73a279" strokeWidth="2" />
            <path d={`M${x - 2} ${y - 2}h5v4h-5Z`} fill={['#f2d49d', '#d89caa', '#b4bec7'][i % 3]} />
          </g>
        );
      })}
    </>
  );
}

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`g-${id}`} x2="0" y2="1">
        <stop stopColor="#789980" />
        <stop offset="1" stopColor="#395b50" />
      </linearGradient>
      <pattern id={`t-${id}`} width="37" height="31" patternUnits="userSpaceOnUse">
        <path d="M6 10v4h3v-7M27 25v-3h3v4" stroke="#93b18c" strokeWidth="2" opacity=".3" />
      </pattern>
      <pattern id={`p-${id}`} width="25" height="18" patternUnits="userSpaceOnUse">
        <rect width="25" height="18" fill="#c7b18e" />
        <path d="M0 1H25M0 17H25M12 2V17" stroke="#a28c70" strokeWidth="2" />
        <path d="M2 4H9M16 4H23" stroke="#e0cda7" strokeWidth="2" />
      </pattern>
    </defs>
  );
}

function Road({ d, id, width = 54 }: { d: string; id: string; width?: number }) {
  return (
    <>
      <path d={d} fill="none" stroke="#537364" strokeWidth={width + 34} strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#8e816b" strokeWidth={width + 12} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={`url(#p-${id})`} strokeWidth={width} strokeLinejoin="round" />
    </>
  );
}

function CityHeroArt({ layout: l, phase }: { layout: HeroLayout; phase: DayPhase }) {
  const id = useId().replace(/:/g, '');
  const [top, bottom] = SKY[phase];
  const night = phase === 'night';
  const skyline = l.sky + 14;
  const houses = Array.from({ length: Math.ceil(l.w / 64) }, (_, i) => {
    const hgt = 38 + Math.round(noise(i + 7) * 46);
    return { x: i * 64 - 10, w: 54 + Math.round(noise(i + 70) * 18), h: hgt, spire: noise(i + 140) > 0.82 };
  });
  const [px, py] = l.plaza;
  const sunX = l.w * (l.w > 700 ? 0.6 : 0.83);
  const road = `M${px} ${py}V${l.h + 40}`;
  return (
    <svg className="vc-art-bg" viewBox={`0 0 ${l.w} ${l.h}`} preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true">
      <Defs id={id} />
      <linearGradient id={`s-${id}`} x2="0" y2="1">
        <stop stopColor={top} />
        <stop offset="1" stopColor={bottom} />
      </linearGradient>
      <path d={`M0 0H${l.w}V${l.h}H0Z`} fill={`url(#g-${id})`} />
      <path d={`M0 0H${l.w}V${l.sky + 30}H0Z`} fill={`url(#s-${id})`} />
      {night &&
        Array.from({ length: 40 }, (_, i) => (
          <rect key={i} className={i % 5 === 0 ? 'vc-twinkle' : ''} x={noise(i + 900) * l.w} y={noise(i + 950) * (l.sky - 60)} width="3" height="3" fill="#fff6d6" opacity={0.5 + noise(i) * 0.5} />
        ))}
      {/* Sun or moon. */}
      <path d={`M${sunX} ${l.sky * 0.22}h33v5h5v29h-5v5h-33v-5h-5v-29h5Z`} fill={night ? '#f1ecd6' : phase === 'day' ? '#fff3c4' : '#f7dfac'} />
      {night && <path d={`M${sunX + 8} ${l.sky * 0.22 + 8}h8v8h-8ZM${sunX + 22} ${l.sky * 0.22 + 20}h6v6h-6Z`} fill="#cfc8b0" />}
      <path className="vc-cloud" d={`M${l.w * 0.38} ${l.sky * 0.18}h30v-8h50v8h27v9h-107Z M${l.w * 0.08} ${l.sky * 0.34}h32v-7h44v7h26v8h-102Z`} fill={night ? '#5a5a86' : '#dec5bc'} opacity=".45" />
      <path d={`M0 ${l.sky - 40}L${l.w * 0.12} ${l.sky - 104}L${l.w * 0.22} ${l.sky - 60}L${l.w * 0.38} ${l.sky - 124}L${l.w * 0.53} ${l.sky - 48}L${l.w * 0.7} ${l.sky - 112}L${l.w * 0.86} ${l.sky - 62}L${l.w} ${l.sky - 116}V${l.sky + 10}H0Z`} fill={night ? '#2c2a4a' : '#625573'} />
      {/* The town skyline: rooftops with windows that light up after dark. */}
      {houses.map((hs, i) => (
        <g key={i}>
          <path d={`M${hs.x} ${skyline}V${skyline - hs.h}h${hs.w}V${skyline}Z`} fill={night ? '#272543' : '#4d4466'} />
          <path d={`M${hs.x - 4} ${skyline - hs.h}L${hs.x + hs.w / 2} ${skyline - hs.h - 20}L${hs.x + hs.w + 4} ${skyline - hs.h}Z`} fill={night ? '#3a2f4f' : '#7b4f57'} />
          {hs.spire && <path d={`M${hs.x + hs.w / 2 - 4} ${skyline - hs.h - 44}h8v26h-8Z`} fill={night ? '#3a2f4f' : '#7b4f57'} />}
          {[0, 1].map((k) => (
            <path key={k} className="vc-lit vc-window" d={`M${hs.x + 10 + k * (hs.w - 30)} ${skyline - hs.h + 14}h10v10h-10Z`} fill="#ffd98f" />
          ))}
        </g>
      ))}
      <path d={`M0 ${skyline}Q${l.w * 0.25} ${skyline - 18} ${l.w * 0.5} ${skyline + 10}T${l.w} ${skyline}V${l.h}H0Z`} fill={`url(#g-${id})`} />
      <path d={`M0 ${skyline}Q${l.w * 0.25} ${skyline - 18} ${l.w * 0.5} ${skyline + 10}T${l.w} ${skyline}V${l.h}H0Z`} fill={`url(#t-${id})`} />
      {/* Low walls frame the plaza. */}
      <g stroke="#adab86" strokeWidth="8">
        <path d={`M20 ${skyline + 66}H${px - 180}M${px + 180} ${skyline + 66}H${l.w - 20}`} />
        <path d={`M20 ${skyline + 88}H${px - 180}M${px + 180} ${skyline + 88}H${l.w - 20}`} />
      </g>
      {Array.from({ length: Math.floor(l.w / 50) }, (_, i) => {
        const x = 20 + i * 50;
        return Math.abs(x - px) < 185 ? null : <path key={i} d={`M${x} ${skyline + 52}h9v50h-9Z`} fill="#d0c4a1" />;
      })}
      <Road d={road} id={id} width={70} />
      <ellipse cx={px} cy={py} rx={l.w > 700 ? 210 : 170} ry="62" fill="#8e816b" />
      <ellipse cx={px} cy={py} rx={l.w > 700 ? 200 : 160} ry="54" fill={`url(#p-${id})`} />
      {/* Fountain. */}
      <g transform={`translate(${l.w > 700 ? px - 165 : px - 118} ${py + 22})`}>
        <path d="M-34 -6h68v18h-68Z" fill="#8a9483" />
        <path d="M-28 -2h56v10h-56Z" fill="#397482" />
        <path className="vc-water" d="M-20 2h14m10 0h14" stroke="#89bbba" strokeWidth="3" />
        <path d="M-4 -34h8v30h-8Z" fill="#b8b2a2" />
        <path className="vc-water" d="M-10 -38h20v6h-20Z" fill="#a8d8f0" opacity=".8" />
      </g>
      <Flowers w={l.w} h={l.h} top={skyline + 110} count={l.w > 700 ? 46 : 32} seed={3} />
      <Tree x={l.w > 700 ? 120 : 70} y={l.h - (l.w > 700 ? 70 : 230)} size={l.w > 700 ? 1.5 : 0.9} />
      <Tree x={l.w > 700 ? 300 : 540} y={l.h - (l.w > 700 ? 30 : 330)} size={l.w > 700 ? 1.1 : 0.8} pink />
      {l.w > 700 && <Tree x={l.w - 90} y={l.h - 90} size={1.4} />}
      <Lamp x={px - (l.w > 700 ? 230 : 190)} y={py + 10} />
      <Lamp x={px + (l.w > 700 ? 230 : 190)} y={py + 10} />
      {l.w > 700 && <Lamp x={px - 60} y={l.h - 10} />}
      <g className="vc-butterfly" fill="#f5d3ab">
        <path d={`M${l.w * 0.2} ${skyline + 140}h7v6h-7m9 -3h6v7h-6`} />
      </g>
    </svg>
  );
}

function StreetArt({ plan, water, phase, seed }: { plan: ReturnType<typeof districtPlan>; water?: boolean; phase: DayPhase; seed: number }) {
  const id = useId().replace(/:/g, '');
  const { w, h, roads, plots } = plan;
  const d = roads.map((line) => `M${line.map(([x, y]) => `${x} ${y}`).join('L')}`).join('');
  const wide = w > 700;
  // Trees and lamps sit in the gaps between buildings, never on them.
  const gaps = wide ? plots.slice(1).map(([x], i) => (x + plots[i][0]) / 2) : [];
  return (
    <svg className="vc-art-bg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden="true" data-phase={phase}>
      <Defs id={id} />
      <path d={`M0 0H${w}V${h}H0Z`} fill={`url(#g-${id})`} />
      <path d={`M0 0H${w}V${h}H0Z`} fill={`url(#t-${id})`} />
      {/* A hedge line and bunting in the district's colour. */}
      <path d={`M0 0H${w}V26H0Z`} fill="#3c6152" />
      <path d={`M0 26H${w}`} stroke="#2c4a40" strokeWidth="4" />
      {Array.from({ length: Math.ceil(w / 40) }, (_, i) => (
        <path key={i} d={`M${i * 40} 34h28l-14 16Z`} fill={i % 2 ? 'var(--accent)' : '#f4e6c4'} opacity=".85" />
      ))}
      <path d={`M0 34H${w}`} stroke="#5b4b3e" strokeWidth="2" />
      {water && wide && (
        <g>
          <path d={`M${w - 150} ${h}V${h - 120}h40v-30h110V${h}Z`} fill="#397482" />
          <path className="vc-water" d={`M${w - 120} ${h - 100}h40m10 30h50m-80 30h40`} stroke="#89bbba" strokeWidth="3" />
        </g>
      )}
      <Road d={d} id={id} />
      <Flowers w={w} h={h} top={60} count={wide ? 26 : 30} seed={seed} />
      {wide &&
        gaps.map((x, i) =>
          i % 2 === 0 ? <Tree key={i} x={x} y={h - 70} size={0.55} pink={(i + seed) % 3 === 0} /> : <Lamp key={i} x={x} y={h - 60} />,
        )}
      {!wide && roads.filter((_, i) => i % 2 === 0).map(([[, y]], i) => <Lamp key={i} x={300} y={y - 30} />)}
    </svg>
  );
}
