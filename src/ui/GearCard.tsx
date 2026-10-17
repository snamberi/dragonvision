import type { CSSProperties } from 'react';
import { describeBonus } from '../game/bonus';
import { gearArtUrl } from '../art/items';
import { RARITY_LABEL, getSet, getTemplate, itemBonus, wearer } from '../game/gear';
import { unitName } from '../game/progression';
import type { GearItem, SaveData } from '../game/types';

export const RARITY_COLORS: Record<GearItem['rarity'], string> = {
  common: '#9a94b8',
  uncommon: '#4ade80',
  rare: '#3fc6ff',
  epic: '#b794ff',
  legendary: '#ffd23f',
};

/** A gear piece's own pixel model, framed in its rarity color. */
export function GearIcon({ templateId, rarity, size = 40 }: { templateId: string; rarity: GearItem['rarity']; size?: number }) {
  return (
    <span className={`gear-icon rarity-${rarity}`} style={{ '--rarity': RARITY_COLORS[rarity], width: size, height: size } as CSSProperties}>
      <img src={gearArtUrl(templateId)} alt="" width={size - 6} height={size - 6} draggable={false} />
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
