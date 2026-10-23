import type { CSSProperties } from 'react';
import { describeBonus } from '../game/bonus';
import { gearArtUrl } from '../art/items';
import { RARITY_LABEL, gearArtId, getSet, getTemplate, itemBonus, wearer } from '../game/gear';
import { GEAR_EFFECTS } from '../game/bossSets';
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
      <img src={gearArtUrl(gearArtId(templateId))} alt="" width={size - 6} height={size - 6} draggable={false} />
    </span>
  );
}

interface CardProps {
  save?: SaveData;
  item: Pick<GearItem, 'templateId' | 'rarity' | 'subs'> & { id?: string };
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
        {item.subs && item.subs.length > 0 && (
          <span className="gear-subs muted small-text">Rolled: {item.subs.map((sub) => describeBonus({ [sub.stat]: sub.value })).join(' · ')}</span>
        )}
        <span className="gear-set" style={{ color: set.color }}>
          {set.name} set{set.effect ? ` · ${GEAR_EFFECTS[set.effect].name}` : ''}
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
      <b style={{ color: set.color }}>{set.name}</b> 2 pieces: {describeBonus(set.two)} · 4 pieces:{' '}
      {set.effect ? `${GEAR_EFFECTS[set.effect].name}: ${GEAR_EFFECTS[set.effect].text}` : describeBonus(set.four)}
      {set.source && (
        <span className="muted"> · {set.source.kind === 'wall' ? `drops from the stage ${set.source.stage} wall boss` : `drops from the ${set.source.boss} raid`}</span>
      )}
    </span>
  );
}
