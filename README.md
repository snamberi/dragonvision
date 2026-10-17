# Dragon Vision

A pixel-art, turn-based 5v5 fighter-collection RPG from Vision Creators. Collect fighters,
level them with coins, evolve them with duplicates, and push through stages and bosses.
Everything runs on the device; no internet connection or server is needed.

## Run it

```bash
npm install
npm run dev        # play at http://localhost:5173
npm test           # game-rule tests
npm run build      # production build in dist/
```

## Project layout

| Path | What it holds |
|---|---|
| `src/game/balance.ts` | Every tunable number: costs, rewards, odds, battle values |
| `src/game/roster.ts` | Fighters, their forms (one per star), stats and specials |
| `src/game/progression.ts` | Levels, evolution, gem resets, team rules |
| `src/game/summon.ts` | Shared summon pool, focus, one-tier-ahead cap |
| `src/game/stages.ts` | Stage generation, bosses, first-clear vs replay rewards |
| `src/game/battle.ts` | Turn-based battle engine and enemy AI |
| `src/game/save.ts` | Local save on the device |
| `src/art/sprite.ts` | Placeholder procedural pixel sprites |
| `src/ui/` | React screens |
| `docs/DESIGN.md` | Design rules as implemented, and what is still open |

The game rules in `src/game/` do not depend on the UI, so they can be tested on their own
and reused if the presentation layer changes.

## Platforms

- **Browser:** deploy `dist/` to any static host.
- **Desktop and mobile:** planned. The build uses relative paths so it can be wrapped as a
  desktop app or as an Android/iOS app with Capacitor without changes.
