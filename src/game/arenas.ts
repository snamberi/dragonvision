import { STAGES_PER_CHAPTER } from './balance';

/**
 * clear: no effect · rain: healing +20% · sandstorm: crit chance −5%
 * snow: everyone starts with 10 less Ki · embers: all damage +10%
 * storm: hit-all attacks +20% · stars: special bars start 1 step charged
 */
export type Weather = 'clear' | 'rain' | 'sandstorm' | 'snow' | 'embers' | 'storm' | 'stars';

export const WEATHER_TEXT: Record<Weather, string> = {
  clear: 'Clear skies',
  rain: 'Rain: healing +20%',
  sandstorm: 'Sandstorm: crit chance −5%',
  snow: 'Snow: everyone starts with 10 less Ki',
  embers: 'Ember winds: all damage +10%',
  storm: 'Thunderstorm: hit-all attacks +20%',
  stars: 'Starlight: specials start 1 step charged',
};

export interface Arena {
  id: string;
  name: string;
  weather: Weather;
  /** Colors for the battle landscape and the stage map. */
  skyTop: string;
  skyBottom: string;
  far: string;
  near: string;
  groundTop: string;
  groundBottom: string;
  floor: string;
  floorEdge: string;
  accent: string;
}

export const ARENAS: Record<string, Arena> = {
  cliffs: { id: 'cliffs', name: 'Highland Cliffs', weather: 'clear', skyTop: '#353563', skyBottom: '#dc9f99', far: '#575379', near: '#466278', groundTop: '#598477', groundBottom: '#253e4d', floor: '#b3aca0', floorEdge: '#8d8d8c', accent: '#d7c99e' },
  desert: { id: 'desert', name: 'Red Dunes', weather: 'sandstorm', skyTop: '#8a4a2a', skyBottom: '#f2c27a', far: '#b46a3a', near: '#c98a4a', groundTop: '#e0b070', groundBottom: '#9a5a2a', floor: '#e8cfa0', floorEdge: '#b08a5a', accent: '#8a3a1a' },
  iron: { id: 'iron', name: 'Iron Fortress', weather: 'clear', skyTop: '#2b2d3a', skyBottom: '#8a92a8', far: '#3f4452', near: '#555b6b', groundTop: '#6b7080', groundBottom: '#2b2d33', floor: '#9aa0b0', floorEdge: '#5f6470', accent: '#ffb02e' },
  space: { id: 'space', name: 'Pale Star Fleet', weather: 'stars', skyTop: '#07061a', skyBottom: '#3b2a6b', far: '#1a1240', near: '#2b1f5c', groundTop: '#4a3a8a', groundBottom: '#1a1240', floor: '#c9c2e0', floorEdge: '#7a6fa8', accent: '#e9e4ff' },
  foundry: { id: 'foundry', name: 'Android Foundry', weather: 'embers', skyTop: '#2a1a12', skyBottom: '#c96a2a', far: '#4a2a1a', near: '#6b3a1a', groundTop: '#7a4a2a', groundBottom: '#2a1a12', floor: '#a08070', floorEdge: '#6b4a3a', accent: '#ff8a1f' },
  volcano: { id: 'volcano', name: 'Mountain of Rage', weather: 'embers', skyTop: '#1a0a0a', skyBottom: '#c8322a', far: '#3a1212', near: '#5a1a12', groundTop: '#4a2a22', groundBottom: '#1a0a0a', floor: '#6b4a42', floorEdge: '#3a2222', accent: '#ff4a3d' },
  moon: { id: 'moon', name: 'Shattered Moon', weather: 'stars', skyTop: '#0a1028', skyBottom: '#4a6ab0', far: '#2a3a6b', near: '#3a4a7a', groundTop: '#b8c6e8', groundBottom: '#5a6a9a', floor: '#d8e0f0', floorEdge: '#8a9ac0', accent: '#ffffff' },
  throne: { id: 'throne', name: 'Tyrant Throne', weather: 'clear', skyTop: '#1a0a2a', skyBottom: '#7a3fa8', far: '#2b1a4a', near: '#3b2a6b', groundTop: '#5b3fa8', groundBottom: '#1a1240', floor: '#c9a227', floorEdge: '#7a5a12', accent: '#ffd23f' },
  rift: { id: 'rift', name: 'Rift of Echoes', weather: 'storm', skyTop: '#0a1a2a', skyBottom: '#3fa8a8', far: '#1a3a4a', near: '#2a4a5a', groundTop: '#3a6a7a', groundBottom: '#0a1a2a', floor: '#9ae6e6', floorEdge: '#4a8a9a', accent: '#b794ff' },
  demon: { id: 'demon', name: 'Demon Gate', weather: 'embers', skyTop: '#12040a', skyBottom: '#7a1222', far: '#2a0a12', near: '#4a0a1a', groundTop: '#3a1a22', groundBottom: '#12040a', floor: '#5a2a32', floorEdge: '#2a0a12', accent: '#ff2f4a' },
  swamp: { id: 'swamp', name: 'Larva Swamp', weather: 'rain', skyTop: '#1a2a1a', skyBottom: '#6a8a5a', far: '#2a3a2a', near: '#3a4a2a', groundTop: '#4a6a3a', groundBottom: '#1a2a12', floor: '#7a8a5a', floorEdge: '#4a5a32', accent: '#b6f28c' },
  hive: { id: 'hive', name: 'Hive Cathedral', weather: 'clear', skyTop: '#2a1a0a', skyBottom: '#c9a227', far: '#4a3a1a', near: '#6b4a1a', groundTop: '#8a6a2a', groundBottom: '#2a1a0a', floor: '#e0c070', floorEdge: '#8a6a2a', accent: '#8fd16a' },
  tournament: { id: 'tournament', name: 'Grand Tournament', weather: 'clear', skyTop: '#3a8ad8', skyBottom: '#c4e6f7', far: '#7a9ab0', near: '#6a8a6a', groundTop: '#8fbf45', groundBottom: '#4a7a2a', floor: '#e9dcc0', floorEdge: '#b0a080', accent: '#d8432e' },
  blossom: { id: 'blossom', name: 'Blossom Valley', weather: 'rain', skyTop: '#c96a9a', skyBottom: '#ffd9e8', far: '#b07aa0', near: '#8a6a8a', groundTop: '#a8d68a', groundBottom: '#5a8a4a', floor: '#f4e0e8', floorEdge: '#c0a0b0', accent: '#ff8fbf' },
  thunder: { id: 'thunder', name: 'Thunder Peaks', weather: 'storm', skyTop: '#0a0f2a', skyBottom: '#4a5a8a', far: '#1a2240', near: '#2a3252', groundTop: '#3a4a6a', groundBottom: '#0a0f2a', floor: '#8a9ab0', floorEdge: '#4a5a7a', accent: '#7fe7ff' },
  frost: { id: 'frost', name: 'Frozen Citadel', weather: 'snow', skyTop: '#4a6a9a', skyBottom: '#e8f0ff', far: '#8aa0c0', near: '#a0b8d8', groundTop: '#e8f0ff', groundBottom: '#8aa0c0', floor: '#f4f8ff', floorEdge: '#a0b0c8', accent: '#3fc6ff' },
  void: { id: 'void', name: 'Void Shores', weather: 'stars', skyTop: '#000000', skyBottom: '#2a0a3a', far: '#12061a', near: '#1a0a2a', groundTop: '#2a1240', groundBottom: '#000000', floor: '#4a2a6a', floorEdge: '#1a0a2a', accent: '#ff2f4a' },
  sky: { id: 'sky', name: 'Sky Temple', weather: 'clear', skyTop: '#5aa8f0', skyBottom: '#fff6d8', far: '#c4e0f7', near: '#e8f4ff', groundTop: '#f4ecd8', groundBottom: '#c9b898', floor: '#fff6e0', floorEdge: '#d0c0a0', accent: '#ffd23f' },
};

/** One arena per chapter, matching its name. */
const CHAPTER_ARENAS = [
  'cliffs', 'desert', 'iron', 'space', 'foundry', 'volcano', 'moon', 'throne', 'rift', 'demon',
  'swamp', 'hive', 'tournament', 'blossom', 'thunder', 'tournament', 'rift', 'throne',
  'space', 'frost', 'iron', 'sky', 'void', 'foundry', 'sky', 'demon', 'desert', 'demon',
  'rift', 'moon', 'throne', 'thunder', 'void', 'frost', 'space', 'tournament', 'iron', 'void',
];

export function arenaForChapter(chapter: number): Arena {
  return ARENAS[CHAPTER_ARENAS[(chapter - 1) % CHAPTER_ARENAS.length]];
}

export function arenaForStage(stage: number): Arena {
  return arenaForChapter(Math.ceil(stage / STAGES_PER_CHAPTER));
}
