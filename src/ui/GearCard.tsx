import type { CSSProperties } from 'react';
import { describeBonus } from '../game/bonus';
import { type GearKind, RARITY_LABEL, getSet, getTemplate, itemBonus, wearer } from '../game/gear';
import { unitName } from '../game/progression';
import type { GearItem, SaveData } from '../game/types';

export const RARITY_COLORS: Record<GearItem['rarity'], string> = {
  common: '#9a94b8',
  uncommon: '#4ade80',
  rare: '#3fc6ff',
  epic: '#b794ff',
  legendary: '#ffd23f',
};

const SHAPES: Record<GearKind, string> = {
  weapon: 'M11 1H14V4L7 11L8 12L6 14L5 13L3 15L1 13L3 11L2 10L4 8L5 9Z',
  armor: 'M3 2H6L8 4L10 2H13L15 5L13 7V14H3V7L1 5Z',
  accessory: 'M6 1H10V3H12V5H13V11H12V13H10V15H6V13H4V11H3V5H4V3H6ZM6 6V10H10V6Z',
};

/** Pixel icon for a gear piece: shape by kind, color by set, frame by rarity. */
export function GearIcon({ templateId, rarity, size = 40 }: { templateId: string; rarity: GearItem['rarity']; size?: number }) {
  const t = getTemplate(templateId);
  return (
    <span className={`gear-icon rarity-${rarity}`} style={{ '--rarity': RARITY_COLORS[rarity], width: size, height: size } as CSSProperties}>
      <svg viewBox="0 0 16 16" width={size - 10} height={size - 10} shapeRendering="crispEdges" aria-hidden="true">
        <path d={SHAPES[t.kind]} fill={getSet(t.setId).color} stroke="#120b2e" strokeWidth="1" />
      </svg>
    </span>
  );
}

interface CardProps {
  save?: SaveData;
  item: Pick<GearItem, 'templateId' | 'rarity'> & { id?: string };
  onClick?: () => void;
  selected?: boolean;
  children?: React.ReactNode;
}

export function GearCard({ save, item, onClick, selected, children }: CardProps) {
  const t = getTemplate(item.templateId);
  const set = getSet(t.setId);
  const worn = save && item.id ? wearer(save, item.id) : undefined;
  const body = (
    <>
      <GearIcon templateId={item.templateId} rarity={item.rarity} />
      <span className="gear-text">
        <b>{t.name}</b>
        <span className="gear-rarity" style={{ color: RARITY_COLORS[item.rarity] }}>
          {RARITY_LABEL[item.rarity]} {t.kind}
        </span>
        <span className="gear-stats">{describeBonus(itemBonus(item))}</span>
        <span className="gear-set" style={{ color: set.color }}>
          {set.name} set
        </span>
        {worn && <span className="gear-worn">On {unitName(worn)}</span>}
      </span>
    </>
  );
  return (
    <div className={`gear-card ${selected ? 'selected' : ''}`} style={{ '--rarity': RARITY_COLORS[item.rarity] } as CSSProperties}>
      {onClick ? (
        <button className="gear-open" onClick={onClick}>
          {body}
        </button>
      ) : (
        <div className="gear-open">{body}</div>
      )}
      {children}
    </div>
  );
}

/** Set bonus text, e.g. "2: +10% ATK · 4: special starts 1 step charged". */
export function SetBonusText({ setId }: { setId: string }) {
  const set = getSet(setId);
  return (
    <span className="set-text">
      <b style={{ color: set.color }}>{set.name}</b> 2 pieces: {describeBonus(set.two)} · 4 pieces: {describeBonus(set.four)}
    </span>
  );
}
