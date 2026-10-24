import { type Light, landmarkUrl } from './landmarks';

export type { Light };

// Flat, front-facing pixel buildings for Vision City (see landmarks.ts). Pass a light level to relight windows at dusk and night.
export const shrineUrl = (light?: Light) => landmarkUrl('shrine', light);
export const shopUrl = (light?: Light) => landmarkUrl('shop', light);
export const armoryUrl = (light?: Light) => landmarkUrl('armory', light);
export const labUrl = (light?: Light) => landmarkUrl('lab', light);
export const tentUrl = (light?: Light) => landmarkUrl('fortune', light);
export const eventTentUrl = (light?: Light) => landmarkUrl('event', light);
export const upgradesHouseUrl = (light?: Light) => landmarkUrl('upgrades', light);
export const dojoUrl = (light?: Light) => landmarkUrl('dojo', light);
export const gravityUrl = (light?: Light) => landmarkUrl('gravity', light);
export const boardUrl = (light?: Light) => landmarkUrl('board', light);
export const hallUrl = (light?: Light) => landmarkUrl('hall', light);
export const journalUrl = (light?: Light) => landmarkUrl('journal', light);
export const colosseumUrl = (light?: Light) => landmarkUrl('colosseum', light);
export const towerUrl = (light?: Light) => landmarkUrl('tower', light);
export const gateUrl = (light?: Light) => landmarkUrl('gate', light);
export const climbUrl = (light?: Light) => landmarkUrl('climb', light);
export const portUrl = (light?: Light) => landmarkUrl('port', light);
export const dungeonUrl = (light?: Light) => landmarkUrl('dungeon', light);
export const raidUrl = (light?: Light) => landmarkUrl('raid', light);
