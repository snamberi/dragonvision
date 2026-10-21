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

/** Rarity bucket a family belongs to; controls its base drop rate in the Dragon Fate system. */
export type FamilyTier = 'common' | 'rare' | 'epic' | 'crystal';

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
  /** Legendary fighters are made from pieces, never summoned, and start at this star. */
  legendary?: boolean;
  /** Star of the first form (legendaries start above 1★). */
  firstStar?: number;
  /** Rarity tier for Dragon Fate drop-rate bucketing. Defaults to 'common' if omitted. */
  tier?: FamilyTier;
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
  /** Equipped item ids by slot. */
  gear?: Partial<Record<GearSlotKey, string>>;
  /** Awakening nodes unlocked, by node id. */
  awakened?: string[];
  /** Two rune slots: [offense rune id | null, defense rune id | null]. */
  runeSlots?: (string | null)[];
}

export type GearSlotKey = 'weapon' | 'armor' | 'acc1' | 'acc2';

export interface GearItem {
  id: string;
  templateId: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/** A fighter training in the Dojo since `since` (ms timestamp). */
export interface DojoSlot {
  uid: string;
  since: number;
}

export interface SaveData {
  version: 1;
  /** Personal home preferences and persistent mailbox receipts; optional for older saves. */
  home?: HomeData;
  coins: number;
  gems: number;
  spins: number;
  /** Separate shrine currency; absent on older saves. */
  goldenOrbs?: number;
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
  /** Gravity Chamber level per role. */
  gravity: Record<string, number>;
  expeditions: Expedition[];
  /** Lifetime totals that Bounty Board tasks measure progress against. */
  counters: Counters;
  bounties: BountyState;
  /** Day key of the last free Fortune Teller summon. */
  fortuneDay: string | null;
  /** Highest Rival Tower floor cleared. */
  towerFloor: number;
  /** Gear in the inventory (equipped or not). */
  items: GearItem[];
  nextItemId: number;
  shop: { day: string; refreshes: number; bought: number[] };
  /** Story scenes already shown (chapter numbers and "ending"). */
  seenScenes: string[];
  worldBoss: { week: string; damage: number; day: string; attempts: number; claimed: number[] };
  survivalBest: number;
  /** Achievement ids already claimed. */
  achievements: string[];
  title: string | null;
  /** Every form ever owned, as "familyId:formIndex". */
  seenForms: string[];
  /** Daily login track: last day claimed and how many days claimed in total. */
  login: { day: string; claims: number };
  /** Legendary fighter pieces by family id; 10 make the fighter. */
  pieces: Record<string, number>;
  materials: Record<MaterialId, number>;
  /** The Shop's daily stock (the Armory keeps its own in `shop`). */
  market: { day: string; refreshes: number; bought: number[] };
  /** Legacy pity counter; migrated to `fate` on first load. */
  pityPulls?: number;
  /** Dragon Fate bar (0–100). Rises each pull; Dragon Rage guaranteed Rare+ at ≥56. */
  fate?: number;
  /** Pulls since the last Lucky Pull triggered; resets when one fires. */
  pullsSinceLastLucky?: number;
  /** Upgrades House purchases. */
  upgrades?: {
    /** Extra collection slots bought (+10 each, up to MAX_COLLECTION_UPGRADES). */
    collectionCap: number;
    /** Extra gear storage levels bought (+5 slots each, up to MAX_STORAGE_UPGRADES). */
    storageLevel: number;
  };
  /** Runes in the player's inventory (equipped or not). */
  runes?: import('./rune').Rune[];
  /** Rune fragments accumulated from battle drops and quests. */
  runeFragments?: number;
  /** Weekly challenge counters; reset to 0 each week. */
  weeklyWins?: number;
  weeklyTrains?: number;
  weeklyStages?: number;
}

export interface HomeData {
  name: string;
  residentUid: string | null;
  palette: 'ember' | 'jade' | 'violet';
  banner: 'sun' | 'moon' | 'leaf';
  readMail: string[];
  claimedMail: string[];
}

/** Refresh Tickets refresh a shop for free; Respec Scrolls reset an awakening tree for free. */
export type MaterialId = 'refreshTicket' | 'respecScroll';

export interface Counters {
  wins: number;
  firstClears: number;
  bossWins: number;
  flawlessBossWins: number;
  summons: number;
  evolves: number;
}

export interface Expedition {
  id: number;
  uids: string[];
  start: number;
  hours: number;
  /** Rolled when the party leaves, so reopening the game can't reroll them. */
  reward: { coins: number; spins: number; gems: number };
  /** Safe path returns guaranteed reward; risky path has a 20% fail chance but 1.5× reward. */
  path?: 'safe' | 'risky';
}

export interface BountyPeriod {
  /** Day or week this period covers, e.g. "2026-10-17" or "2026-W42". */
  key: string;
  /** Counter values when the period began; progress is the difference. */
  start: Counters;
  claimed: string[];
}

export interface BountyState {
  daily: BountyPeriod | null;
  weekly: BountyPeriod | null;
}
