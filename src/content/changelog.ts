/*
 * The "What's new" popup and the Updates list. Add new releases at the top with the next id;
 * the popup shows once per release to players who already had a save.
 */
export interface Release {
  id: number;
  title: string;
  items: string[];
}

export const RELEASES: Release[] = [
  {
    id: 9,
    title: 'Legendary fighters, the Shop and a new Inventory',
    items: [
      '**10 legendary fighters:** Ryuga, Solenne, Seraphine, Aurel, Tharok, Gorvath, Nyxara, Morvain, Volkan and Zephyra. They can never be summoned: collect **10 pieces** to forge one at 5★.',
      '**Legendary pieces** drop from summons (0.5% a pull, focus does not change it), from stage bosses, and the Shop sells one at a time.',
      '**The Shop** opens in the City: six random offers a day plus one gold legendary offer (20 Spin Orbs, a legendary piece or Legendary gear).',
      '**Spin Orbs:** summon spins are now green orbs you keep in your Inventory instead of a currency in the top bar.',
      '**New Inventory** with tabs for Items, Gear, Materials, Evo Shards and Pieces. **Refresh Tickets** and **Respec Scrolls** are new materials.',
      '**Every item has its own look:** each weapon, armor and accessory now has its own model.',
      '**Cleaner Home:** Settings and Updates moved to the top corner, and the daily login reward is a popup.',
      '**Vision City redesign:** new layout, roads and spacing.',
      '**Fix:** leaving the Rival Tower could crash the game on newer browsers.',
    ],
  },
  {
    id: 8,
    title: 'Made for phones, a new logo and dragonvision.online',
    items: [
      'Every screen fits phones from 360px wide, with room for notches and home bars.',
      'Bigger buttons, readable text, and battles that fit both rows of commands on short phones.',
      'The new Dragon Vision logo, app icon and loading screen. Play at **dragonvision.online**.',
    ],
  },
  {
    id: 7,
    title: 'Sound, install as an app, move your save',
    items: [
      'Chiptune music for the City and battles, and sound effects for every hit.',
      'Install Dragon Vision on your phone or computer and play offline.',
      'Copy a save code or download a save file to move your progress to another device.',
    ],
  },
  {
    id: 6,
    title: 'World boss, Endless Survival and achievements',
    items: [
      'A weekly **world boss** in the Colosseum with milestone rewards.',
      '**Endless Survival** at the Survival Gate: how many waves can your team last?',
      'Achievements, titles, a collection log in the Hall of Legends, and a 7-day login track.',
    ],
  },
  {
    id: 5,
    title: 'The stage map, arenas, weather and story',
    items: [
      'A winding road map for every chapter, with bosses waiting at the end.',
      'Every chapter has its own arena and weather, and a story scene to open it.',
    ],
  },
  {
    id: 4,
    title: 'Gear, awakening, combos and fusion',
    items: [
      'Weapons, armor and accessories with five rarities and set bonuses, sold daily at the Armory.',
      'A unique awakening tree for every fighter from 9★.',
      'Combo attacks for nine pairs, and three fusion fighters made in the Fusion Lab.',
      'The class loop: Assassin beats Blaster beats Tank beats Drainer beats Support beats Assassin.',
    ],
  },
  {
    id: 3,
    title: '380 stages and an ending',
    items: [
      '38 chapters, mini-bosses and bosses, and a real ending at stage 380.',
      'The ×10 summon guarantees a fighter one star above your best copy.',
      'Five new City buildings: Fortune Teller, Gravity Chamber, Port, Bounty Board and Rival Tower.',
    ],
  },
  {
    id: 2,
    title: 'Chibi battles, auto runs, Dojo and Fusion Lab',
    items: [
      'Side-view chibi battles with charge-bar specials, revives, shields, stuns and rallies.',
      'Auto-Farm and Auto-Progress, the Training Dojo and the Fusion Lab.',
    ],
  },
  {
    id: 1,
    title: 'Dragon Vision is here',
    items: ['A 5v5 turn-based fighter RPG: summon, evolve and fight your way to the Vision Gate.'],
  },
];

const KEY = 'dragonvision.whatsNewSeen';
export const LATEST_RELEASE = RELEASES[0].id;

/** Releases this player hasn't seen. New players (no save yet) start up to date. */
export function unseenReleases(hadSave: boolean): Release[] {
  try {
    const seen = Number(localStorage.getItem(KEY) ?? (hadSave ? 0 : LATEST_RELEASE));
    if (!hadSave) localStorage.setItem(KEY, String(LATEST_RELEASE));
    return RELEASES.filter((r) => r.id > seen);
  } catch {
    return [];
  }
}

export function markReleasesSeen(): void {
  try {
    localStorage.setItem(KEY, String(LATEST_RELEASE));
  } catch {
    // Shown again next time; harmless.
  }
}
