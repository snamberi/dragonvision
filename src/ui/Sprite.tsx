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

/** Head-and-shoulders crop of a fighter for small status cards. */
export function Portrait({ familyId, star, size = 44, flip = false }: { familyId: string; star: number; size?: number; flip?: boolean }) {
  const { look, name } = formForStar(getFamily(familyId), star);
  return (
    <span className="portrait" style={{ width: size, height: size }}>
      <img
        src={spriteUrl(look)}
        alt={name}
        draggable={false}
        style={{
          width: size * 1.9,
          height: size * 1.9,
          transform: flip ? 'scaleX(-1)' : undefined,
          filter: look.aura ? `drop-shadow(0 0 2px ${look.aura})` : undefined,
        }}
      />
    </span>
  );
}
