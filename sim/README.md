# sim/ : headless self-play harness (Phase 1)

This directory holds the headless simulation harness described in [`../ROADMAP.md`](../ROADMAP.md), Phase 1. It runs full games with no canvas and no human, reusing the exact game logic from the browser (one copy of the rules, no bundler). It exists so the game can be balanced over thousands of simulated games, and so the facelift has a deterministic regression guard.

## How it loads the game logic

Node sets a host marker before requiring the game so all DOM access becomes a no-op:

```js
globalThis.__SMORE_HOST__ = { headless: true };
const Core = require("../smore-core.js");
require("../smore-objectives.js");
const engine = require("../smore-to-explore.js");
const Ai = require("../smore-ai.js");
Core.setRng(makeRng(seed)); // seeded, reproducible runs
```

This depends on the host-facade seam, the dual-export footers, and `Core.setRng`. The browser game is unaffected: it never sets `__SMORE_HOST__` and keeps `Math.random`.

## Entry points

- `smoke-engine.js`: loads the engine headlessly and creates one game state. `node sim/smoke-engine.js` should print `setupLandscape 2`.
- `test-scoring.js`: gate for the AI move-scoring core in `../smore-ai.js` (`scoreContextDiff`, `evaluateHypotheticalPlacement`). `node sim/test-scoring.js` prints PASS lines.
- `run-headless.js`: drives full games with per-seat policies and exports `simulateGame({ seed, seats }) -> GameResult`. Each seat is `{ kind: "random" }` or `{ kind: "ai", strategyId }` (strategy ids: `premium`, `spread`, `objective`, `roads`, `balanced`).

  ```
  node sim/run-headless.js --games 100 --players 2 --seed-base 1000
  node sim/run-headless.js --games 20 --players 2 --strategies premium,balanced
  node sim/run-headless.js --games 1 --players 3 --seed-base 42 --determinism-check
  ```

  `--strategies` is a comma list of strategy ids (or `random`), padded and cycled to the player count; default is all-random. With AI seats the summary prints per-strategy mean scores and buy histograms.
- `run-batch.js`: runs N seeded games via `simulateGame` and prints the aggregate balance report (also written as JSON to `sim/reports/batch-<seed-base>.json`, which is gitignored).

  ```
  node sim/run-batch.js --games 250 --players 2 --seats premium,balanced --seed-base 9000
  node sim/run-batch.js --games 250 --players 2 --seats balanced,balanced --seed-base 4000
  ```

## Telemetry the batch report produces

- Per-strategy win rate, mean placement, mean score, and mean money left.
- Per-tile-type buy rate per game and per strategy (from `player.buyLog`, pushed by `attemptCampPlacement`).
- Per-goal appearance count, completion rate when active, and mean points when active (from `player.scoreLog`).
- Seat-order win rates, early-to-final rank correlation (Spearman over round-0 rank vs final rank), and an "unrecoverable early mistake" rate (round-0 last place finishes last).
- A **placement-difficulty** metric per tile type from the AI's legal-move enumeration: mean legal placements when placed, a bought-but-tight rate (2 or fewer legal placements), and zero-legal events. This drives the Phase 4 simplify-vs-teach triage.
- Mirror-matchup sanity: identical strategies in every seat should produce near 50/50 seat win rates; the report prints a PASS/FAIL check for it.

## Balance verdict targets

A game reads as fair when strategy win-rates sit within roughly plus-or-minus 5 to 8 percent of 1/k, the seat-order gap is small, early-to-final rank correlation is not too deterministic, the unrecoverable-mistake rate is low, and most goals land at intermediate completion rates (0 percent or 100 percent both signal a broken goal).

The only balance knobs to change (one at a time, then re-run the same seeds and diff): per-column deck composition, a goal's `points`, and the budget constants (`STARTING_BUDGET`, `SEASON_BUDGET_GRANT`, `CAMP_TILE_COST`).
