// Headless full-game runner with random-legal moves.
// Drives one or more complete games through the real engine mutators
// (no rules are reimplemented here) and reports standings.
//
// Usage:
//   node sim/run-headless.js --games 100 --players 2 --seed-base 1000
//   node sim/run-headless.js --games 1 --players 3 --seed-base 42 --determinism-check

"use strict";

globalThis.__SMORE_HOST__ = { headless: true };
const Core = require("../smore-core.js");
require("../smore-objectives.js");
const engine = require("../smore-to-explore.js");

const STEP_CAP = 2000;
const LANDSCAPE_RETRY_LIMIT = 3;
const ORIENTATIONS = ["horizontal", "vertical"];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickRandom(rand, list) {
  return list[Math.floor(rand() * list.length)];
}

function enumerateLandscapeMoves(game, player, typeId) {
  const moves = [];
  for (let row = 0; row < engine.BOARD_ROWS; row += 1) {
    for (let col = 0; col < engine.BOARD_COLS; col += 1) {
      for (let rotation = 0; rotation < 4; rotation += 1) {
        const reasons = engine.getLandscapePlacementReasons(game, player, row, col, typeId, rotation);
        if (!reasons.length) moves.push({ row, col, rotation });
      }
    }
  }
  return moves;
}

function placeLandscapeTile(game, rand, typeId, moves) {
  const move = pickRandom(rand, moves);
  engine.selectLandscapeTile(typeId);
  game.ui.selection.rotation = move.rotation;
  engine.attemptLandscapePlacement(move.row, move.col);
  return move;
}

function tileHasRoadEdge(typeId) {
  const def = engine.getLandscapeDef(typeId);
  return Object.values(def.edges).includes("road");
}

function officeIsPlaced(player) {
  return !player.landscapeInventory.some((entry) => entry.typeId === "office" && entry.count > 0);
}

// Plays the current player's landscape phase to a valid, continue-ready state.
// Returns the number of in-place retries that were needed.
function playLandscapePhase(game, rand) {
  const player = engine.getPlayer();
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= LANDSCAPE_RETRY_LIMIT; attempt += 1) {
    runLandscapePlacementLoop(game, player, rand);
    if (game.turn.actionTaken) return retriesUsed;

    // The engine refused to finish (validation failed, e.g. an unplaced
    // Camp Office). Undo recent placements and try a different layout.
    if (attempt === LANDSCAPE_RETRY_LIMIT) break;
    retriesUsed += 1;
    const undoCount = Math.min(4, player.landscapePlacementStack.length);
    for (let i = 0; i < undoCount; i += 1) engine.undoLandscapePlacement();
  }

  throw new Error(`Landscape phase could not reach a valid finished state for ${player.name} `
    + `(round ${game.roundIndex}, errors: ${engine.validateFinishedLandscapePhase(player).join(" | ")})`);
}

function runLandscapePlacementLoop(game, player, rand) {
  while (!game.turn.actionTaken) {
    const hand = player.landscapeInventory.filter((entry) => entry.count > 0);
    if (!hand.length) return;

    // Priority 1: the Entrance must open the round-0 layout.
    const entrance = hand.find((entry) => entry.typeId === "entrance");
    if (entrance) {
      const moves = enumerateLandscapeMoves(game, player, "entrance");
      if (!moves.length) return;
      placeLandscapeTile(game, rand, "entrance", moves);
      continue;
    }

    // Priority 2: place the Camp Office as soon as it has a legal spot;
    // grow the road network first when it does not.
    if (!officeIsPlaced(player)) {
      const officeMoves = enumerateLandscapeMoves(game, player, "office");
      if (officeMoves.length) {
        placeLandscapeTile(game, rand, "office", officeMoves);
        continue;
      }
      const roadTiles = Core.shuffle(hand.filter((entry) => entry.typeId !== "office" && tileHasRoadEdge(entry.typeId)));
      let placedRoad = false;
      for (const entry of roadTiles) {
        const moves = enumerateLandscapeMoves(game, player, entry.typeId);
        if (moves.length) {
          placeLandscapeTile(game, rand, entry.typeId, moves);
          placedRoad = true;
          break;
        }
      }
      if (placedRoad) continue;
      return; // office is stuck and no road tile can extend the network
    }

    // Priority 3: place remaining tiles at random legal spots.
    let placed = false;
    for (const entry of Core.shuffle(hand)) {
      const moves = enumerateLandscapeMoves(game, player, entry.typeId);
      if (moves.length) {
        placeLandscapeTile(game, rand, entry.typeId, moves);
        placed = true;
        break;
      }
    }
    if (!placed) {
      engine.passRemainingLandscapeTiles();
      return;
    }
  }
}

