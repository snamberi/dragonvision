import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';
import { Tree } from './HomeArt';
import { dayPhase } from './CityScreen';

const PHASE_REFRESH_MS = 60_000;
/** The plaza is a trapezoid widening toward the viewer; paving lines follow its edges. */
const PLAZA_TOP = 300;
const PLAZA_DEPTH = 120;
const PLAZA_LEFT = 380;
const PLAZA_RIGHT = 820;
const PLAZA_FLARE = 80;
const PAVING_ROWS = [326, 348, 372, 398];

export type Quarter = 'arena' | 'harbor' | 'event';

const QUARTER: Record<Quarter, { label: string; accent: string; sky: [string, string] }> = {
  arena: { label: 'Arena Quarter', accent: '#d9736b', sky: ['#c98a7a', '#f2c79b'] },
  harbor: { label: 'Harbor & Depths', accent: '#6fb0c8', sky: ['#7fa6c4', '#cfe0d6'] },
  event: { label: 'Weekly Event', accent: '#ffd23f', sky: ['#8a6fb4', '#f1c49a'] },
};

interface SceneProps {
  quarter: Quarter;
  title: string;
  line: ReactNode;
  art: string;
  onBack: () => void;
  /** Short status shown in a Home-style card beside the title. */
  status?: { label: string; value: ReactNode };
  /** A character standing on the plaza (boss, featured fighter...). */
  figure?: ReactNode;
  /** Overrides the quarter's sky, e.g. an event's arena colours. */
  sky?: [string, string];
  eyebrow?: string;
}

/** The illustrated street-front every Arena and Harbor building opens onto, drawn like Home's map. */
export function QuarterScene({ quarter, title, line, art, onBack, status, figure, sky, eyebrow }: SceneProps) {
  const q = QUARTER[quarter];
  const [phase, setPhase] = useState(() => dayPhase(new Date().getHours()));
  useEffect(() => {
    const timer = setInterval(() => setPhase(dayPhase(new Date().getHours())), PHASE_REFRESH_MS);
    return () => clearInterval(timer);
  }, []);
  const [top, bottom] = sky ?? q.sky;
  const night = phase === 'night';
  const water = quarter === 'harbor';
  return (
    <div className={`qs vc time-${phase}`} style={{ '--qs-accent': q.accent } as CSSProperties}>
      <button className="qs-back" onClick={onBack}>
        <b aria-hidden="true">←</b> Vision City
      </button>
      <section className="qs-scene" aria-label={`${title}, ${q.label}`}>
        <svg className="qs-bg" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden="true">
          <defs>
            <linearGradient id={`qs-sky-${quarter}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={night ? '#1d2348' : top} />
              <stop offset="1" stopColor={night ? '#4a3d6a' : bottom} />
            </linearGradient>
          </defs>
          <rect width="1200" height="420" fill={`url(#qs-sky-${quarter})`} />
          {night
            ? [[120, 50], [260, 90], [410, 40], [690, 70], [860, 36], [1010, 96], [1120, 54]].map(([x, y]) => (
                <rect key={`${x}`} className="vc-twinkle" x={x} y={y} width="4" height="4" fill="#fff4cf" />
              ))
            : null}
          <rect x="980" y="58" width="44" height="44" fill={night ? '#f3ead2' : '#fff1c4'} opacity=".9" />
          <g className="vc-cloud" fill="#ffffff" opacity={night ? 0.12 : 0.55}>
            <rect x="760" y="150" width="120" height="14" />
            <rect x="790" y="138" width="60" height="12" />
            <rect x="1040" y="132" width="110" height="12" />
            <rect x="1070" y="122" width="50" height="10" />
          </g>
          <path d="M0 250 L120 170 L230 220 L360 140 L470 205 L600 150 L740 215 L860 160 L990 220 L1100 170 L1200 205 V300 H0Z" fill="#6f6684" opacity=".75" />
          <path d="M0 275 L150 225 L280 260 L420 215 L560 262 L700 228 L850 262 L1000 226 L1200 258 V320 H0Z" fill="#5b6b6d" />
          {water ? (
            <>
              <rect y="292" width="1200" height="128" fill="#3a7487" />
              <g className="vc-water" fill="#9fd0d5" opacity=".7">
                {Array.from({ length: 14 }, (_, i) => (
                  <rect key={i} x={i * 90 + (i % 2) * 30} y={318 + (i % 3) * 22} width="40" height="3" />
                ))}
              </g>
              <rect x="300" y="300" width="600" height="120" fill="#8f6a4d" />
              <rect x="300" y="300" width="600" height="8" fill="#b88d63" />
              {Array.from({ length: 13 }, (_, i) => (
                <rect key={i} x={306 + i * 46} y="312" width="2" height="108" fill="#6d4f3c" />
              ))}
            </>
          ) : (
            <>
              <rect y="292" width="1200" height="128" fill="#547463" />
              <g fill="#7aa06a">
                {Array.from({ length: 26 }, (_, i) => (
                  <rect key={i} x={(i * 97) % 1200} y={312 + ((i * 41) % 90)} width="6" height="4" />
                ))}
              </g>
              <path d="M380 300 H820 L900 420 H300Z" fill="#b9a98d" />
              <path d="M380 300 H820 L826 309 H374Z" fill="#d6c7a8" />
              {PAVING_ROWS.map((y) => {
                const spread = ((y - PLAZA_TOP) * PLAZA_FLARE) / PLAZA_DEPTH;
                return <rect key={y} x={PLAZA_LEFT - spread + 8} y={y} width={PLAZA_RIGHT - PLAZA_LEFT + spread * 2 - 16} height="2" fill="#9b8b72" opacity=".7" />;
              })}
            </>
          )}
          {[250, 950].map((x) => (
            <g key={x}>
              <rect x={x} y="226" width="6" height="74" fill="#342d38" />
              <rect x={x - 6} y="214" width="18" height="18" fill="#bc874c" />
              <rect className="vc-lit" x={x - 2} y="217" width="10" height="12" fill="#ffe7a1" />
              <circle className="vc-glow" cx={x + 3} cy="223" r="46" fill="#ffd58a" />
            </g>
          ))}
          {!water && (
            <>
              <Tree x={90} y={300} size={1.1} />
              <Tree x={1110} y={300} size={1} pink={quarter === 'event'} />
            </>
          )}
        </svg>
        <div className="vc-tint" aria-hidden="true" />
        <div className="qs-copy">
          <span className="vc-eyebrow">{eyebrow ?? `VISION CITY · ${q.label.toUpperCase()}`}</span>
          <h2>{title}</h2>
          <p>{line}</p>
        </div>
        {status && (
          <div className="qs-status">
            <small>{status.label}</small>
            <strong>{status.value}</strong>
          </div>
        )}
        <img className="qs-building" src={art} alt="" aria-hidden="true" />
        {figure && <span className="qs-figure">{figure}</span>}
      </section>
    </div>
  );
}

/** A Home-style card: parchment eyebrow, pixel title, dark gradient body. */
export function QPanel({ eyebrow, title, aside, children, className = '' }: { eyebrow?: string; title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`qp ${className}`}>
      <header className="qp-head">
        <div>
          {eyebrow && <span className="vc-eyebrow">{eyebrow}</span>}
          <h3>{title}</h3>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** A labelled meter with Home's dark track and gold fill. */
export function QMeter({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  return (
    <span className="qm" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <i style={{ width: `${pct}%` }} />
    </span>
  );
}
