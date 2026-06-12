# sim/ : headless self-play harness (planned, Phase 1)

This directory is a placeholder for the headless simulation harness described in [`../ROADMAP.md`](../ROADMAP.md), Phase 1. Nothing here runs yet; this file documents the intended contract so the build has a target.

The harness runs full games with no canvas and no human, reusing the exact game logic from the browser (one copy of the rules, no bundler). It exists so the game can be balanced over thousands of simulated games, and so the facelift has a deterministic regression guard.

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

This depends on the host-facade seam, the dual-export footers, and `Core.setRng` (all Phase 1 work). The browser game is unaffected: it never sets `__SMORE_HOST__` and keeps `Math.random`.

## Planned entry points

- `run-headless.js`: `simulateGame({ seed, seats }) -> GameResult`. Drives one game from `createGameState` through landscape, build, scoring, `startNextRound`, to game over, dismissing the round-summary overlay programmatically. Returns final standings plus telemetry.
- `run-batch.js`: `runBatch({ n, seedBase, seatMatchups }) -> AggregateReport`. Runs N seeded games and aggregates the balance metrics below.

`seats` is a list like `[{ kind: "ai", strategyId: "premium" }, { kind: "ai", strategyId: "balanced" }]`.

## Telemetry the batch report should produce

- Per-tile-type buy rate (from a `player.buyLog`), and per-goal appearance / completion / average points (from the existing `roundScores` and `scoreLog`).
- Strategy win-rate and mean placement per `strategyId`.
- Early-to-final rank correlation (is round 1 over-determinative?) and an "unrecoverable early mistake" rate.
- A **placement-difficulty** metric per tile type (from the AI's legal-move enumeration): zero/one-legal-placement rate, average legal cells, and "bought-but-stranded / forced-suboptimal" rate. This drives the Phase 4 simplify-vs-teach triage.

## Balance verdict targets

A game reads as fair when strategy win-rates sit within roughly plus-or-minus 5 to 8 percent of 1/k, the seat-order gap is small, early-to-final rank correlation is not too deterministic, the unrecoverable-mistake rate is low, and most goals land at intermediate completion rates (0 percent or 100 percent both signal a broken goal).

The only balance knobs to change (one at a time, then re-run the same seeds and diff): per-column deck composition, a goal's `points`, and the budget constants (`STARTING_BUDGET`, `SEASON_BUDGET_GRANT`, `CAMP_TILE_COST`).
