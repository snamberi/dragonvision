import { STAGES_PER_CHAPTER } from './balance';

export type TerrainType = 'plains' | 'volcano' | 'forest' | 'ruins' | 'ice' | 'sky';

export interface TerrainEffect {
  type: TerrainType;
  name: string;
  playerAtkMult: number;
  playerDefMult: number;
  enemyAtkMult: number;
  enemyDefMult: number;
}

const NEUTRAL = 1.0;
const SLIGHT_UP = 1.05;
const SLIGHT_DOWN = 0.95;

export const TERRAINS: Record<TerrainType, TerrainEffect> = {
  plains: { type: 'plains', name: 'Open Plains', playerAtkMult: NEUTRAL, playerDefMult: NEUTRAL, enemyAtkMult: NEUTRAL, enemyDefMult: NEUTRAL },
  volcano: { type: 'volcano', name: 'Volcanic Ridge', playerAtkMult: SLIGHT_UP, playerDefMult: SLIGHT_DOWN, enemyAtkMult: SLIGHT_UP, enemyDefMult: NEUTRAL },
  forest: { type: 'forest', name: 'Dense Forest', playerAtkMult: NEUTRAL, playerDefMult: SLIGHT_UP, enemyAtkMult: SLIGHT_DOWN, enemyDefMult: NEUTRAL },
  ruins: { type: 'ruins', name: 'Ancient Ruins', playerAtkMult: SLIGHT_UP, playerDefMult: NEUTRAL, enemyAtkMult: SLIGHT_UP, enemyDefMult: SLIGHT_UP },
  ice: { type: 'ice', name: 'Frozen Wastes', playerAtkMult: SLIGHT_DOWN, playerDefMult: SLIGHT_UP, enemyAtkMult: NEUTRAL, enemyDefMult: SLIGHT_UP },
  sky: { type: 'sky', name: 'Sky Fortress', playerAtkMult: SLIGHT_UP, playerDefMult: SLIGHT_UP, enemyAtkMult: SLIGHT_UP, enemyDefMult: SLIGHT_UP },
};

const TERRAIN_CYCLE: TerrainType[] = ['plains', 'volcano', 'forest', 'ruins', 'ice', 'sky'];
const TERRAIN_CYCLE_LEN = TERRAIN_CYCLE.length;

export function getStageTerrainType(stage: number): TerrainType {
  const chapter = Math.floor((stage - 1) / STAGES_PER_CHAPTER);
  return TERRAIN_CYCLE[chapter % TERRAIN_CYCLE_LEN];
}

export function getTerrainEffect(stage: number): TerrainEffect {
  return TERRAINS[getStageTerrainType(stage)];
}
