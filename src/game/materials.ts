import type { SaveData } from './types';

/** Upgrade materials that only drop from fights and activity goals. */
export interface MaterialReward {
  /** Signature Essence: signature move tiers. */
  essence?: number;
  /** Transcendence Crystals: tiers past level 400. */
  crystals?: number;
}

export function grantMaterials(save: SaveData, r: MaterialReward): SaveData {
  if (!r.essence && !r.crystals) return save;
  return {
    ...save,
    materials: {
      ...save.materials,
      sigMaterial: save.materials.sigMaterial + (r.essence ?? 0),
      transcendenceCrystal: save.materials.transcendenceCrystal + (r.crystals ?? 0),
    },
  };
}

export function materialText(r: MaterialReward): string[] {
  return [
    r.essence ? `${r.essence} Signature Essence` : '',
    r.crystals ? `${r.crystals} Transcendence Crystal${r.crystals === 1 ? '' : 's'}` : '',
  ].filter(Boolean);
}
