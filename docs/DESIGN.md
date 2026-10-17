# Dragon Vision design rules (as implemented in v0.1)

Numbers live in `src/game/balance.ts`. Everything marked *placeholder* is a first guess to tune.

## Fighters and forms
- 18 original characters in an anime-fighter style (no licensed characters): 12 heroes and 6 villains.
- The starter is **Kid Kairo** (1★, level 1).
- Each star is one form. Fighters with fewer forms than stars keep their last form and still gain stars.
- Max **21 stars**, max **level 400**.

## Levels
- Levels are bought with coins, per fighter. Cost rises with level (*placeholder curve*).
- A summoned fighter's starting level depends on its star: star *s* arrives between level
  `(s-1)×20` and `s×20` (1★: 1–20, 2★: 20–40, 20★: 380–400, 21★: 400).
- **Level wall:** a fighter can't level past `star × 20` (1★ → 20, 2★ → 40, … 20★ → 400). It must
  evolve to keep leveling. 21★ stays at the 400 max.

## Evolution (stars)
- To go from *s*★ to *s+1*★: reach level `s×20`, and own **two more copies of the same fighter
  at the same star**. Copies can be any level.
- Evolution keeps the level, raises the star, changes the form if there is a new one, and
  consumes the two copies.
- Copies not on the team and with the fewest coins invested are used first.
- If a copy that will be used has purchased levels, the game warns and offers a gem refund first.

## Gem reset
- Costs 3 gems (*placeholder*). Returns the fighter to the level it was summoned at and refunds
  every coin spent on it. Summoned levels can never be refunded.

## Team and formation
- 1 to 5 fighters on five pads. Only one version of each character per team.
- Pads 1, 3, 5 are the **front row**; pads 2 and 4 are the **back row**. Enemies use the same layout
  (first enemy on pad 1, and so on).
- Move fighters on the Fighters screen by dragging, or by tapping a fighter and then another pad.

## Summoning
- One shared pool of all characters. Each spin is one summon.
- For each character you can roll up to **one star above your best copy** of that character.
  Characters you don't own yet can only roll at 1★.
- Higher stars are rarer: each star is 0.55× as likely as the one below (*placeholder*).
- **10× summon guarantee:** the 10th pull is always one star above your best copy of a character you
  owned before the 10× started.
- Focusing a character makes it 5× as likely as each other character (*placeholder*). Never guaranteed.

## Spins, coins and gems
- Free spins come from **first clears**: 1 per normal stage, 5 per mini-boss, 10 per boss.
- Spins can also be **bought with coins** at the Summoning Shrine. The price is half the coins of your
  latest stage's first clear. Without this, the level wall could lock a player out for good: they'd need
  duplicates to evolve, but could no longer win new stages to earn spins.
- Gems: 5 per mini-boss, 15 per boss (*placeholder amounts*), 1% chance of 1 gem on a normal first clear.
- Replays pay 25% of the stage's coins and nothing else.

## Stages
- **380 stages** in 38 named chapters of 10, in four acts. Stage 5 of each chapter is a mini-boss, stage 10 a boss.
- **The end:** stage 380, *The Vision Gate*, a 21★ Kael boss. Clearing it shows the ending.
- Enemies reach level 400 around stage 180. After that they gain a star every 25 stages (21★ by the end) and
  get up to 54% stronger. In simulation a fully maxed 21★ team clears stage 300+ only with Gravity Chamber
  upgrades, and beats the final boss about 70% of the time with everything maxed.
- Stages 1–4 have 1–4 enemies so a new player with only Kairo can progress. From stage 5 on, there are 5 enemies.
- Enemy level grows about 2.2 per stage.

## Battle
- Your whole team acts (fastest first), then the whole enemy team acts.
- Actions: Attack (+10 Ki), Ki Blast (30 Ki), Charge (+40 Ki), Guard (half damage until your next turn), Special.
- **Specials use a charge bar, not Ki.** Every non-special move adds one charge. When the bar is full
  (2–4 moves, set per character) the special is free, then the bar empties.
- Special types: beam (big single hit), wave (hits all), heal (heals all), drain (hit + self-heal),
  **revive** (one fallen ally back at 40% HP, once per battle), **shield** (each ally gets a 25% max-HP
  shield, capped at 40%), **stun** (hit + target skips its next turn; bosses resist), **rally** (allies +30%
  damage for 2 turns).
- Auto mode lets the AI play your side.

## Still open
- Final roster, forms, moves and real sprite art (current sprites are generated placeholders).
- Balance of costs, rewards, odds and boss strength.
- Extra items, sound, desktop/mobile packaging, and the shared Vision universe tie-ins.

## Navigation
- Main tabs: Home, City, Inventory, Stages, Fighters.
- Summoning happens inside the City at the **Summoning Shrine** building. Empty lots mark future buildings.
- Inventory lists coins, gems and summon spins, with empty slots for future items.

## Card rarity (visual only)
| Stars | Tier | Look |
|---|---|---|
| 1 | Common | grey border, plain background |
| 2–3 | Uncommon | green border, energy-burst background (all evolved fighters get one) |
| 4–6 | Rare | blue border, twinkling sparkles |
| 7–10 | Epic | purple border, faster sparkles |
| 11–15 | Legendary | gold border, outer glow, light sweep |
| 16–20 | Mythic | red border, glow, sweep, flickering aura |
| 21 | Ultimate | animated rainbow border plus all effects |

Roles come from each character: heal special → Support, drain special → Drainer,
120+ base HP → Tank, hit-all special → Blaster, otherwise Assassin.

