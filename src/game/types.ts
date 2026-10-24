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
  /** Transcendence tier for this fighter (0 = none, max 10). Unlocks at level 400. */
  transcendenceTier?: number;
  /** Active skin id; null/omitted uses default art. */
  skinId?: string;
  /** Signature upgrade tier (0 = base, max 3). */
  sigTier?: number;
  /** Team wins this fighter took part in; sets its mastery level. */
  mastery?: number;
  /** Locked fighters are never used up as evolution copies or in bulk sell/fuse. */
  locked?: boolean;
}

/** A saved formation: five pads of unit ids. */
export interface TeamPreset {
  name: string;
  team: (string | null)[];
}

export type GearSlotKey = 'weapon' | 'armor' | 'acc1' | 'acc2';

export type GearSubStat = 'atk' | 'hp' | 'def' | 'crit' | 'spd' | 'ki' | 'specialPower' | 'heal';

/** A rolled bonus stat on a gear piece; Forge Dust rerolls one. */
export interface GearSub {
  stat: GearSubStat;
  value: number;
}

export interface GearItem {
  id: string;
  templateId: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  subs?: GearSub[];
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
  /** Saved formations to swap in from the team screen. */
  teamPresets?: TeamPreset[];
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
  /** Salvaged gear, spent to reroll a stat. */
  forgeDust?: number;
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
  login: {
    day: string;
    claims: number;
    /** Consecutive days claimed, ending on `day`. */
    streak?: number;
    /** A Streak Boss fight is waiting (unlocked every 7th consecutive day). */
    bossReady?: boolean;
  };
  /** Legendary fighter pieces by family id; 10 make the fighter. */
  pieces: Record<string, number>;
  materials: Record<MaterialId, number>;
  /** The Shop's daily stock (the Armory keeps its own in `shop`). */
  market: { day: string; refreshes: number; bought: number[]; ticketsBought?: number };
  /** Pulls with a focus set since the last guaranteed best-star copy. */
  focusPity?: number;
  /** Story wins today that already paid double coins. */
  dailyBoost?: { day: string; wins: number };
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
  // --- New feature fields ---
  /** Daily Dungeon state. */
  dungeon?: DungeonState;
  /** Weekly Boss Raid state. */
  raid?: RaidState;
  /** Side quests cleared per family id. */
  sideQuests?: Record<string, boolean>;
  /** Artifact Relics in inventory. */
  relics?: RelicItem[];
  /** Currently equipped team relic id (one per team, not per fighter). */
  equippedRelic?: string | null;
  /** Owned skin ids. */
  ownedSkins?: string[];
  /** Skin worn by each fighter family (familyId → skin id). */
  skinsEquipped?: Record<string, string>;
  /** This week's event: progress, currency and shop purchases. */
  event?: EventProgress;
  /** Active Wanted Posters (up to 3 at a time). */
  wantedPosters?: WantedPoster[];
  /** Day the current posters were posted; a new set only appears on a new day. */
  wantedDay?: string;
  /** Best floor reached in Infinite Climb this week. */
  climbBest?: number;
  /** Week key for Infinite Climb leaderboard ("2026-W43"). */
  climbWeek?: string;
  /** Best floor of each past week, oldest first (last 8 weeks). */
  climbHistory?: { week: string; best: number }[];
  /** Collector's Journal: completed family chains (familyId → true). */
  journalComplete?: Record<string, boolean>;
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
export type MaterialId = 'refreshTicket' | 'respecScroll' | 'transcendenceCrystal' | 'sigMaterial' | 'relicShard' | 'dungeonKey';

// --- Transcendence ---
/** Post-400 upgrade track: 10 tiers per fighter, stored by uid. */
export type TranscendenceRecord = Record<string, number>;

// --- Artifact Relics ---
export interface RelicItem {
  id: string;
  templateId: string;
  /** Brief description of the global passive it grants. */
  effect: string;
}

// --- Wanted Posters ---
export interface WantedPoster {
  id: string;
  /** Stage to clear. */
  stage: number;
  /** A fighter of this class must be on the winning team. Null means any team. */
  requiredClass: string | null;
  /** Coin reward. */
  coins: number;
  gems: number;
  /** Unix ms when this poster expires. */
  expiresAt: number;
  /** Won the poster's stage today with the required class. */
  done?: boolean;
  claimed: boolean;
}

// --- Daily Dungeon ---
export interface DungeonState {
  day: string;
  rule: string;
  cleared: boolean;
  attempts: number;
}

// --- Boss Raid ---
export interface RaidState {
  /** ISO week key e.g. "2026-W43". */
  week: string;
  /** Current phase (0 = not started, 1-5 = active phase). */
  phase: number;
  totalDamage: number;
  /** Phases already cleared this week. */
  clearedPhases: number[];
  /** This week's boss HP pool, fixed at the first attempt. */
  pool?: number;
  attemptsDay?: string;
  attemptsCount?: number;
}

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

export interface EventProgress {
  week: string;
  /** Highest event stage cleared this week. */
  cleared: number;
  currency: number;
  /** Shop purchases this week by offer id. */
  bought: Record<string, number>;
  /** Replay currency earned on `replayDay`, capped by EVENT_REPLAY_DAILY_CAP. */
  replayDay?: string;
  replayEarned?: number;
}
