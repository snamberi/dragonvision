import type { Bonus } from './bonus';
import { seededRng } from './rng';

/**
 * Story-stage encounter modifiers: a chapter-wide enemy trait plus a unique arena rule on each wall stage.
 * Both are plain data; battle.ts reads the merged EncounterMods and never special-cases a name.
 */
export interface EncounterMods {
  /** Enemy stat multipliers (0.25 = +25%). */
  enemyAtk?: number;
  enemyDef?: number;
  /** Flat enemy speed. */
  enemySpd?: number;
  /** Front-row enemies start with this share of max HP as a shield. */
  frontShield?: number;
  /** Enemy specials start this many steps charged. */
  enemyCharge?: number;
  /** Added to every enemy's battle bonus (crit, secondWind, ...). */
  enemyBonus?: Partial<Bonus>;
  /** Added to bosses and mini-bosses only. */
  bossBonus?: Partial<Bonus>;
  /** Player starting Ki change. */
  playerKi?: number;
  /** Heals and drains restore nothing (revives still work). */
  noHealing?: boolean;
  /** Enemies below this HP share hit harder by `enrageAtk`. */
  enrageBelow?: number;
  enrageAtk?: number;
  /** Enemies heal this share of the damage they deal. */
  lifesteal?: number;
  /** A fallen enemy hits every standing player for this share of its max HP. */
  koBurst?: number;
}

export interface EncounterEffect {
  id: string;
  name: string;
  text: string;
  mods: EncounterMods;
}

export type TraitId = 'enraged' | 'bulwark' | 'swift' | 'vampiric' | 'volatile';

export const TRAITS: Record<TraitId, EncounterEffect> = {
  enraged: { id: 'enraged', name: 'Enraged', text: 'Enemies deal 20% more damage below half HP.', mods: { enrageBelow: 0.5, enrageAtk: 0.2 } },
  bulwark: { id: 'bulwark', name: 'Bulwark', text: 'Front-row enemies start with a 10% shield.', mods: { frontShield: 0.1 } },
  swift: { id: 'swift', name: 'Swift', text: 'Enemies have +8 SPD.', mods: { enemySpd: 8 } },
  vampiric: { id: 'vampiric', name: 'Vampiric', text: 'Enemies heal 10% of the damage they deal.', mods: { lifesteal: 0.1 } },
  volatile: { id: 'volatile', name: 'Volatile', text: 'A fallen enemy bursts, hitting your team for 5% of its max HP.', mods: { koBurst: 0.05 } },
};

const TRAIT_IDS = Object.keys(TRAITS) as TraitId[];
/** The first chapters stay trait-free so new players learn the basics. */
export const FIRST_TRAIT_CHAPTER = 3;

export function chapterTrait(chapter: number): TraitId | undefined {
  if (chapter < FIRST_TRAIT_CHAPTER) return undefined;
  return TRAIT_IDS[Math.floor(seededRng(chapter * 104_729)() * TRAIT_IDS.length)];
}

/** One arena rule per wall stage (see WALL_STAGES in balance.ts). */
export const WALL_RULES: Record<number, EncounterEffect> = {
  50: { id: 'overclock', name: 'Overclock', text: 'Foundry machines prime their specials: enemy specials start 2 steps charged.', mods: { enemyCharge: 2 } },
  100: { id: 'hellfire', name: 'Hellfire Gate', text: 'Demonic fire empowers the horde: enemies have +15% ATK.', mods: { enemyAtk: 0.15 } },
  180: { id: 'nullfield', name: 'Nullfield', text: 'The Crimson Throne swallows life: no healing for either side.', mods: { noHealing: true } },
  230: { id: 'voidChill', name: 'Void Chill', text: 'The void drains your Ki: your fighters start with none.', mods: { playerKi: -100 } },
  280: { id: 'haste', name: 'Haste Aura', text: 'Grimm’s aura quickens his army: enemies have +15 SPD.', mods: { enemySpd: 15 } },
  330: { id: 'eclipse', name: 'Eclipse', text: 'In the dark, enemies find weak spots: +15% enemy crit chance.', mods: { enemyBonus: { crit: 0.15 } } },
  380: { id: 'lastGate', name: 'Gate Guardian', text: 'The gate will not fall easily: the boss stands back up once at 30% HP.', mods: { bossBonus: { secondWind: 0.3 } } },
};

export function wallRule(stage: number): EncounterEffect | undefined {
  return WALL_RULES[stage];
}

/** Combines effects; numbers add, flags OR, bonus fields add. */
export function mergeMods(...effects: (EncounterEffect | undefined)[]): EncounterMods {
  const out: EncounterMods = {};
  const addBonus = (a: Partial<Bonus> | undefined, b: Partial<Bonus> | undefined): Partial<Bonus> | undefined => {
    if (!b) return a;
    const merged: Partial<Bonus> = { ...a };
    for (const [k, v] of Object.entries(b) as [keyof Bonus, number][]) merged[k] = (merged[k] ?? 0) + v;
    return merged;
  };
  for (const e of effects) {
    if (!e) continue;
    for (const [k, v] of Object.entries(e.mods) as [keyof EncounterMods, unknown][]) {
      if (k === 'enemyBonus' || k === 'bossBonus') out[k] = addBonus(out[k], v as Partial<Bonus>);
      else if (k === 'noHealing') out.noHealing = out.noHealing || (v as boolean);
      else (out as Record<string, number>)[k] = ((out as Record<string, number>)[k] ?? 0) + (v as number);
    }
  }
  return out;
}

/** Wall intro scenes, shown once before the first attempt. Keys are `wall-<stage>`. */
export const WALL_SCENES: Record<number, { who: string; text: string }[]> = {
  50: [
    { who: 'sylas', text: 'The Foundry answers to me now. Every machine here was built to end you.' },
    { who: 'lyra', text: 'Their specials are already charging. Hit fast, or don’t hit at all!' },
  ],
  100: [
    { who: 'grimm', text: 'Welcome to the Demon Gate. My hellfire burns hotter than your hope.' },
    { who: 'kairo', text: 'Then I’ll just have to burn brighter.' },
  ],
  180: [
    { who: 'kael', text: 'On the Crimson Throne, nothing heals. Every wound you take, you keep.' },
    { who: 'orrin', text: 'My light will not reach you here. End it before it ends you.' },
  ],
  230: [
    { who: 'sylas', text: 'The Void Shores drink Ki like water. You arrive empty.' },
    { who: 'varek', text: 'Empty hands still make fists. Charge up and strike.' },
  ],
  280: [
    { who: 'grimm', text: 'Reborn, and faster than ever. My army moves before you blink.' },
    { who: 'jin', text: 'Speed means nothing if they cannot land a hit. Hold the line.' },
  ],
  330: [
    { who: 'mogra', text: 'ECLIPSE. DARK. MOGRA SEE YOUR WEAK SPOT.' },
    { who: 'bruno', text: 'Shields up, everyone. Every crit counts tonight.' },
  ],
  380: [
    { who: 'kael', text: 'The Vision Gate. I fell once. I will not fall twice.' },
    { who: 'kairo', text: 'Then we knock you down twice. Everyone, give it everything!' },
  ],
};

export function wallSceneKey(stage: number): string {
  return `wall-${stage}`;
}
