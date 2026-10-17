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
- Levels are not capped by star; only the global max of 400 applies.

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

## Team
- 1 to 5 fighters. Only one version of each character per team.

## Summoning
- One shared pool of all characters. Each spin is one summon.
- For each character you can roll up to **one star above your best copy** of that character.
  Characters you don't own yet can only roll at 1★.
- Higher stars are rarer: each star is 0.55× as likely as the one below (*placeholder*).
- Focusing a character makes it 5× as likely as each other character (*placeholder*). Never guaranteed.

## Spins, coins and gems
- Spins come only from **first clears**: 1 per normal stage, 5 per mini-boss, 10 per boss.
- Gems: 5 per mini-boss, 15 per boss (*placeholder amounts*), 1% chance of 1 gem on a normal first clear.
- Replays pay 25% of the stage's coins and nothing else.

## Stages
- 180 generated stages in chapters of 10. Stage 5 of each chapter is a mini-boss, stage 10 a boss.
- Stages 1–4 have 1–4 enemies so a new player with only Kairo can progress. From stage 5 on, there are 5 enemies.
- Enemy level grows about 2.2 per stage.

## Battle
- Your whole team acts (fastest first), then the whole enemy team acts.
- Actions: Attack (+10 ki), Ki Blast (30 ki), Special (60 ki), Charge (+40 ki), Guard (half damage until your next turn).
- Specials are per character: single-target beams, hit-all waves, team heals, life-drain.
- Auto mode lets the AI play your side.

## Still open
- Final roster, forms, moves and real sprite art (current sprites are generated placeholders).
- Balance of costs, rewards, odds and boss strength.
- Extra items, sound, desktop/mobile packaging, and the shared Vision universe tie-ins.

## Navigation
- Main tabs: Home, City, Inventory, Stages, Fighters.
- Summoning happens inside the City at the **Summoning Shrine** building. Empty lots mark future buildings.
- Inventory lists coins, gems and summon spins, with empty slots for future items.
