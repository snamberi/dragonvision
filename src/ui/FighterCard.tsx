import { identityFor } from '../art/identity';
import type { CSSProperties, ReactNode } from 'react';
import { unitName } from '../game/progression';
import { getFamily, roleFor } from '../game/roster';
import { ROLE_COLORS, tierFor } from './rarity';
import { Sprite, Stars } from './Sprite';
import type { NotifierColor } from './FightersScreen';

interface Props {
  familyId: string;
  star: number;
  level: number;
  onClick?: () => void;
  highlight?: boolean;
  badge?: string;
  notifierDot?: NotifierColor;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const DOT_COLORS: Record<NonNullable<NotifierColor>, string> = {
  red: '#ff4444',
  gold: '#ffd700',
  blue: '#44aaff',
};

const DOT_LABELS: Record<NonNullable<NotifierColor>, string> = {
  red: 'Can evolve',
  gold: 'Gear available',
  blue: 'Awakening available',
};

const SPARKLES = 4;

/** Collectible card: border, background and effects scale with the star tier. */
export function FighterCard({ familyId, star, level, onClick, highlight, badge, notifierDot, className = '', style, children }: Props) {
  const tier = tierFor(star);
  const family = getFamily(familyId);
  const identity = identityFor(familyId);
  const role = roleFor(family);
  const classes = ['card', `tier-${tier.id}`, star > 1 ? 'evolved' : '', family.legendary ? 'legend' : '', highlight ? 'highlight' : '', `frame-${tier.rank}`, className].join(' ');
  const body = (
    <>
      <span className="card-ribbon">{family.legendary ? 'LEGEND' : tier.label}</span>
      {badge && <span className="badge">{badge}</span>}
      {notifierDot && (
        <span
          className="notifier-dot"
          aria-label={DOT_LABELS[notifierDot]}
          style={{ background: DOT_COLORS[notifierDot] }}
        />
      )}
      <div className={`card-art card-world-${identity.accessory}`}>
        <svg className="card-landscape" viewBox="0 0 180 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle cx="90" cy="66" r="41" fill="var(--family-color)" opacity=".1"/>
          {['blade','cape','staff'].includes(identity.accessory) ? <><circle cx="126" cy="36" r="20" fill="var(--family-color)" opacity=".5"/><path d="M0 130L31 69L66 114L100 75L144 117L172 62L180 160H0Z" fill="var(--family-color)" opacity=".18"/><path d="M0 145L48 100L94 131L136 97L180 135V160H0Z" fill="var(--family-dark)"/></> : ['armor','gauntlets'].includes(identity.accessory) ? <><path d="M13 150V55H42V150M138 150V55H167V150" stroke="var(--family-color)" strokeWidth="4" opacity=".25"/><path d="M0 54H180M0 136H180M21 54L90 15L159 54" fill="none" stroke="var(--family-color)" opacity=".35"/><path d="M0 160L90 100L180 160" fill="var(--family-dark)"/></> : <><path d="M90 20L135 75L90 130L45 75Z" fill="none" stroke="var(--family-color)" opacity=".3" strokeWidth="2"/><path d="M90 37L122 75L90 113L58 75Z" fill="none" stroke="var(--family-color)" opacity=".2"/><path d="M0 145Q50 115 90 145T180 140V160H0Z" fill="var(--family-dark)"/></>}
          {[0,1,2,3,4,5,6].map(i=><rect key={i} x={14+(i*47)%155} y={12+(i*31)%93} width={i%2?2:3} height={i%2?2:3} fill="var(--family-color)" opacity=".6"/>)}
        </svg>
        <span className="card-family-mark" aria-hidden="true">{identity.motif}</span>
        {tier.rank >= 2 &&
          Array.from({ length: SPARKLES }, (_, i) => <span key={i} className={`sparkle s${i}`} aria-hidden="true" />)}
        <Sprite familyId={familyId} star={star} size={132} />
        {highlight && <span className="card-team">ON TEAM</span>}
      </div>
      <div className="card-name">{unitName({ familyId, star })}</div>
      <div className="card-meta">
        Lv {level} <Stars star={star} />
      </div>
      <span className="role-tag" style={{ '--role': ROLE_COLORS[role] } as CSSProperties}>
        {role}
      </span>
    </>
  );
  const cardStyle = { '--tier': tier.color, '--family-color':identity.color, '--family-dark':identity.dark, ...style } as CSSProperties;
  return (
    <div className={classes} style={cardStyle}>
      {onClick ? (
        <button className="card-open" onClick={onClick} aria-label={`${unitName({ familyId, star })}, ${tier.label}`}>
          {body}
        </button>
      ) : (
        <div className="card-open">{body}</div>
      )}
      {children}
    </div>
  );
}
