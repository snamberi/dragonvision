# DragonVision visual update

## Included

1. **Fighter designs.** All 18 base, 3 fusion and 10 legendary families have a stable visual identity. A new 48×48 pixel artboard preserves original form palettes and hairstyles while adding lean, balanced and heavy proportions, facial details, uniform trim, and family accessories such as blades, armor, wings, staffs, crowns and tails.
2. **Painted character poses.** Idle/breathing/blinking, charge, punch, hurt, victory, guard and walking use newly painted body/limb positions. CSS steps animate cached sprite sheets rather than re-rendering React on every frame. Portraits use the same family art.
3. **Signature attacks.** Every family has an explicit signature: Solar Wave, Royal Cannon, Twin Comet, Thunder Palm, Pulse Storm, Quake Slam, Crescent Slash, Petal Storm, Starfall, Rift Rebirth, Dragon Fist, Magma Cataclysm and the rest have their own shapes and accents. Support visuals appear on recipients. Offensive effects connect to the fighters actually hit; waves cover all their targets.
4. **City layout restored.** The original desktop streets and mobile switchback layout, scenery and labels are restored at the user's request. On desktop, the Summoning Shrine now shares the Colosseum's top row while keeping its original center column.
5. **City decorations reverted.** The added residents, training fighter, chimney smoke, banners, window glow, fireflies and water animations are removed from the city exterior.
6. **Interiors.** All 13 destinations have illustrated scenes: dojo mats and shoji windows, an armory forge and weapon racks, fusion pods and conduits, gravity machinery, a harbor, posted bounties, a fortune tent, tower stairs, trophies, a colosseum entrance, and the gate and summoning sanctum.
7. **Fighter cards.** Larger artwork, family palettes and landscape motifs, readable labels, and distinct common-through-ultimate frames. Legendary cards have crown details; evolved artwork extends beyond its scenic area.
8. **Summoning.** Portal charge → silhouette → rarity-colored entrance → results. Ten pulls reveal sequentially, with a Reveal all control; single pulls can be skipped. Reduced motion reveals results immediately. Results are committed when the pull succeeds, so navigation and skipped animation cannot discard rewards.
9. **Combat presentation.** Explicit anticipation, release, impact and recovery phases; brief impact hold; directional recoil; stacked readable hit text; named special callouts; larger effects reserved for specials; a celebrating squad in the victory panel. Actions resolve once, and rewards/auto-run continuation wait for the animation to finish. Pending timers are cleared on exit.
10. **Mobile.** Larger in-screen labels and touch controls, responsive cards/interiors and readable command buttons. Reduced-motion handling covers sprite frames and interior effects. The city uses its original controls and presentation.

## Personal sanctuary

- A single detailed house with warm windows, a porch, hanging banner and chimney smoke. The yard has a pond, flowers, trees, bench, fence and a winding path to Vision City.
- The house panel saves a name, roof color, banner and an owned resident, including evolved forms. Earned titles can be equipped here. The profile shows actual progress.
- A mailbox presents welcome and update letters on parchment, with unread markers and filters. Its housewarming parcel awards 2 Spin Orbs once per save. Read and claim receipts survive export/import.
- The daily chest uses the existing seven-day reward track and claim rule. It stays open after collection. The top-bar daily shortcut uses the same illustrated panel. Rewards and updates now wait in the yard instead of interrupting entry with automatic popups.
- The trophy shelf displays claimed achievements. Its panel shows actual milestone progress and uses the existing achievement reward rules.
- The training dummy opens a free signature preview for the resident, with charge, attack and recovery poses, real signature artwork, and supportive effects for support moves. Practice spends no resources and creates no battle rewards.
- Home panels have keyboard focus containment, Escape/backdrop close, focus restoration, mobile layouts, and reduced-motion handling. Preview timers are cleaned up on close.
- A stale resident selection falls back to a fighter the player still owns; old saves receive default home preferences without a reset.

## Preserved

- The approved city layout and the shrine's new top-row position are unchanged by the Home update.
- Combat rules, currency costs, summon odds and roster stats are unchanged. Save version 1 supports an optional home field for preferences and mailbox receipts.
- Existing local saves are compatible. No external image service or new dependency is required.
- The service-worker cache version is advanced so deployments refresh the visual assets.

## Validation

- TypeScript check and Vite production build pass using the versions in the existing lockfile.
- All 89 tests pass, including five new checks for old-save compatibility, resident ownership, one-time parcels, and export/import persistence.
- Chromium checks cover desktop, 390px phones and 360px phones; all 13 interiors fit without horizontal scrolling.
- All 31 family signatures and the new pose sets render without runtime errors.
- Interaction checks cover rapid summon input, all ten reveal cards, navigation during a pull, reduced motion, rapid combat input, special attacks, a single victory payout, auto-farm completion, and retreat cleanup.
- Home browser checks cover saving and reloading cosmetics and residents, duplicate claim protection, letter read state, trophy collection, resource-free practice, focus handling, reduced motion, fresh saves and all six panel entry points on a narrow phone.

## Build and deploy

```sh
npm ci
npm run build
```

Deploy the generated `dist/` directory with your existing hosting workflow.
