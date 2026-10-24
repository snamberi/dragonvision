import type { ReactNode } from 'react';
import { DISCORD_URL, type SocialId, type SocialLink, activeSocials } from '../content/social';

/** Discord's mascot on a 14×10 grid, offset into a 16×16 tile. */
const CLYDE = [
  '00011000011000',
  '00111111111100',
  '01111111111110',
  '01111111111110',
  '11100111100111',
  '11100111100111',
  '11111111111111',
  '11111111111111',
  '01110000001110',
  '00100000000100',
];
const CLYDE_PATH = CLYDE.flatMap((row, y) => [...row].flatMap((c, x) => (c === '1' ? [`M${x + 1} ${y + 3}h1v1h-1z`] : []))).join('');

const TILE = 'M1 0h14v1h1v14h-1v1H1v-1H0V1h1z';

const ICONS: Record<SocialId, { edge: string; fill: string; light: string; glyph: ReactNode }> = {
  discord: { edge: '#3c45a5', fill: '#5865f2', light: '#7984f5', glyph: <path fill="#fff" d={CLYDE_PATH} /> },
  tiktok: {
    edge: '#000', fill: '#161616', light: '#2a2a2a',
    glyph: (
      <>
        <path fill="#25f4ee" d="M6 4h2v6h-1v1H5v-1H4V8h1V7h2v2H6z" />
        <path fill="#fe2c55" d="M8 5h2v6H9v1H7v-1H6V9h1V8h2v2H8zM10 5h1v1h1v1h-2z" />
        <path fill="#fff" d="M7 4h2v6H8v1H6v-1H5V8h1v2h1zM9 4h1v1h1v1H9z" />
      </>
    ),
  },
  youtube: { edge: '#8f0000', fill: '#ff0000', light: '#ff4a4a', glyph: <path fill="#fff" d="M6 5h1v1h1v1h1v1h1v1H9v1H8v1H7v1H6z" /> },
  reddit: {
    edge: '#a83300', fill: '#ff4500', light: '#ff7a45',
    glyph: <path fill="#fff" d="M10 3h2v2h-2zM8 4h1v2H8zM4 6h8v1h1v4h-1v1h-1v1H5v-1H4v-1H3V7h1zM6 8v1h1V8zm3 0v1h1V8zM6 10v1h4v-1z" />,
  },
};

export function SocialIcon({ id, size = 20 }: { id: SocialId; size?: number }) {
  const i = ICONS[id];
  return (
    <svg className="pixel-social" width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      <path fill={i.edge} d={TILE} />
      <path fill={i.fill} d="M1 1h14v13H1z" />
      <path fill={i.light} d="M1 1h14v1H1z" />
      {i.glyph}
    </svg>
  );
}

const newTab = { target: '_blank', rel: 'noopener noreferrer' } as const;

/** Big Home-style call to action. */
export function DiscordButton({ label = 'Join the Dragon Vision Discord', className = '' }: { label?: string; className?: string }) {
  return (
    <a className={`discord-cta ${className}`} href={DISCORD_URL} {...newTab} aria-label={`${label} (opens in a new tab)`}>
      <SocialIcon id="discord" size={28} />
      <span>
        <small>Community</small>
        <b>{label}</b>
      </span>
      <i aria-hidden="true">↗</i>
    </a>
  );
}

/** Compact icon buttons for the top bar; links without an address stay hidden. */
export function SocialIconRow({ className = '' }: { className?: string }) {
  return (
    <>
      {activeSocials().map((l: SocialLink) => (
        <a key={l.id} className={`corner-btn social-btn ${className}`} href={l.url!} {...newTab} aria-label={`${l.label} (opens in a new tab)`} title={l.label}>
          <SocialIcon id={l.id} size={18} />
        </a>
      ))}
    </>
  );
}

/** Every live community link as labelled rows (Settings). */
export function CommunityLinks() {
  return (
    <div className="community-links">
      {activeSocials().map((l) => (
        <a key={l.id} className="community-link" href={l.url!} {...newTab} aria-label={`${l.label} (opens in a new tab)`}>
          <SocialIcon id={l.id} size={20} /> <span>{l.label}</span> <i aria-hidden="true">↗</i>
        </a>
      ))}
    </div>
  );
}
