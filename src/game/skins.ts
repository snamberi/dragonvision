import type { Look, SaveData } from './types';

export interface SkinTemplate {
  id: string;
  familyId: string;
  name: string;
  hair?: string;
  outfit?: string;
  accent?: string;
  boots?: string;
  aura?: string;
  /** Only sold in this event's shop. */
  eventId?: string;
}

export const SKIN_TEMPLATES: SkinTemplate[] = [
  { id: 'kairo-shadow', familyId: 'kairo', name: 'Shadow Form', hair: '#1a1240', outfit: '#1a1240', accent: '#8b5cf6', boots: '#8b5cf6', aura: '#8b5cf6' },
  { id: 'kairo-jade', familyId: 'kairo', name: 'Jade Spirit', hair: '#3fae6a', outfit: '#1f6b45', accent: '#8ef0a8', boots: '#1f6b45', aura: '#8ef0a8' },
  { id: 'varek-crimson', familyId: 'varek', name: 'Crimson Prince', hair: '#ff4a3d', outfit: '#7a1020', accent: '#ffd23f', boots: '#3a0810' },
  { id: 'mei-storm', familyId: 'mei', name: 'Storm Dancer', hair: '#7fe7ff', outfit: '#1c4f6e', accent: '#ffffff', boots: '#1c4f6e', aura: '#7fe7ff' },
  { id: 'jin-golden', familyId: 'jin', name: 'Golden Blade', hair: '#ffd23f', outfit: '#8a5a10', accent: '#ffd23f', boots: '#5a3a0a', aura: '#ffd23f' },
  { id: 'nyx-neon', familyId: 'nyx', name: 'Neon Circuit', hair: '#4ade80', outfit: '#0a1a12', accent: '#4ade80', boots: '#0a1a12', aura: '#4ade80' },
  { id: 'orrin-crimson', familyId: 'orrin', name: 'Crimson Sage', hair: '#ff4a3d', outfit: '#7a1020', accent: '#ffd23f', boots: '#3a0810' },
  { id: 'mei-lantern', familyId: 'mei', name: 'Lantern Dancer', hair: '#2a1a3a', outfit: '#c8322a', accent: '#ffd23f', boots: '#7a1020', aura: '#ffb02e', eventId: 'lantern' },
  { id: 'bruno-frostfang', familyId: 'bruno', name: 'Frostfang', hair: '#e8f0ff', outfit: '#3a5a8a', accent: '#7fe7ff', boots: '#1a2a4a', aura: '#bfe9ff', eventId: 'frostfang' },
  { id: 'lyra-starfall', familyId: 'lyra', name: 'Starfall Navigator', hair: '#fff6d8', outfit: '#1a1240', accent: '#ffd23f', boots: '#0a0618', aura: '#e9e4ff', eventId: 'starfall' },
  { id: 'jin-ember', familyId: 'jin', name: 'Ember Showman', hair: '#ff8a1f', outfit: '#3a0810', accent: '#ff4a3d', boots: '#1a0a0a', aura: '#ff8a1f', eventId: 'ember' },
  { id: 'zeno-masque', familyId: 'zeno', name: 'Masked Echo', hair: '#b794ff', outfit: '#0a1a2a', accent: '#9ae6e6', boots: '#0a1a2a', aura: '#b794ff', eventId: 'masquerade' },
  { id: 'lyra-void', familyId: 'lyra', name: 'Void Singer', hair: '#8b5cf6', outfit: '#1a1240', accent: '#b794ff', boots: '#0a0618', aura: '#8b5cf6' },
];

export function getSkin(skinId: string): SkinTemplate | undefined {
  return SKIN_TEMPLATES.find((s) => s.id === skinId);
}

export function applySkinsToLook(look: Look, skinId: string | undefined): Look {
  if (!skinId) return look;
  const skin = getSkin(skinId);
  if (!skin) return look;
  return {
    ...look,
    ...(skin.hair !== undefined && { hair: skin.hair }),
    ...(skin.outfit !== undefined && { outfit: skin.outfit }),
    ...(skin.accent !== undefined && { accent: skin.accent }),
    ...(skin.boots !== undefined && { boots: skin.boots }),
    ...(skin.aura !== undefined && { aura: skin.aura }),
  };
}

export function ownSkin(save: SaveData, skinId: string): SaveData {
  if ((save.ownedSkins ?? []).includes(skinId)) return save;
  return { ...save, ownedSkins: [...(save.ownedSkins ?? []), skinId] };
}

export function skinsFor(save: SaveData, familyId: string): SkinTemplate[] {
  return SKIN_TEMPLATES.filter((s) => s.familyId === familyId && (save.ownedSkins ?? []).includes(s.id));
}

export function equippedSkin(save: SaveData, familyId: string): string | undefined {
  const id = save.skinsEquipped?.[familyId];
  return id && (save.ownedSkins ?? []).includes(id) ? id : undefined;
}

/** Wear an owned skin, or pass null to go back to the default look. */
export function equipSkin(save: SaveData, familyId: string, skinId: string | null): SaveData {
  const equipped = { ...(save.skinsEquipped ?? {}) };
  if (skinId === null) {
    delete equipped[familyId];
    return { ...save, skinsEquipped: equipped };
  }
  const skin = getSkin(skinId);
  if (!skin || skin.familyId !== familyId) throw new Error('That skin is for another fighter');
  if (!(save.ownedSkins ?? []).includes(skinId)) throw new Error('You do not own that skin');
  return { ...save, skinsEquipped: { ...equipped, [familyId]: skinId } };
}