function enumerateCampPlacements(game, player, typeId) {
  const orientations = engine.isBigMarketItem(typeId) ? ORIENTATIONS : ["horizontal"];
  const found = [];
  const seen = new Set();
  for (let row = 0; row < engine.BOARD_ROWS; row += 1) {
    for (let col = 0; col < engine.BOARD_COLS; col += 1) {
      for (const orientation of orientations) {
        const evaluation = engine.getCampTilePlacementEvaluation(game, player, row, col, typeId, orientation);
        if (evaluation.reasons.length) continue;
        const key = `${orientation}|${evaluation.cells.map((cell) => `${cell.row},${cell.col}`).join(";")}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ row, col, orientation });
      }
    }
  }
  return found;
}

function enumerateBuyOptions(game, player) {
  const options = [];
  for (let columnIndex = 0; columnIndex < game.market.columns.length; columnIndex += 1) {
    const slots = game.market.columns[columnIndex].slots;
    for (let depth = 0; depth < slots.length; depth += 1) {
      const stack = slots.slice(0, depth + 1).map((slot, index) => ({ typeId: slot.typeId, slotIndex: index }));
      const totalCost = stack.reduce((sum, entry) => sum + engine.getCampDef(entry.typeId).cost, 0);
      if (totalCost > player.money) break;
      if (engine.getBlockedMarketPurchaseReason(game, player, stack)) continue;
      // Conservative pre-check: every tile in the stack must have at least
      // one legal cell on the current board (the engine only enforces this
      // for big items). Mid-stack dead ends are still possible and handled
      // by cancelPendingMarketPurchase below.
      if (!stack.every((entry) => engine.canPlaceCampTileAnywhere(game, player, entry.typeId))) continue;
      options.push({ columnIndex, depth, totalCost, weight: depth === 0 ? 3 : 1 });
    }
  }
  return options;
}

function pickWeightedOption(rand, options) {
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  let roll = rand() * totalWeight;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return options[options.length - 1];
}

// Plays one build action (buy a stack and place it, or pass) and ends the turn.
function playBuildTurn(game, rand) {
  const player = engine.getPlayer();
  const options = enumerateBuyOptions(game, player);

  // Buy probability proportional to affordability, never certain.
  const affordability = Math.min(1, player.money / 100000);
  const buyProbability = options.length ? Math.min(0.92, 0.35 + 0.55 * affordability) : 0;

  if (!options.length || rand() >= buyProbability) {
    engine.passCurrentPlayerForRound();
    if (!game.turn.actionTaken) throw new Error(`Pass was refused for ${player.name} during build.`);
    engine.endBuildTurnOrScore();
    return;
  }

  const option = pickWeightedOption(rand, options);
  engine.selectMarketTile(option.columnIndex, option.depth);
  if (!engine.hasPendingMarketPurchase()) {
    // The engine refused the purchase despite the pre-checks; fall back to a pass.
    engine.passCurrentPlayerForRound();
    engine.endBuildTurnOrScore();
    return;
  }

  while (engine.hasPendingMarketPurchase()) {
    const pending = engine.getPendingMarketPurchaseEntry();
    const placements = enumerateCampPlacements(game, player, pending.typeId);
    if (!placements.length) {
      // Earlier tiles in this stack consumed the last legal cells; unwind
      // the whole purchase (refund plus board cleanup) and pass instead.
      if (!engine.canCancelPendingMarketPurchase()) {
        throw new Error(`Pending ${pending.typeId} has no legal cell and the purchase cannot be canceled.`);
      }
      engine.cancelPendingMarketPurchase();
      engine.passCurrentPlayerForRound();
      engine.endBuildTurnOrScore();
      return;
    }

    const placement = pickRandom(rand, placements);
    if (engine.isBigMarketItem(pending.typeId) && game.ui.selection.orientation !== placement.orientation) {
      engine.rotateSelectedBigMarketItem();
    }
    const indexBefore = game.turn.marketPurchaseIndex;
    engine.attemptCampPlacement(placement.row, placement.col);
    if (game.turn.marketPurchaseIndex === indexBefore && engine.hasPendingMarketPurchase()) {
      throw new Error(`attemptCampPlacement did not advance for ${pending.typeId} at `
        + `${placement.row},${placement.col} (${placement.orientation}).`);
    }
  }

  if (!game.turn.actionTaken) throw new Error("Market stack completed without ending the action.");
  engine.endBuildTurnOrScore();
}

function dismissBlockingOverlay(game) {
  const kind = game.overlay.kind;
  if (kind === "handoff") {
    engine.closeOverlay();
    return "continue";
  }
  if (kind === "round-summary") {
    engine.startNextRound();
    return "continue";
  }
  if (kind === "final") return "game-over";
  throw new Error(`Unexpected blocking overlay kind: ${kind}`);
}

function simulateGame({ seed, playerCount }) {
  const rand = mulberry32(seed);
  Core.setRng(rand);
  engine.setGame(engine.createGameState(playerCount));
  const game = engine.getGame();

  let turns = 0;
  let retriesUsed = 0;
  let finished = false;

  for (let step = 0; step < STEP_CAP; step += 1) {
    if (game.overlay && game.overlay.blocking) {
      if (dismissBlockingOverlay(game) === "game-over") {
        finished = true;
        break;
      }
      continue;
    }

    if (game.phase === "setupLandscape") {
      retriesUsed += playLandscapePhase(game, rand);
      engine.continueLandscapeFlow();
      // Both continue paths (next player, or open the build market) hand off
      // through a blocking overlay, so no overlay means no progress was made.
      if (!game.overlay) throw new Error("continueLandscapeFlow made no progress.");
      turns += 1;
      continue;
    }

    if (game.phase === "build") {
      playBuildTurn(game, rand);
      turns += 1;
      continue;
    }

    if (game.phase === "gameOver") {
      finished = true;
      break;
    }

    throw new Error(`Unhandled phase without a blocking overlay: ${game.phase}`);
  }

  if (!finished) {
    throw new Error(`Seed ${seed}: game did not finish within ${STEP_CAP} steps `
      + `(phase ${game.phase}, round ${game.roundIndex}, overlay ${game.overlay?.kind || "none"}).`);
  }
  if (game.phase !== "gameOver" || game.overlay?.kind !== "final") {
    throw new Error(`Seed ${seed}: terminal state is inconsistent (phase ${game.phase}, overlay ${game.overlay?.kind}).`);
  }

  const standings = game.players
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((player) => ({ name: player.name, score: player.score, money: player.money }));
  const perRound = game.players.map((player) => ({
    name: player.name,
    roundScores: player.roundScores.slice(),
    directorScore: player.directorScore
  }));

  Core.setRng(null);
  return { seed, playerCount, standings, perRound, turns, retriesUsed };
}

function parseArgs(argv) {
  const args = { games: 1, players: 2, seedBase: 1000, determinismCheck: false };
  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--games") args.games = Number(argv[++index]);
    else if (flag === "--players") args.players = Number(argv[++index]);
    else if (flag === "--seed-base") args.seedBase = Number(argv[++index]);
    else if (flag === "--determinism-check") args.determinismCheck = true;
    else throw new Error(`Unknown flag: ${flag}`);
  }
  if (!Number.isInteger(args.games) || args.games < 1) throw new Error("--games must be a positive integer");
  if (!Number.isInteger(args.players) || args.players < 2 || args.players > 5) throw new Error("--players must be 2 to 5");
  if (!Number.isInteger(args.seedBase)) throw new Error("--seed-base must be an integer");
  return args;
}

function runDeterminismCheck(seed, playerCount) {
  const first = simulateGame({ seed, playerCount });
  const second = simulateGame({ seed, playerCount });
  const a = JSON.stringify({ standings: first.standings, perRound: first.perRound, turns: first.turns });
  const b = JSON.stringify({ standings: second.standings, perRound: second.perRound, turns: second.turns });
  if (a !== b) {
    console.error("DETERMINISM CHECK FAILED");
    console.error("run 1:", a);
    console.error("run 2:", b);
    process.exit(1);
  }
  console.log(`Determinism check passed: seed ${seed} produced identical standings twice.`);
  console.log(a);
}

function main() {
  const args = parseArgs(process.argv);

  if (args.determinismCheck) {
    runDeterminismCheck(args.seedBase, args.players);
    return;
  }

  const results = [];
  for (let index = 0; index < args.games; index += 1) {
    const seed = args.seedBase + index;
    const result = simulateGame({ seed, playerCount: args.players });
    results.push(result);
    const line = result.standings.map((entry) => `${entry.name} ${entry.score}`).join(" | ");
    console.log(`seed ${seed}: ${line} (turns ${result.turns}, retries ${result.retriesUsed})`);
  }

  const games = results.length;
  const meanWinner = results.reduce((sum, r) => sum + r.standings[0].score, 0) / games;
  const meanScore = results.reduce(
    (sum, r) => sum + r.standings.reduce((inner, entry) => inner + entry.score, 0) / r.standings.length,
    0
  ) / games;
  const meanMargin = results.reduce((sum, r) => sum + (r.standings[0].score - r.standings[1].score), 0) / games;
  const totalRetries = results.reduce((sum, r) => sum + r.retriesUsed, 0);

  console.log("---");
  console.log(`games: ${games}/${games} reached game over`);
  console.log(`players: ${args.players}, seed base: ${args.seedBase}`);
  console.log(`mean score: ${meanScore.toFixed(2)}, mean winner score: ${meanWinner.toFixed(2)}, mean margin: ${meanMargin.toFixed(2)}`);
  console.log(`landscape retries used: ${totalRetries}`);
}

main();
