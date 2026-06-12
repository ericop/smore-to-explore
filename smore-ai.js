// Smore to Explore: AI move scoring (Phase 1, step 4).
// Loads after smore-to-explore.js. In the browser it reads root.SmoreEngine;
// in Node the caller requires smore-to-explore.js first and passes the engine in.
// No rules live here: every metric comes from createEvaluationContext and every
// objective delta comes from the objective's own evaluate(context).

(() => {
  "use strict";

  const root = typeof globalThis !== "undefined" ? globalThis : window;

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

  const api = {
    SCORE_METRICS,
    scoreContextDiff,
    evaluateHypotheticalPlacement
  };

  root.SmoreAi = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
