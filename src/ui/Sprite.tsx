import { spriteUrl } from '../art/sprite';
import { formForStar, getFamily } from '../game/roster';

interface Props {
  familyId: string;
  star: number;
  size?: number;
  flip?: boolean;
  className?: string;
}

export function Sprite({ familyId, star, size = 96, flip = false, className = '' }: Props) {
  const { look, name } = formForStar(getFamily(familyId), star);
  const scale = look.small ? 0.8 : look.large ? 1.12 : 1;
  const style = {
    width: size,
    height: size,
    transform: `scale(${flip ? -scale : scale}, ${scale})`,
    filter: look.aura ? `drop-shadow(0 0 3px ${look.aura}) drop-shadow(0 0 6px ${look.aura})` : undefined,
  };
  return <img className={`sprite ${className}`} src={spriteUrl(look)} alt={name} style={style} draggable={false} />;
}

export function Stars({ star }: { star: number }) {
  return <span className="stars">{star}★</span>;
}
