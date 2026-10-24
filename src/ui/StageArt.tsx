import type { ReactElement } from 'react';
import type { Arena } from '../game/arenas';
import { Tree } from './HomeArt';

/** Scenery drawn in Home's pixel language, tinted by each chapter's arena. Origin is the ground point. */
export type PropKind = 'tree' | 'pinkTree' | 'pine' | 'rock' | 'crystal' | 'pillar' | 'cactus';

const PROPS_BY_ARENA: Record<string, PropKind[]> = {
  cliffs: ['tree', 'pine', 'rock'],
  desert: ['rock', 'cactus', 'rock'],
  iron: ['pillar', 'rock'],
  space: ['crystal', 'rock'],
  foundry: ['pillar', 'rock'],
  volcano: ['rock', 'crystal'],
  moon: ['crystal', 'rock'],
  throne: ['pillar', 'crystal'],
  rift: ['crystal', 'rock'],
  demon: ['rock', 'crystal'],
  swamp: ['tree', 'rock', 'tree'],
  hive: ['pillar', 'rock'],
  tournament: ['tree', 'pinkTree', 'tree'],
  blossom: ['pinkTree', 'tree', 'pinkTree'],
  thunder: ['pine', 'rock'],
  frost: ['pine', 'rock', 'pine'],
  void: ['crystal', 'rock'],
  sky: ['pillar', 'pinkTree'],
};

export function propsFor(arena: Arena): PropKind[] {
  return PROPS_BY_ARENA[arena.id] ?? ['tree', 'rock'];
}

/** Rec. 709 luma weights for red, green and blue. */
const LUMA = [0.2126, 0.7152, 0.0722] as const;
const HEX_CHANNEL_OFFSETS = [0, 2, 4] as const;
const HEX_CHANNEL_WIDTH = 2;
const HEX_RADIX = 16;
/** Skies darker than this get a moon and stars instead of Home's warm sun. */
const NIGHT_SKY_LUMA = 40;

export function isNightSky(arena: Arena): boolean {
  const hex = arena.skyTop.replace('#', '');
  const luma = HEX_CHANNEL_OFFSETS.reduce<number>((sum, at, i) => sum + LUMA[i] * parseInt(hex.slice(at, at + HEX_CHANNEL_WIDTH), HEX_RADIX), 0);
  return luma < NIGHT_SKY_LUMA;
}

const SHADOW = <ellipse cx="0" cy="0" rx="40" ry="10" fill="#1f2c33" opacity=".3" />;

type PropDrawer = (arena: Arena) => ReactElement;

const PROP_ART: Record<PropKind, PropDrawer> = {
  tree: () => <Tree x={0} y={0} />,
  pinkTree: () => <Tree x={0} y={0} pink />,
  pine: (arena) => {
    const snowy = arena.weather === 'snow';
    const dark = snowy ? '#5c7c90' : '#2f5a52';
    const mid = snowy ? '#86a8b8' : '#4b8070';
    return (
      <g>
        {SHADOW}
        <path d="M-6 -22H6V0H-6Z" fill="#705440" />
        <path d="M-42 -20H42V-34H30V-48H18V-58H-18V-48H-30V-34H-42Z" fill={dark} />
        <path d="M-32 -50H32V-64H22V-78H12V-88H-12V-78H-22V-64H-32Z" fill={dark} />
        <path d="M-22 -80H22V-94H12V-108H4V-118H-4V-108H-12V-94H-22Z" fill={dark} />
        <path d="M-30 -34H-14V-44H8V-48H-18V-40H-30ZM-20 -64H-6V-72H10V-76H-12V-70H-20ZM-12 -94H2V-100H6V-104H-4V-98H-12Z" fill={mid} />
        {snowy && <path d="M-18 -58H18V-54H-18ZM-12 -88H12V-84H-12ZM-4 -118H4V-112H-4Z" fill="#f4f8ff" />}
      </g>
    );
  },
  rock: (arena) => (
    <g>
      {SHADOW}
      <path d="M-38 0V-14H-32V-26H-20V-34H6V-30H20V-22H30V-10H36V0Z" fill={arena.floorEdge} />
      <path d="M-30 -14V-24H-18V-30H4V-26H16V-18H24V-12H-6V-16H-18V-14Z" fill={arena.floor} />
      <path d="M-14 -26H0V-22H-14Z" fill="#ffffff" opacity=".35" />
      <path d="M8 -4H30V0H8Z" fill="#000000" opacity=".18" />
    </g>
  ),
  crystal: (arena) => (
    <g>
      {SHADOW}
      <path d="M-26 0V-24L-20 -40L-12 -24V0Z" fill={arena.near} />
      <path d="M-12 0V-48L-2 -76L10 -48V0Z" fill={arena.accent} />
      <path d="M-6 -48L-2 -68L2 -48V-10H-6Z" fill="#ffffff" opacity=".55" />
      <path d="M10 0V-30L18 -46L26 -30V0Z" fill={arena.accent} opacity=".8" />
      <path d="M-12 -2H26V0H-12Z" fill="#000000" opacity=".25" />
    </g>
  ),
  pillar: (arena) => (
    <g>
      {SHADOW}
      <path d="M-24 0V-10H24V0Z" fill={arena.floorEdge} />
      <path d="M-16 -10V-70H-8V-78H6V-72H16V-10Z" fill={arena.floor} />
      <path d="M-16 -70H16V-64H-16Z" fill={arena.floorEdge} />
      <path d="M-8 -60H-2V-12H-8ZM6 -60H10V-12H6Z" fill={arena.floorEdge} opacity=".55" />
      <path d="M-14 -58H-10V-14H-14Z" fill="#ffffff" opacity=".3" />
    </g>
  ),
  cactus: () => (
    <g>
      {SHADOW}
      <path d="M-7 0V-72H-3V-76H3V-72H7V0Z" fill="#5f8f4e" />
      <path d="M-7 -30H-22V-50H-16V-36H-7ZM7 -42H20V-60H14V-48H7Z" fill="#5f8f4e" />
      <path d="M-3 -70H0V-4H-3ZM-20 -48H-18V-36H-20Z" fill="#8fbf6a" />
    </g>
  ),
};

export function ArenaProp({ kind, arena }: { kind: PropKind; arena: Arena }): ReactElement {
  return PROP_ART[kind](arena);
}

/** Home's lantern post: a warm light that reads at any time of day. */
export function Lantern(): ReactElement {
  return (
    <g>
      <ellipse cx="0" cy="-41" rx="28" ry="28" fill="#ffe0a1" opacity=".14" />
      <path d="M-3 -44h6v44h-6Z" fill="#4d484b" />
      <path d="M-11 -55h22v20h-22Z" fill="#5c5150" />
      <path d="M-7 -51h14v12h-14Z" fill="#ffe1a0" />
    </g>
  );
}

/** A prop as its own small, undistorted SVG, positioned by its ground point. */
export function PropSprite({ kind, arena, left, top, width, className = '' }: { kind: PropKind | 'lantern'; arena: Arena; left: number; top: number; width: number; className?: string }) {
  return (
    <svg
      className={`sm-prop ${className}`}
      viewBox="-64 -128 128 128"
      style={{ left: `${left}%`, top: `${top}%`, width }}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {kind === 'lantern' ? <Lantern /> : <ArenaProp kind={kind} arena={arena} />}
    </svg>
  );
}
