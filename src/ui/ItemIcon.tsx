import type { CSSProperties } from 'react';
import { itemArtUrl } from '../art/items';
import type { ItemIconId } from '../game/items';

/** A non-gear item's own pixel model in an inventory-style slot. */
export function ItemIcon({ icon, size = 48, glow }: { icon: ItemIconId; size?: number; glow?: string }) {
  return (
    <span className="item-icon" style={{ width: size, height: size, '--glow': glow ?? 'transparent' } as CSSProperties}>
      <img src={itemArtUrl(icon)} alt="" width={size - 8} height={size - 8} draggable={false} />
    </span>
  );
}
