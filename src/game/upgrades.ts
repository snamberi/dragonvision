import {
  BASE_COLLECTION_CAP,
  BASE_GEAR_SLOTS,
  COLLECTION_SLOTS_PER_UPGRADE,
  GEAR_SLOTS_PER_UPGRADE,
  MAX_COLLECTION_UPGRADES,
  MAX_STORAGE_UPGRADES,
  UPGRADE_COLLECTION_COST,
  UPGRADE_STORAGE_COST,
} from './balance';
import type { SaveData } from './types';

export function collectionCap(save: SaveData): number {
  return BASE_COLLECTION_CAP + (save.upgrades?.collectionCap ?? 0) * COLLECTION_SLOTS_PER_UPGRADE;
}

export function gearStorageSize(save: SaveData): number {
  return BASE_GEAR_SLOTS + (save.upgrades?.storageLevel ?? 0) * GEAR_SLOTS_PER_UPGRADE;
}

export function buyCollectionUpgrade(save: SaveData): SaveData {
  const level = save.upgrades?.collectionCap ?? 0;
  if (level >= MAX_COLLECTION_UPGRADES) throw new Error('Collection already at maximum capacity');
  if (save.coins < UPGRADE_COLLECTION_COST) throw new Error('Not enough coins');
  return {
    ...save,
    coins: save.coins - UPGRADE_COLLECTION_COST,
    upgrades: { collectionCap: level + 1, storageLevel: save.upgrades?.storageLevel ?? 0 },
  };
}

export function buyStorageUpgrade(save: SaveData): SaveData {
  const level = save.upgrades?.storageLevel ?? 0;
  if (level >= MAX_STORAGE_UPGRADES) throw new Error('Gear storage already at maximum');
  if (save.coins < UPGRADE_STORAGE_COST) throw new Error('Not enough coins');
  return {
    ...save,
    coins: save.coins - UPGRADE_STORAGE_COST,
    upgrades: { collectionCap: save.upgrades?.collectionCap ?? 0, storageLevel: level + 1 },
  };
}