## Formation and role rules in battle
- Single-target attacks (Attack, Ki Blast, beam and drain specials) can only hit the front row while
  anyone in it is standing. Once the front row falls, the back row is open.
- A **Tank** in the front row draws every single-target attack aimed at its side, and takes 15% less damage.
- Back-row fighters take 20% less damage from hit-all attacks.
- **Assassin:** +15% single-target damage. **Blaster:** +15% hit-all damage.
- **Support:** heals 20% more. **Drainer:** drain heals 75% of damage dealt (others 50%).
- Turn order inside a side is still fastest first.

## Auto battles
- **Auto-Farm** (cleared stages): replays the stage on Auto for 5/10/25/50 runs or until stopped, at
  the normal 25% replay reward. Stops on a defeat.
- **Auto-Progress** (the next new stage): clears new stages one after another on Auto. Stops before any
  mini-boss or chapter boss, and on a defeat.
- Battles have a 1×/2×/4× speed button; auto runs start at 2× or faster.

## City buildings
- **Summoning Shrine:** summon, focus, and buy spins with coins.
- **Training Dojo:** 3 mats. Fighters not on the team gain 1 level per 10 real minutes, even while the
  game is closed, up to their level wall. Trained levels are free and survive gem resets. Training
  fighters can't join the team and are never used up as evolution copies.
- **Fusion Lab:** works only on spare copies (not on the team, not in the Dojo, not a character's best copy).
  Fuse 3 spares of the same star into an **evolution shard** of that star; a shard counts as one duplicate
  when evolving any fighter of that star. Or sell spares for coins (20 × star² + 2 × level, plus any coins
  spent leveling them).

- **Fortune Teller:** one free summon per day, and a daily lucky fighter who is 3× as likely in every summon.
- **Gravity Chamber:** coins buy permanent role upgrades, +2% HP/attack/defense per level for every
  fighter of that role, up to level 25 (cost 2,000 × 1.3^level).
- **Expedition Port:** send 1–3 idle fighters on 1, 4 or 8 hour trips for coins, spins on longer trips, and a
  chance of gems. Two trips at once. Rewards are rolled when they leave. Recalling early gives nothing.
- **Bounty Board:** 3 daily and 4 weekly tasks (wins, summons, new clears, evolutions, boss wins, a flawless
  boss win) paying spins and gems. Days reset at local midnight, weeks on Monday.
- **Rival Tower:** 30 floors of themed rival squads, each with a rule (only 3 fighters, enemies start
  charged, enemies start shielded, or enemies have 50% more HP). Each floor pays once: coins and 2 spins,
  plus 5 gems and an evolution shard (3★ up to 8★) every 5th floor.

## Classes
Five classes in a loop, each beating the next: **Assassin → Blaster → Tank → Drainer → Support → Assassin**.
Hitting the class you beat deals 25% more damage; hitting the class that beats you deals 15% less.
(Striker was renamed Assassin.)

## Gear
- Every fighter has 4 slots: 1 weapon, 1 armor, 2 accessories. Gear lives in the Inventory and can be moved
  between fighters at any time; it is never lost when a fighter is used up.
- Rarities: Common, Uncommon, Rare, Epic, Legendary (×1, ×1.6, ×2.4, ×3.5, ×5 stats).
- Weapons add attack, armor adds HP and a starting shield, accessories add crit, speed, Ki, defense, HP,
  healing or attack depending on the piece.
- 5 sets of 4 pieces (weapon, armor, 2 different accessories):
  Ember (2: +10% ATK, 4: special starts 1 step charged), Bulwark (2: +15% HP, 4: start with a 20% shield),
  Tempest (2: +4 SPD, 4: +15% crit), Sage (2: +20% healing, 4: +40 starting Ki),
  Void (2: +8% ATK, 4: +20% more damage vs the class it beats).
- **Armory** (City): 6 items a day, better rarities deeper in the story, Epic/Legendary also cost gems,
  new stock for 5 gems. Unworn gear can be sold.
- Bosses drop a Rare-or-better piece on the first clear, mini-bosses Uncommon-or-better.

## Stage map, arenas, weather, story
- Stages are a winding road per chapter (stage 1 at the bottom), with mini-boss and boss stops shown with
  their villain, your team leader standing on the next stage, and a sheet with details when a stop is tapped.
- 18 arena themes, one per chapter, recolor the map and the battle landscape.
- Each arena has weather: rain (healing +20%), sandstorm (crit −5%), snow (start with 10 less Ki),
  ember winds (all damage +10%), thunderstorm (hit-all +20%), starlight (specials start 1 step charged).
- Every chapter opens with a short skippable story scene the first time its first stage is played.

## Weekly world boss (Colosseum)
- One boss a week (rotating villains and Grylas), scaled to your story progress, with an HP pool 40× its
  normal HP. Each attempt is 8 rounds; the damage stays. 3 attempts a day.
- Rewards at 25% (5 spins), 50% (10 gems), 75% (Epic gear + 5 spins), defeated (Legendary gear, 15 gems, 2 shards).

## Endless Survival (Survival Gate)
- Endless waves, 4 levels stronger each wave, mini-boss every 5th. HP, Ki and special bars carry over; no healing.
- Pays coins per wave cleared and a spin every 5 waves; best wave is recorded.

## Hall of Legends
- 19 achievements paying gems/spins; most unlock a title shown on Home.
- Collection log of every form ever owned (including fusions), shown as silhouettes until found.

## Daily login
- A 7-day track on Home (coins, spins, gems, Rare gear, shard + gems), one claim per day, loops forever,
  and missing a day never resets it.
