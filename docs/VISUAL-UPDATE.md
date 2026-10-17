# Visual update

- Preserves the original chibi pixel silhouettes and original fighter palettes; sprites now render at 64×64 with strand highlights, fabric seams, embroidery, cuffs and texture.
- Building art has threefold pixel resolution with roof-edge highlights, masonry shading and surface details.
- Expansive city scene with staggered, stable building positions, mountain layers, a river, paths, trees and drifting lights. A separate narrow-screen layout keeps destinations accessible.
- Shared twilight landscape and a tiled, cracked fighting platform for battles and team formation.
- All 18 fighter families have distinct combinations of beam color, profile, ring count and cadence. Specials amplify the effects; healing/support uses rings. Added impact bursts and charge auras.
- Summon portal with rotating rings, runes, energy buildup and staggered card reveals. Daily fortune also animates. Rewards are committed immediately; leaving during the animation cannot lose a fighter. Repeat clicks during summoning are blocked.
- Pixel SVG resource/navigation/action icons, richer collectible cards, inventory slots, building headers, buttons and panels.
- Reduced-motion preference suppresses movement.

## Validation
Production build and all 54 existing tests pass. Browser screenshot/interaction checks were unavailable because the browser binary download failed in the execution environment. Check desktop and mobile visually before deployment.

## Run
npm ci
npm run dev

## Build
npm run build

The dist directory contains the built version for static hosting. Game rules and save format are unchanged.
