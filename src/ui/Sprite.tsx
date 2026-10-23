import type { CSSProperties } from 'react';
import { spriteUrl, spriteSheetUrl, type SpritePose } from '../art/sprite';
import { formForStar, getFamily } from '../game/roster';
import { applySkinsToLook } from '../game/skins';

interface Props {
  familyId: string;
  star: number;
  size?: number;
  flip?: boolean;
  className?: string;
  pose?: SpritePose;
  animated?: boolean;
  /** Owned skin to wear instead of the default look. */
  skinId?: string;
}

/** CSS steps advance real painted frames; reduced motion shows the first frame. */
export function Sprite({ familyId, star, size = 96, flip = false, className = '', pose = 'idle', animated = true, skinId }: Props) {
  const form = formForStar(getFamily(familyId), star);
  const look = applySkinsToLook(form.look, skinId);
  const name = form.name;
  const scale = look.small ? 0.88 : look.large ? 1.08 : 1;
  return <span role="img" aria-label={name} data-pose={pose} className={`sprite sprite-animated pose-${pose} ${animated?'':'still'} ${className}`} style={{
    width:size, height:size, transform:`scale(${flip?-scale:scale},${scale})`,
    '--sprite-aura':look.aura ?? 'transparent',
  } as CSSProperties}>
    <span className="sprite-frames" key={pose} style={{backgroundImage:`url("${spriteSheetUrl(look,familyId,pose)}")`}} />
  </span>;
}
export function Stars({ star }: { star: number }) { return <span className="stars">{star}★</span>; }

export function Portrait({ familyId, star, size = 44, flip = false }: { familyId: string; star: number; size?: number; flip?: boolean }) {
  const { look, name } = formForStar(getFamily(familyId), star);
  return <span className="portrait" style={{width:size,height:size}}>
    <img src={spriteUrl(look,familyId)} alt={name} draggable={false} style={{width:size*1.9,height:size*1.9,transform:flip?'scaleX(-1)':undefined}} />
  </span>;
}
