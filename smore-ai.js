// Smore to Explore: AI move scoring, strategies, and turn driver (Phase 1, steps 4-5).
// Loads after smore-to-explore.js. In the browser it reads root.SmoreEngine;
// in Node the caller requires smore-to-explore.js first and passes the engine in.
// No rules live here: legality comes from the placement oracles, every metric
// comes from createEvaluationContext, and every objective delta comes from the
// objective's own evaluate(context). Moves apply through the same mutators the UI uses.

(() => {
  "use strict";

  const root = typeof globalThis !== "undefined" ? globalThis : window;

  const LANDSCAPE_RETRY_LIMIT = 3;
  const LANDSCAPE_UNDO_DEPTH = 4;
  const LANDSCAPE_CANDIDATE_CAP = 64;
  const TIEBREAK_SCALE = 0.001;
  const TIGHT_PLACEMENT_LIMIT = 2;
  const COST_SCALE = 10000;
  const ORIENTATIONS = ["horizontal", "vertical"];

  // Numeric metrics read from createEvaluationContext. Booleans count as 0/1.
  // Missing fields are guarded to 0 so a context shape change degrades softly.
  const SCORE_METRICS = [
    "premiumCount",
    "campsiteCount",
    "uniqueAmenityCount",
    "uniqueCampsiteTypeCount",
    "developedQuadrantCount",
    "roadServedCampCount",
    "centerCampCount",
    "longestRoadLength",
    "roadHubCount",
    "deadEndRoadCount",
    "hasRoadLoop",
    "longestAlignedPremiumRun"
  ];

  // Five greedy presets that differ only by linear weights, a buy threshold,
  // and a small landscape score floor (below it the seat passes on the rest
  // of its landscape hand once the layout is valid).
  const STRATEGIES = [
    {
      id: "premium",
      name: "Premium Resort",
      buyThreshold: 0.6,
      landscapeFloor: -0.02,
      weights: {
        premiumCount: 3.0,
        longestAlignedPremiumRun: 1.5,
        campsiteCount: 0.5,
        roadServedCampCount: 0.4,
        uniqueAmenityCount: 0.2,
        objective: 1.0,
        thrift: 0.4
      }
    },
    {
      id: "spread",
      name: "Variety Spread",
      buyThreshold: 0.6,
      landscapeFloor: -0.02,
      weights: {
        uniqueAmenityCount: 2.5,
        uniqueCampsiteTypeCount: 2.5,
        developedQuadrantCount: 2.0,
        campsiteCount: 0.8,
        centerCampCount: 0.4,
        roadServedCampCount: 0.3,
        objective: 1.0,
        thrift: 0.4
      }
    },
    {
      id: "objective",
      name: "Objective Chaser",
      buyThreshold: 0.8,
      landscapeFloor: -0.05,
      weights: {
        objective: 3.0,
        campsiteCount: 0.3,
        roadServedCampCount: 0.3,
        uniqueAmenityCount: 0.2,
        thrift: 0.5
      }
    },
    {
      id: "roads",
      name: "Road Optimizer",
      buyThreshold: 0.5,
      landscapeFloor: -0.02,
      weights: {
        longestRoadLength: 2.0,
        roadHubCount: 1.5,
        hasRoadLoop: 3.0,
        deadEndRoadCount: -1.5,
        roadServedCampCount: 1.0,
        campsiteCount: 0.4,
        objective: 0.8,
        thrift: 0.4
      }
    },
    {
      id: "balanced",
      name: "Balanced Camp",
      buyThreshold: 0.6,
      landscapeFloor: -0.02,
      weights: {
        premiumCount: 1.0,
        campsiteCount: 0.8,
        uniqueAmenityCount: 0.8,
        uniqueCampsiteTypeCount: 0.8,
        developedQuadrantCount: 0.6,
        roadServedCampCount: 0.6,
        centerCampCount: 0.3,
        longestRoadLength: 0.4,
        roadHubCount: 0.3,
        hasRoadLoop: 0.5,
        deadEndRoadCount: -0.3,
        longestAlignedPremiumRun: 0.4,
        objective: 1.2,
        thrift: 0.4
      }
    }
  ];

  function getStrategy(strategyId) {
    return STRATEGIES.find((strategy) => strategy.id === strategyId) || null;
  }

  // ---------------------------------------------------------------------
  // Telemetry (module-level collector, reset once per simulated game).
  // ---------------------------------------------------------------------

  function createTelemetry() {
    return {
      buysBySeat: {},
      placement: {}
    };
  }

  let telemetry = createTelemetry();

  function resetTelemetry() {
    telemetry = createTelemetry();
  }

  function getTelemetry() {
    return telemetry;
  }

  function placementStats(typeId) {
    if (!telemetry.placement[typeId]) {
      telemetry.placement[typeId] = { placedCount: 0, legalSum: 0, tightCount: 0, zeroLegalEvents: 0 };
    }
    return telemetry.placement[typeId];
  }

  function recordBuy(seatIndex, typeId) {
    const seatBuys = telemetry.buysBySeat[seatIndex] || (telemetry.buysBySeat[seatIndex] = {});
    seatBuys[typeId] = (seatBuys[typeId] || 0) + 1;
  }

  function recordPlacement(typeId, legalCount) {
    const stats = placementStats(typeId);
    stats.placedCount += 1;
    stats.legalSum += legalCount;
    if (legalCount <= TIGHT_PLACEMENT_LIMIT) stats.tightCount += 1;
  }

  function recordZeroLegal(typeId) {
    placementStats(typeId).zeroLegalEvents += 1;
  }

  // ---------------------------------------------------------------------
  // Move scoring core (step 4).
  // ---------------------------------------------------------------------

  function metricValue(context, name) {
    const value = context ? context[name] : 0;
    if (typeof value === "boolean") return value ? 1 : 0;
    return value || 0;
  }

  function getActiveObjectives(game) {
    const objectives = (game.activeRoundObjectives || []).slice();
    if (game.directorRevealed) objectives.push(...(game.activeDirectorObjectives || []));
    return objectives;
  }

  // Weighted sum of metric deltas between two evaluation contexts, plus exact
  // objective point deltas for every active objective.
  function scoreContextDiff(engine, game, player, before, after, weights) {
    let total = 0;
    for (const name of SCORE_METRICS) {
      const weight = weights[name] || 0;
      if (!weight) continue;
      total += weight * (metricValue(after, name) - metricValue(before, name));
    }

    const objectiveWeight = weights.objective || 0;
    if (objectiveWeight) {
      for (const objective of getActiveObjectives(game)) {
        const pointsAfter = objective.evaluate(after).points || 0;
        const pointsBefore = objective.evaluate(before).points || 0;
        total += objectiveWeight * (pointsAfter - pointsBefore);
      }
    }
    return total;
  }

  // Deep-clones only player.board, hands the clone to apply(board) for the
  // hypothetical mutation, and evaluates the result. createEvaluationContext
  // reads player.board plus simple player fields (roundCampPlacements), so a
  // shallow wrapper around the original player keeps everything else intact.
  function evaluateHypotheticalPlacement(engine, game, player, apply) {
    const board = structuredClone(player.board);
    const wrapper = { ...player, board };
    apply(board);
    return engine.createEvaluationContext(game, wrapper);
  }

  // ---------------------------------------------------------------------
  // Landscape phase (step 5).
  // ---------------------------------------------------------------------

  function tileHasRoadEdge(engine, typeId) {
    const def = engine.getLandscapeDef(typeId);
    return Object.values(def.edges).includes("road");
  }

  function officeIsPlaced(player) {
    return !player.landscapeInventory.some((entry) => entry.typeId === "office" && entry.count > 0);
  }

  // Rotations with identical rotated edge maps behave identically in the
  // engine (logic reads edges, not the raw rotation), so dedupe them.
  function distinctRotations(engine, typeId) {
    const Core = root.SmoreCore;
    const def = engine.getLandscapeDef(typeId);
    const rotations = [];
    const seen = new Set();
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const edges = Core.rotateEdges(def.edges, rotation);
      const signature = `${edges.north}|${edges.east}|${edges.south}|${edges.west}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      rotations.push(rotation);
    }
    return rotations;
  }

  function enumerateLandscapeCandidates(engine, game, player, typeId) {
    const candidates = [];
    const rotations = distinctRotations(engine, typeId);
    for (let row = 0; row < engine.BOARD_ROWS; row += 1) {
      for (let col = 0; col < engine.BOARD_COLS; col += 1) {
        for (const rotation of rotations) {
          const reasons = engine.getLandscapePlacementReasons(game, player, row, col, typeId, rotation);
          if (!reasons.length) candidates.push({ typeId, row, col, rotation });
        }
      }
    }
    return candidates;
  }

  // Keeps a uniformly sampled subset when the candidate list is large, so
  // hypothetical scoring stays fast without skewing toward any board region.
  function capCandidates(candidates, rng) {
    if (candidates.length <= LANDSCAPE_CANDIDATE_CAP) return candidates;
    const pool = candidates.slice();
    for (let index = 0; index < LANDSCAPE_CANDIDATE_CAP; index += 1) {
      const pick = index + Math.floor(rng() * (pool.length - index));
      [pool[index], pool[pick]] = [pool[pick], pool[index]];
    }
    return pool.slice(0, LANDSCAPE_CANDIDATE_CAP);
  }

  function pickBestLandscapeCandidate(engine, game, player, strategy, rng, candidates) {
    const before = engine.createEvaluationContext(game, player);
    let best = null;
    for (const candidate of capCandidates(candidates, rng)) {
      const after = evaluateHypotheticalPlacement(engine, game, player, (board) => {
        board[candidate.row][candidate.col].landscapeTile = { typeId: candidate.typeId, rotation: candidate.rotation };
      });
      const score = scoreContextDiff(engine, game, player, before, after, strategy.weights) + rng() * TIEBREAK_SCALE;
      if (!best || score > best.score) best = { candidate, score };
    }
    return best;
  }

  function placeLandscapeCandidate(engine, game, candidate) {
    engine.selectLandscapeTile(candidate.typeId);
    game.ui.selection.rotation = candidate.rotation;
    engine.attemptLandscapePlacement(candidate.row, candidate.col);
  }

  function runLandscapePlacementLoop(engine, game, player, strategy, rng) {
    while (!game.turn.actionTaken) {
      const hand = player.landscapeInventory.filter((entry) => entry.count > 0);
      if (!hand.length) return;

      // Priority 1: the Entrance must open the round-0 layout.
      if (hand.some((entry) => entry.typeId === "entrance")) {
        const moves = enumerateLandscapeCandidates(engine, game, player, "entrance");
        if (!moves.length) return;
        const best = pickBestLandscapeCandidate(engine, game, player, strategy, rng, moves);
        placeLandscapeCandidate(engine, game, best.candidate);
        continue;
      }

      // Priority 2: place the Camp Office as soon as it has a legal spot;
      // grow the road network toward one when it does not.
      if (!officeIsPlaced(player)) {
        const officeMoves = enumerateLandscapeCandidates(engine, game, player, "office");
        if (officeMoves.length) {
          const best = pickBestLandscapeCandidate(engine, game, player, strategy, rng, officeMoves);
          placeLandscapeCandidate(engine, game, best.candidate);
          continue;
        }
        const roadCandidates = [];
        for (const entry of hand) {
          if (entry.typeId === "office" || !tileHasRoadEdge(engine, entry.typeId)) continue;
          roadCandidates.push(...enumerateLandscapeCandidates(engine, game, player, entry.typeId));
        }
        if (!roadCandidates.length) return; // office is stuck; the retry loop will undo
        const best = pickBestLandscapeCandidate(engine, game, player, strategy, rng, roadCandidates);
        placeLandscapeCandidate(engine, game, best.candidate);
        continue;
      }

      // Priority 3: place the best-scoring remaining tile, or pass once the
      // best candidate drops below the strategy's floor and the layout is valid.
      const candidates = [];
      for (const entry of hand) {
        candidates.push(...enumerateLandscapeCandidates(engine, game, player, entry.typeId));
      }
      if (!candidates.length) {
        engine.passRemainingLandscapeTiles();
        return;
      }
      const best = pickBestLandscapeCandidate(engine, game, player, strategy, rng, candidates);
      if (best.score < strategy.landscapeFloor) {
        engine.passRemainingLandscapeTiles();
        if (game.turn.actionTaken) return;
        // Pass was refused (layout not valid yet), so keep building.
      }
      placeLandscapeCandidate(engine, game, best.candidate);
    }
  }

  function playLandscapeTurn(engine, game, strategy, rng) {
    const player = engine.getPlayer();
    for (let attempt = 0; attempt <= LANDSCAPE_RETRY_LIMIT; attempt += 1) {
      runLandscapePlacementLoop(engine, game, player, strategy, rng);
      if (game.turn.actionTaken) return;
      if (attempt === LANDSCAPE_RETRY_LIMIT) break;
      const undoCount = Math.min(LANDSCAPE_UNDO_DEPTH, player.landscapePlacementStack.length);
      for (let index = 0; index < undoCount; index += 1) engine.undoLandscapePlacement();
    }
    throw new Error(`AI landscape phase could not reach a valid finished state for ${player.name} `
      + `(round ${game.roundIndex}, errors: ${engine.validateFinishedLandscapePhase(player).join(" | ")})`);
  }

  // ---------------------------------------------------------------------
  // Build phase (step 5).
  // ---------------------------------------------------------------------

  function enumerateCampPlacements(engine, game, player, typeId) {
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
          found.push({ row, col, orientation, cells: evaluation.cells });
        }
      }
    }
    return found;
  }

  let hypotheticalPlacementId = 0;

  function applyHypotheticalCampTile(board, typeId, placement) {
    hypotheticalPlacementId += 1;
    const anchor = placement.cells[0];
    const campTile = {
      placementId: `ai-hypo-${hypotheticalPlacementId}`,
      typeId,
      anchorRow: anchor.row,
      anchorCol: anchor.col,
      orientation: placement.orientation || "horizontal",
      occupiedCells: placement.cells.map((cell) => ({ row: cell.row, col: cell.col }))
    };
    for (const cell of placement.cells) {
      board[cell.row][cell.col].campTile = campTile;
    }
  }

  function pickBestCampPlacement(engine, game, player, strategy, rng, typeId, placements, before) {
    let best = null;
    for (const placement of placements) {
      const after = evaluateHypotheticalPlacement(engine, game, player, (board) => {
        applyHypotheticalCampTile(board, typeId, placement);
      });
      const score = scoreContextDiff(engine, game, player, before, after, strategy.weights) + rng() * TIEBREAK_SCALE;
      if (!best || score > best.score) best = { placement, score, legalCount: placements.length };
    }
    return best;
  }

  function enumerateScoredBuyOptions(engine, game, player, strategy, rng) {
    const before = engine.createEvaluationContext(game, player);
    const bestByType = new Map();

    // Best hypothetical placement per tile type on the CURRENT board.
    // Earlier stack placements change later ones; this is the accepted
    // approximation, memoized once per decision point.
    const bestForType = (typeId) => {
      if (!bestByType.has(typeId)) {
        const placements = enumerateCampPlacements(engine, game, player, typeId);
        if (!placements.length) {
          recordZeroLegal(typeId);
          bestByType.set(typeId, null);
        } else {
          bestByType.set(typeId, pickBestCampPlacement(engine, game, player, strategy, rng, typeId, placements, before));
        }
      }
      return bestByType.get(typeId);
    };

    const thrift = strategy.weights.thrift || 0;
    const options = [];
    for (let columnIndex = 0; columnIndex < game.market.columns.length; columnIndex += 1) {
      const slots = game.market.columns[columnIndex].slots;
      for (let depth = 0; depth < slots.length; depth += 1) {
        const stack = slots.slice(0, depth + 1).map((slot, index) => ({ typeId: slot.typeId, slotIndex: index }));
        const totalCost = stack.reduce((sum, entry) => sum + engine.getCampDef(entry.typeId).cost, 0);
        if (totalCost > player.money) break;
        if (engine.getBlockedMarketPurchaseReason(game, player, stack)) continue;
        if (!stack.every((entry) => engine.canPlaceCampTileAnywhere(game, player, entry.typeId))) continue;
        const entryScores = stack.map((entry) => bestForType(entry.typeId));
        if (entryScores.some((entry) => !entry)) continue;
        const value = entryScores.reduce((sum, entry) => sum + entry.score, 0) - thrift * totalCost / COST_SCALE;
        options.push({ columnIndex, depth, totalCost, value });
      }
    }
    return options;
  }

  function passBuildTurn(engine, game, player) {
    engine.passCurrentPlayerForRound();
    if (!game.turn.actionTaken) throw new Error(`AI pass was refused for ${player.name} during build.`);
    engine.endBuildTurnOrScore();
  }

  function playBuildTurn(engine, game, strategy, rng) {
    const player = engine.getPlayer();
    const seatIndex = game.currentPlayerIndex;
    const options = enumerateScoredBuyOptions(engine, game, player, strategy, rng);

    let bestOption = null;
    for (const option of options) {
      if (!bestOption || option.value > bestOption.value) bestOption = option;
    }
    if (!bestOption || bestOption.value < strategy.buyThreshold) {
      passBuildTurn(engine, game, player);
      return;
    }

    engine.selectMarketTile(bestOption.columnIndex, bestOption.depth);
    if (!engine.hasPendingMarketPurchase()) {
      // The engine refused the purchase despite the pre-checks; pass instead.
      passBuildTurn(engine, game, player);
      return;
    }

    while (engine.hasPendingMarketPurchase()) {
      const pending = engine.getPendingMarketPurchaseEntry();
      const placements = enumerateCampPlacements(engine, game, player, pending.typeId);
      if (!placements.length) {
        // Earlier tiles in the stack consumed the last legal cells; unwind
        // the whole purchase (refund plus board cleanup) and pass instead.
        recordZeroLegal(pending.typeId);
        if (!engine.canCancelPendingMarketPurchase()) {
          throw new Error(`Pending ${pending.typeId} has no legal cell and the purchase cannot be canceled.`);
        }
        engine.cancelPendingMarketPurchase();
        passBuildTurn(engine, game, player);
        return;
      }

      // Fresh before-context per pending tile: the board changed since the
      // estimation pass, and memoizing across mutations would be wrong.
      const before = engine.createEvaluationContext(game, player);
      const best = pickBestCampPlacement(engine, game, player, strategy, rng, pending.typeId, placements, before);
      const placement = best.placement;
      if (engine.isBigMarketItem(pending.typeId) && game.ui.selection.orientation !== placement.orientation) {
        engine.rotateSelectedBigMarketItem();
      }
      const indexBefore = game.turn.marketPurchaseIndex;
      engine.attemptCampPlacement(placement.row, placement.col);
      if (game.turn.marketPurchaseIndex === indexBefore && engine.hasPendingMarketPurchase()) {
        throw new Error(`AI attemptCampPlacement did not advance for ${pending.typeId} at `
          + `${placement.row},${placement.col} (${placement.orientation || "horizontal"}).`);
      }
      recordPlacement(pending.typeId, placements.length);
      recordBuy(seatIndex, pending.typeId);
    }

    if (!game.turn.actionTaken) throw new Error("AI market stack completed without ending the action.");
    engine.endBuildTurnOrScore();
  }

  // ---------------------------------------------------------------------
  // Turn driver.
  // ---------------------------------------------------------------------

  // Plays the CURRENT player's whole turn for the current phase through the
  // same mutators the UI uses, choosing moves by scoreContextDiff.
  function takeTurn(engine, gameState, strategy, rng) {
    if (!strategy) throw new Error("takeTurn needs a strategy preset.");
    if (gameState.phase === "setupLandscape") {
      playLandscapeTurn(engine, gameState, strategy, rng);
      engine.continueLandscapeFlow();
      return;
    }
    if (gameState.phase === "build") {
      playBuildTurn(engine, gameState, strategy, rng);
      return;
    }
    throw new Error(`takeTurn called in unsupported phase: ${gameState.phase}`);
  }

  const api = {
    SCORE_METRICS,
    STRATEGIES,
    getStrategy,
    scoreContextDiff,
    evaluateHypotheticalPlacement,
    takeTurn,
    resetTelemetry,
    getTelemetry
  };

  root.SmoreAi = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
