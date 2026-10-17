export type HairStyle =
  | 'spiky'
  | 'spikyTall'
  | 'long'
  | 'bald'
  | 'flame'
  | 'braids'
  | 'horns'
  | 'crest'
  | 'mohawk'
  | 'visor'
  | 'topknot'
  | 'ponytail'
  | 'bob';

/** Everything the procedural sprite painter needs to draw one form. */
export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  outfit: string;
  accent: string;
  boots: string;
  /** Glow drawn around the fighter; omit for no aura. */
  aura?: string;
  /** Kid forms are drawn smaller. */
  small?: boolean;
  /** Large brutes and bosses are drawn bigger. */
  large?: boolean;
}

/**
 * beam: big single-target hit · wave: hits every enemy · heal: heals every ally
 * drain: hit and heal self · revive: bring back a fallen ally (once per battle)
 * shield: every ally gets a damage shield · stun: hit and skip the target's next turn
 * rally: every ally hits harder for two turns
 */
export type SpecialKind = 'beam' | 'wave' | 'heal' | 'drain' | 'revive' | 'shield' | 'stun' | 'rally';

export interface Special {
  name: string;
  kind: SpecialKind;
  /** Damage multiplier for attacks; share of max HP for heals, revives and shields; attack bonus for rally. */
  power: number;
  /** Moves the fighter must make to fill the special bar. Using the special is free. */
  charge: number;
}

export interface Form {
  name: string;
  look: Look;
}

export interface Family {
  id: string;
  /** Short name used when a form has no distinct name. */
  name: string;
  title: string;
  /** Forms in star order. Stars past the last form keep the last form. */
  forms: Form[];
  base: { hp: number; atk: number; def: number; spd: number };
  special: Special;
  villain?: boolean;
}

/** One fighter the player owns. */
export interface Unit {
  uid: string;
  familyId: string;
  star: number;
  level: number;
  /** Level the fighter had when summoned; it can never be refunded. */
  baseLevel: number;
  /** Coins spent on purchased levels, refunded by a gem reset. */
  coinsSpent: number;
  /** Free levels earned in the Training Dojo; kept through a gem reset. */
  trainedLevels?: number;
}

/** A fighter training in the Dojo since `since` (ms timestamp). */
export interface DojoSlot {
  uid: string;
  since: number;
}

export interface SaveData {
  version: 1;
  coins: number;
  gems: number;
  spins: number;
  units: Unit[];
  /**
   * Five formation slots (null = empty pad), at most one fighter per family.
   * Slots 1, 3 and 5 are the front row; slots 2 and 4 are the back row.
   */
  team: (string | null)[];
  /** Highest stage cleared; the next stage is the only new one available. */
  clearedStage: number;
  focusFamilyId: string | null;
  nextUid: number;
  /** Fighters training in the Dojo. */
  dojo: DojoSlot[];
  /** Evolution shards by star: each counts as one duplicate when evolving a fighter of that star. */
  shards: Record<number, number>;
}
