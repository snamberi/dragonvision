import type { CSSProperties, ReactNode } from 'react';
import { unitName } from '../game/progression';
import { getFamily, roleFor } from '../game/roster';
import { ROLE_COLORS, tierFor } from './rarity';
import { Sprite, Stars } from './Sprite';

interface Props {
  familyId: string;
  star: number;
  level: number;
  onClick?: () => void;
  highlight?: boolean;
  badge?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const SPARKLES = 4;

/** Collectible card: border, background and effects scale with the star tier. */
export function FighterCard({ familyId, star, level, onClick, highlight, badge, className = '', style, children }: Props) {
  const tier = tierFor(star);
  const family = getFamily(familyId);
  const role = roleFor(family);
  const classes = ['card', `tier-${tier.id}`, star > 1 ? 'evolved' : '', highlight ? 'highlight' : '', className].join(' ');
  const body = (
    <>
      <span className="card-ribbon">{tier.label}</span>
      {badge && <span className="badge">{badge}</span>}
      <div className="card-art">
        {tier.rank >= 2 &&
          Array.from({ length: SPARKLES }, (_, i) => <span key={i} className={`sparkle s${i}`} aria-hidden="true" />)}
        <Sprite familyId={familyId} star={star} size={72} />
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
  const cardStyle = { '--tier': tier.color, ...style } as CSSProperties;
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
