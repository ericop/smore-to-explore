# Smore to Explore: Development Roadmap

This is the execution roadmap for the next, longer phase of work on Smore to Explore. It is written so an AI agent (or a human) can pick up any phase and execute it independently, with a clear "done when" gate for each step.

Read [`AI_CONTEXT.md`](AI_CONTEXT.md) first for architecture conventions, then this file for what to build and in what order.

## What we are building (five workstreams)

1. **Robust on mobile + desktop** at the live URL (https://ericop.github.io/smore-to-explore/), playable on almost any device.
2. **Confirm and adjust balance** of the market and goals (buff / nerf / re-frequency), driven by data.
3. **Playtest 2 to 5 players** about ten times to confirm UX, fun, and that no early choice makes you unable to compete.
4. **Computer players**, mix-and-match with pass-and-play humans, distinct strategies, pickable per seat.
5. **A cartoon facelift** (cute-animal, camping-true) that swaps the visuals while leaving all game logic in place.

A sixth workstream emerged from playtest feedback and is woven into the order below: **placement-fun and onboarding** (make laying out the campground reliably satisfying, and teach the genuinely tricky rules).

## Design pillars (the why behind every decision)

- **The layout IS the fun (Kingdomino / Patchwork benchmark).** Building the campground must feel like a satisfying, expressive spatial puzzle. The signature failure to design out is: "I had a cool plan but could not place tiles the way I wanted because of a technicality I did not understand, and it went from fun to stupid." Constraints must be understandable and plannable in advance, never invisible gotchas. This is a game-design mandate, not only a teaching one: for each hard rule we triage between *simplify the rule* (when it is an opaque technicality) and *keep and teach it* (when it is an intentional, satisfying-once-understood risk).
- **Tabletop-faithful.** The digital game emulates a physical board game, and a real tabletop edition is a future goal. Prefer rules a human could adjudicate with physical cards and tiles. Keep components legible as components (tiles, draw-deck cards, goal cards, money). Do not add digital-only mechanics that could not be reproduced on a table. AI players are a digital convenience only. Keep `CAMP_TILE_DEFS`, the objective decks, and deck counts as a clean "component manifest" the printable rulebook and a future physical edition can draw from.

## Guiding constraints (do not violate)

- No frameworks, no build step, no npm runtime dependencies. The game must stay openable as a static file and deployable to GitHub Pages as-is.
- One copy of game logic, shared by the browser game and the headless simulation. Never duplicate rules.
- Never break human pass-and-play. The browser code path must behave exactly as it does today.
- **Branch per phase/step.** Merge to `main` only when that step's gate passes, because merging to `main` auto-deploys to the live URL (`.github/workflows/deploy-pages.yml`). The live site must never serve a broken intermediate.

## Codebase orientation (verified)

Three files load as `defer` scripts from [`index.html`](index.html):

- [`smore-core.js`](smore-core.js): utilities. `shuffle` and `pickWeighted` (the two `Math.random()` call sites, lines 19 and 29) and canvas/text helpers. Exported as `window.SmoreCore` at line 298.
- [`smore-objectives.js`](smore-objectives.js): `window.SmoreObjectiveFactory`, every goal-card definition and its `evaluate(context)` scoring logic.
- [`smore-to-explore.js`](smore-to-explore.js): everything else, inside one IIFE: game state, market, placement validation, scoring, turn flow, rendering, input.

Key reuse points (confirmed to exist):

- **`createEvaluationContext(game, player)`** is pure (no DOM) and already computes every board metric an AI needs: camp/amenity type counts, road-graph analysis (loops, hubs, dead-ends, longest path), quadrant development, aligned runs, distances to Entrance/Office, premium and variety counts. The objective `evaluate()` functions consume it. **AI move-scoring is just a diff of this context before/after a hypothetical move: it reuses existing logic and writes none.**
- **Placement oracles**: `getLandscapePlacementReasons(...)` and `getCampTilePlacementEvaluation(...)` return why a placement is legal or blocked. Reuse these for the AI's legal-move enumeration, for legal-cell highlighting, and for "why blocked" messages.
- **Turn flow mutators**: `attemptLandscapePlacement`, `attemptCampPlacement`, `selectMarketTile`, `passCurrentPlayerForRound`, `endBuildTurnOrScore`, `scoreRoundForAllPlayers`, `startNextRound`, `applyFinalScoring`. The AI must apply moves through these same functions the UI calls, so refills, scoring, and turn advancement behave identically.
- **Separation**: game logic mutates a plain `game` state object; render functions only read and draw; clicks route through `registerTarget()`. The facelift can swap visuals without touching logic.
- **Balance knobs**: each tile's `copies` field in `CAMP_TILE_DEFS` (around line 282) is today a draw weight and becomes a literal deck-card count under the finite-deck model. Budget constants `STARTING_BUDGET`, `SEASON_BUDGET_GRANT`, `CAMP_TILE_COST` are near the top (lines 18 to 20). Goal points live on each objective in `smore-objectives.js`.

A small seam (see Phase 1) lets these same logic functions run headlessly in Node without a bundler, so thousands of games can be simulated for balance.

---

## Phase 0: Foundation, solid on mobile and desktop

Goal: confirm the existing game is robust on phones, tablets, and desktop before deeper work, so later playtests are trustworthy. Deploy is already wired; this is QA and responsive/touch hardening, not deploy setup.

- Confirm the live URL serves current `main`; verify relative asset paths resolve under the `/smore-to-explore/` subpath.
- Audit responsive and touch behavior. The viewport meta tag, `dvh` units, and `env(safe-area-inset-*)` are already present in `index.html`. Verify canvas device-pixel-ratio scaling, `touch-action: none`, tap targets sized for thumbs, no hover-only affordances, portrait and landscape, small-phone widths, and the HTML name-editor overlay against the mobile keyboard.
- Confirm the `requestAnimationFrame` redraw loop holds frame rate on low-end mobile; redraw only on change if needed.

Done when: `/verify-ui-dev-browser` passes on representative mobile and desktop viewports, plus a manual smoke test on a real phone via the live URL.

### Phase 0 status (executed on branch `phase-0-foundation`)

A 51-agent audit (six dimensions, two adversarial verifiers per finding) confirmed 14 issues; all confirmed issues plus the credible completeness-critic gaps were fixed and browser-verified:

- Input model: clicks commit on pointerup with a 10px drag slop (drag-to-scroll no longer fires buttons), clip-aware hit testing (scrolled-out overlay buttons untappable), multi-touch and mouse-button guards, try/catch around the render loop.
- Layout: the severity-9 phone-landscape board collapse is fixed (compact chrome, rack relocated to the context pane during setup); adaptive start menu for narrow/short viewports; tap-target minimums (38px scene tabs, hit-inset top-bar icons, 3-column action grid fallback); panel subtitles stack in narrow panes.
- Touch parity (pulled forward from Phase 4 track 2): two-tap placement, where the first non-mouse tap arms the ghost preview (including both parcels of 2-square items) with validity text and a tap-again hint, the second commits; mouse unchanged.
- Performance: idle render throttling (needsRender flag + animation check + 500ms heartbeat), memoized market legality scans, text-wrap caching; the market slot blocked-footer now states the real reason instead of a hardcoded water message.
- Session persistence (completeness-critic gap, severity 8): 5s autosave plus pagehide/visibilitychange to localStorage, objectives saved by id, Resume Saved Game on the menu, graceful discard of corrupt snapshots.
- Head metadata: SVG favicon + 180px touch icon, web manifest (standalone, subpath-safe), theme-color, description, OpenGraph/Twitter cards, interactive-widget viewport hint.

Deferred watch-items (re-test in Phase 3 playtests): mixed-DPI monitor drag leaves canvas blurry until any resize (cosmetic, self-healing); rename-dialog vs on-screen keyboard on small phones (Android hint shipped; iOS recoverable); printable-rulebook discoverability (Phase 4 covers it); market pagination volume on phones (12 page-flips to see all 48 slots; Phase 4 UX).

## Phase 1: Engine seam, AI players, and a headless self-play harness

Goal: deliver computer opponents (workstream 4) and the harness that makes Phase 2 balancing reliable. This is the largest phase. Build it in the order below; each step is independently testable.

1. **Seeded RNG seam.** Add an internal `rng` plus `Core.setRng(fn)` in `smore-core.js`, and route the two `Math.random()` calls (`shuffle` at line 19, `pickWeighted` at line 29) through it. The browser keeps `Math.random` by default. Done when: two seeded shuffles match; the browser game is unchanged.
2. **Engine/shell host-facade seam.** In `smore-to-explore.js`, resolve a `host` object at the top of the IIFE. In the browser it is the real DOM. In Node, a caller sets `globalThis.__SMORE_HOST__ = { headless: true }` before requiring the file, and the host becomes a no-op: `getElementById` returns null, the null-guard does not throw, and `createCanvasController`, `createNameEditorController`, and the `requestAnimationFrame` loop are skipped. Add dual-export footers to all three files (`module.exports` in Node, `window.*` in the browser). Export an engine handle (`createGameState`, `createEvaluationContext`, the placement oracles, the turn-flow mutators, plus `setGame`/`getGame`) instead of starting the render loop under Node. Use singleton-swap (`setGame(freshState)` per game) so the existing mutators need no changes. Done when: a `node -e` one-liner can create a game state and read its `phase` with no DOM, and the browser still boots identically.
3. **Headless full-game runner** (`sim/run-headless.js`), first with random-legal moves only (no intelligence), driving `createGameState` through landscape, build, scoring, `startNextRound`, to game over, dismissing the blocking round-summary overlay programmatically. Done when: 100 seeded games reach game over with valid standings, zero exceptions, and no placement-oracle violations.
4. **Move-scoring core.** A generic `scoreContextDiff(before, after, game)`: a weighted dot-product of `createEvaluationContext` metric deltas, plus exact objective point deltas (`objective.evaluate(after)` minus `evaluate(before)` over `game.activeRoundObjectives`, and the director objectives once revealed). Clone only the 8x5 board per candidate. Done when: unit checks confirm a premium placement raises `premiumCount` and objective deltas match a hand-built board.
5. **Strategies and driver** (`smore-ai.js`). A `takeTurn(engine, game, strategy)` that plays the landscape phase (legal placement via `getLandscapePlacementReasons`, plus a depth-limited backtrack so it never finishes in an illegal/unconnected state) and the build phase (enumerate column stacks by legal placement, buy the best or pass on a strategy threshold), applying moves through the same mutators the UI uses. Ship about five simple greedy presets that differ only by weights: premium, spread/variety, objective-chaser, road-optimizer, balanced. Done when: AI-vs-AI headless games finish and the strategies show visibly different buy distributions.
6. **Telemetry and batch runner** (`sim/run-batch.js`). Add a one-line `player.buyLog` push in `attemptCampPlacement`; read per-round scores and per-goal results from the existing `roundScores`/`scoreLog`. Aggregate over N games: per-tile buy rate, per-goal appearance/completion/average-points, strategy win-rate and mean placement, early-to-final rank correlation, and "unrecoverable early mistake" rate. Also emit a **placement-difficulty** metric per tile type (reusing the AI's legal-move enumeration): how often a tile has zero or one legal placement when wanted, how constrained it is on average, and the "bought-but-stranded / forced-suboptimal" rate. This is the automated signal that drives the Phase 4 simplify-vs-teach triage and flags candidate feel-bad rules. Done when: a 500-game report shows symmetric win-rates on mirror matchups, plus a ranked hard-to-play-tile list.
7. **Browser integration.** A per-seat picker on the setup screen (cycle Human, then each AI preset, writing the seat config; `createPlayerState` stamps `isAi`/`strategyId`), and AI step-pacing in the render loop (about 400 to 600 ms per atomic sub-step, with the normal handoff overlay between seats so humans can watch). All-Human stays the default. Done when: a Human + AI mixed table is watchable and does not disturb pass-and-play.
8. **Objective points single-source refactor.** Each `evaluate()` currently hardcodes its point literal separately from the `points:` field (confirmed: for example `points: 5` and `passed(5, ...)` on adjacent lines). Make `evaluate` read its own `points` so automated tuning can change one field. Done when: changing one `points:` value moves the aggregate score with no literal edit.

Riskiest parts: landscape auto-completion legality (the AI must never finish in an illegal or unconnected state, so invest in the hard-filter plus backtrack) and the objective double-source-of-truth (blocks reliable point tuning until step 8).

## Phase 2: Balance, finite draw decks and sim-driven tuning

Goal: convert the market to finite per-column draw decks, then tune the game to fair-and-balanced using the harness, followed by targeted goal and budget tweaks.

- **Finite-deck conversion.** Replace `createMarketSlot`'s infinite `pickWeighted` refill with draw-without-replacement from a shuffled per-column deck. `copies` becomes a literal card count. Define each column's deck composition (which tile types, how many): this is the central, harness-tunable balance knob. Decide the deplete behavior (reshuffle a discard, or refresh per round) consistent with the finite-deck-per-column model. Keep the two amenity and four camp columns, and assign tile types to the four camp columns by theme (Camping, Comfort, Premium, Specialty).
- **Tuning loop.** Run mixed-strategy batches (at least 500 games per configuration, fixed seeds), aggregate, change exactly one knob (deck composition, a goal's `points`, or a budget constant), re-run with the same seeds, and diff. Fair targets: strategy win-rates within roughly plus-or-minus 5 to 8 percent of 1/k; a small seat-order gap; early-to-final rank correlation that is not too deterministic; a low unrecoverable-mistake rate; and most goals at intermediate completion rates (0 percent or 100 percent completion both signal a broken goal). Buff items that are rarely bought or never completed; nerf items that near-saturate and win disproportionately.

Done when: a batch report meets the fairness targets, with a documented before/after for each accepted knob change.

## Phase 3: Playtesting, browser, 2 to 5 players, about ten games

Goal: validate real-UI UX, fun (the Kingdomino/Patchwork bar: is laying out the campground satisfying?), and "you cannot get stuck or uncompetitive from one early bad choice." This complements the statistical pass by catching soft-locks, confusing flow, and feel.

- Use `/verify-ui-dev-browser` to drive about ten sessions across 2 to 5 players, mixing AI seats with pass-and-play, including deliberate early-mistake lines to confirm recoverability.
- **Track "feel-bad placement moments" as first-class findings:** any instance of "I had a plan but a technicality I did not understand blocked it." Each one is a defect to triage in Phase 4 (simplify the rule, or make it legible and teachable), not noise.
- **Identify hard-to-play / confusing tiles**, cross-referenced with Phase 1's placement-difficulty metric. Known suspects: the water-edge vs. "waterfront" rules (`waterfront_site` needs a half on a `water`-edge parcel, `canoe_rental` needs a water-edge tile, and the lakeside landscape tiles differ in which edge is `water`) and Camp Office placement (reserved, must connect to the Entrance, and a bad spot strangles later expansion and synergy). For each, record whether it reads as intentional big-risk (keep and teach) or opaque technicality (simplify).
- Feed findings back into Phase 2 knobs and into UX fixes (clarity of blocked-placement reasons, handoff, scoring readability), keeping fixes tabletop-faithful (a hint or relaxation a human referee could also apply at a table).

Done when: about ten logged playtests show no soft-lock and no unrecoverable-from-turn-1 outcomes; feel-bad moments are enumerated; UX issues are triaged; and a ranked list of "tiles that confuse players, the specific rule trap, and a keep-or-simplify call" is produced for Phase 4.

## Phase 4: Placement fun, rule triage, legibility, onboarding, and searchable rules

Goal: make laying out the campground reliably fun by acting on Phase 3's findings across three tracks. Tracks 1 and 2 may change game logic (guarded by the harness); track 3 is content and UX. All stay tabletop-faithful.

1. **Rule triage, simplify vs. teach (game-design; may change logic).** For each hard rule or tile from Phase 3 and the placement-difficulty metric, decide: simplify, relax, or clarify the rule when it is an opaque technicality that produces feel-bad moments (for example, reconsider water-edge vs. "waterfront" semantics, Office/Entrance reservation strictness, or the two-square orientation rules so a reasonable plan is not blocked by something invisible), or keep it when it is an intentional, satisfying-once-understood risk. Re-run the seeded batch sim after any rule change to confirm balance and the no-unrecoverable-mistake target still hold. Keep changes minimal and legible: the goal is constraints you can see and plan around, not the removal of all challenge.
2. **Placement legibility (UX that makes plans trustworthy).** Strengthen the preview and feedback so players see their plan before committing: a ghost preview, highlight every legal cell for the selected tile (enumerate via `getLandscapePlacementReasons` / `getCampTilePlacementEvaluation`), plain-language "why blocked" on illegal targets, and easy rotate and undo. If playtesting is hampered without this, pull the legal-cell highlight earlier, even into Phase 0.
3. **Onboarding and searchable rules (content / UX).** Split the two things conflated today:
   - A **"complex play" tutorial**: interactive, learn-by-doing, short scenarios on a real board (water/waterfront, planning Office/Entrance for expansion, big-item orientation, buying deeper in a column), not walls of text. Reuse the placement oracles for just-in-time "where can this go / what does it need" hints.
   - A **deep rules reference (the "back pages")**: restructure `HOW_TO_STEPS` (in `smore-to-explore.js`), [`printable-rulebook.html`](printable-rulebook.html), and [`smore-space-game-rule-book.md`](smore-space-game-rule-book.md) into an approachable, searchable web reference (search/filter box, scannable scenario and edge-case entries, anchored and linkable sections), sharing one source of truth with the printable rulebook so the physical edition stays in sync.

Done when: each Phase 3 feel-bad moment is resolved (simplified, or made legible and taught); legal-cell highlighting and a clear "why blocked" are in; a new player can complete the complex-play tutorial; the rules reference is searchable and answers the water/waterfront and office-placement questions in a couple of taps; the printable rulebook still matches; and the post-change sim still meets the fairness targets.

## Phase 5: Swappable cartoon facelift (logic frozen)

Goal: a radical cute-animal cartoon look, camping- and nature-true, with zero logic change. It must still read as a board game (tiles, draw-deck cards, goal cards, board), not a video game: the art is the components' skin.

- **Theme-token layer.** Extract the colors, typography, and shapes now scattered in render code (`PLAYER_COLORS`, the landscape and camp `color`/`accent` fields, the button and panel palettes in `index.html` and the draw helpers) into a single theme object with multiple presets, and have render helpers read tokens. Pick the best-reading style on canvas and keep the others as swappable presets.
- Replace `drawLandscapeTileVisual`, `drawCampTileVisual`, the button/pill/panel/card helpers, the background, the menus, and the Phase 4 tutorial and rules UI with themed cartoon versions (optionally lightweight original SVG/sprites plus simple `requestAnimationFrame`-driven easing). Touch no state, validation, scoring, market, or turn logic, and no `registerTarget` click wiring.
- **Regression guard (free and powerful).** Run the seeded headless harness before and after the facelift: identical telemetry proves the logic was untouched.

Done when: `/verify-ui-dev-browser` visual QA and screenshots pass on mobile and desktop, and seeded-sim results are identical before and after.

---

## Overall success bar

Players describe building their campground as a fun, expressive spatial puzzle (the Kingdomino/Patchwork feel) with no "fun to stupid" moments; the game is robust on mobile and desktop at the live URL; the strategies are balanced; and a tabletop edition could be produced from the same components and rules.

## Risks and watch-items

- Landscape AI soft-lock (an illegal finished board): mitigate with a hard legality filter plus a depth-limited backtrack.
- Objective point double-source-of-truth: do the single-source refactor (Phase 1, step 8) before any automated point tuning.
- The `let game` singleton: headless runs are sequential unless the mutators are refactored to take the game state as a parameter.
- Auto-deploy from `main`: gate every merge so the live URL never serves a broken intermediate.

## File map

- [`smore-to-explore.js`](smore-to-explore.js): engine, state, turn flow, placement oracles, `createEvaluationContext`, `CAMP_TILE_DEFS` and the market, the host-facade seam, the AI seat picker and pacing, `HOW_TO_STEPS`, and the theme-token consumers.
- [`smore-core.js`](smore-core.js): the `setRng` injection point and the dual-export footer.
- [`smore-objectives.js`](smore-objectives.js): goal definitions and `evaluate`, the `points` single-source refactor, and the dual-export footer.
- `smore-ai.js` (new): strategies, the `takeTurn` driver, and the context-diff scorer.
- `sim/run-headless.js`, `sim/run-batch.js` (new): the Node harness, telemetry, aggregation, and the placement-difficulty metric. See [`sim/README.md`](sim/README.md).
- [`printable-rulebook.html`](printable-rulebook.html), [`smore-space-game-rule-book.md`](smore-space-game-rule-book.md): the deep rules and printable rulebook; Phase 4 makes the web reference searchable and keeps these in sync (and as the physical-edition source).
- [`index.html`](index.html): responsive and touch (Phase 0), theme tokens (Phase 5).
- [`AI_CONTEXT.md`](AI_CONTEXT.md): architecture conventions for any agent working in this repo.
