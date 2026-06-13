## Project Overview

This is a browser-based **tile-placement and management game** built with:
- Plain JavaScript (no frameworks)
- HTML Canvas
- No build step (open `index.html` directly; deployed to GitHub Pages as-is)

Game Title: **Smore to Explore**

**Core Loop:** Players place landscape road tiles to build a connected campground skeleton, then draft campsite and amenity contractors from a visible market while chasing seasonal objective cards across three summer rounds. It is a local pass-and-play game for 2 to 5 players.

This project is intentionally:
- Simple and rapid-prototype focused.
- Educational (built with a 4th grade student).
- Easy to modify and extend.

The active build plan is in [`ROADMAP.md`](ROADMAP.md). Read it for what to build next and in what order.

## Architecture Rules (VERY IMPORTANT)

- **DO NOT** introduce frameworks (no Phaser, React, etc.).
- Keep everything compatible with the no-build, static-file setup. It must stay openable as a file and deployable to GitHub Pages with no bundler.
- Prefer small, simple functions over abstractions.
- **Keep logic and rendering separate.** Game logic mutates a plain `game` state object. Render functions only read that state and draw to the canvas. Input routes through `registerTarget()`. Preserve this separation: it is what lets the facelift swap visuals and the harness run logic headlessly.

## File layout

Three files load as `defer` scripts from `index.html`:
- `smore-core.js`: utilities (`shuffle`, `pickWeighted`, math, canvas/text helpers). Exported as `window.SmoreCore`.
- `smore-objectives.js`: `window.SmoreObjectiveFactory`, all goal-card definitions and their `evaluate(context)` logic.
- `smore-to-explore.js`: game state, market, placement validation, scoring, turn flow, rendering, and input, all inside one IIFE.

## Game Logic Specifics

- **The Grid:** an `8 x 5` campground board (`BOARD_COLS`, `BOARD_ROWS`) made of landscape cells.
- **Two layers per cell:** a landscape layer (rotatable road and scenic tiles that define access and placement rules) and a camp layer (one campsite or amenity on top of a placed landscape tile).
- **State machine:** a landscape setup/expansion phase for placing tiles (`phase` starts at `"setupLandscape"`), a `"build"` phase for drafting and placing camp tiles, then round-summary and final scoring phases.
- **Objectives:** data-driven seasonal cards plus Camp Director goals that reveal after the first scoring phase.
- **Money and the market:** every contractor costs `CAMP_TILE_COST`. Players start with `STARTING_BUDGET` and gain `SEASON_BUDGET_GRANT` at the start of Mid and Late Summer.

## Key reuse points (do not reinvent these)

- **`createEvaluationContext(game, player)`** is pure (no DOM). It computes camp/amenity type counts, road-graph analysis (loops, hubs, dead-ends, longest path), quadrant development, aligned runs, distances to the Entrance and Office, and premium/variety counts. The objective `evaluate()` functions consume it. AI move-scoring should diff this context before and after a hypothetical move rather than write new analysis.
- **Placement oracles:** `getLandscapePlacementReasons(...)` and `getCampTilePlacementEvaluation(...)` tell you why a placement is legal or blocked. Reuse them for the AI's legal moves, for highlighting legal cells, and for "why blocked" messages.
- **Turn-flow mutators:** `attemptLandscapePlacement`, `attemptCampPlacement`, `selectMarketTile`, `passCurrentPlayerForRound`, `endBuildTurnOrScore`, `scoreRoundForAllPlayers`, `startNextRound`, `applyFinalScoring`. Apply moves through these (the same functions the UI calls) so refills, scoring, and turn advancement stay consistent.

## Conventions for the next phase of work

These are the patterns the roadmap relies on. Follow them so the codebase stays coherent.

- **One copy of logic, two hosts.** A host-facade seam lets `smore-to-explore.js` run both in the browser and headlessly in Node, without a bundler and without duplicating rules. In Node a caller sets `globalThis.__SMORE_HOST__ = { headless: true }` before requiring the file; DOM access (`getElementById`, canvas controller, name-editor, `requestAnimationFrame`) becomes a no-op. Each file gets a dual-export footer (`module.exports` in Node, `window.*` in the browser). Never fork the logic into a separate Node copy.
- **Seeded RNG.** All randomness funnels through `Core.shuffle` and `Core.pickWeighted` (the two `Math.random()` calls in `smore-core.js`, lines 19 and 29). Add `Core.setRng(fn)` and route both through it so headless runs are reproducible. The browser keeps `Math.random` by default.
- **Finite-deck market.** The market moves from infinite weighted refill to finite per-column draw decks (draw without replacement, deplete and reshuffle). Each tile's `copies` field in `CAMP_TILE_DEFS` becomes a literal deck-card count. Deck composition is the central balance knob and stays a clean "component manifest" a physical edition could print.
- **AI players live in `smore-ai.js`.** A `takeTurn(engine, game, strategy)` driver applies moves through the same mutators the UI uses. Strategies are simple greedy presets that differ only by weights. AI is a digital convenience only: it must not use information a human would not have, or rely on mechanics a tabletop game could not reproduce.
- **Theme-token layer (shipped, `smore-theme.js`).** Presets expose tokens (background scene, terrain by role, camp fills, player colors, primary button, panels); render helpers read the active preset via `theme()` and fall back to the original hardcoded value for any omitted token. The default preset is the "Critter Camp" cartoon look; a pause-menu Theme toggle swaps presets and persists to localStorage. Adding art or a new preset must change no state, validation, scoring, market, or turn logic and no `registerTarget` wiring; the seeded headless sim must stay byte-identical (the regression guard).

## Coding Style

- Use plain JavaScript. Prefer `const` over `let`.
- **No magic numbers.** Define constants like `BOARD_COLS`, `STARTING_BUDGET`, and `CAMP_TILE_COST` at the top.
- Avoid deeply nested logic; use early returns.
- **Do not use em dashes** in code, comments, docs, or commit messages (a repo-owner style rule). Use a colon, comma, parentheses, or a hyphen.

## Design pillars

- **The layout is the fun (Kingdomino / Patchwork benchmark).** Building the campground must feel like a satisfying spatial puzzle. The failure to design out is "I had a plan but a technicality I did not understand blocked it." Constraints must be visible and plannable. For each hard rule, triage between simplifying it (when it is an opaque technicality) and keeping and teaching it (when it is an intentional, satisfying risk).
- **Tabletop-faithful.** The game emulates a physical board game, and a real tabletop edition is a future goal. Prefer rules a human could adjudicate with physical cards and tiles. Keep `CAMP_TILE_DEFS`, the objective decks, and deck counts legible as components.

## Working With This Codebase

- **Make small changes.** Focus on one system at a time. Do not rewrite large sections.
- **Branch per phase or step.** Merge to `main` only when that step's gate passes, because a merge to `main` auto-deploys to the live URL. The live site must never serve a broken intermediate.
- **Verify before declaring success.** No automated tests exist yet, so the headless harness (once built) is the regression guard: seeded runs should produce identical results across pure-rendering changes.
- **Keep the wallet and score visible** and updated in real time. Keep a ghost preview of the tile under the cursor, and show clearly why a placement is blocked.

## AI Behavior Rules

You are a **patient senior developer** helping a beginner and a 4th grader.
- **Teach as you go:** explain why, for example, a 2D array models the grid well.
- **Stay modular:** keep new systems (AI, theming, tutorial) separate from the tile-placement logic.
- **Encourage progress:** celebrate when a new tile type or feature works.
