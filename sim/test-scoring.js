// Gate for Phase 1 step 4: move-scoring core.
// Builds a 2p headless game, hypothetically places a premium camp tile on a
// road parcel, and asserts metric and objective deltas through SmoreAi.
// Usage: node sim/test-scoring.js

"use strict";

globalThis.__SMORE_HOST__ = { headless: true };
const Core = require("../smore-core.js");
const ObjectiveFactory = require("../smore-objectives.js");
const engine = require("../smore-to-explore.js");
const Ai = require("../smore-ai.js");

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

let failures = 0;
function check(label, condition, detail) {
  const suffix = detail ? ` (${detail})` : "";
  if (condition) {
    console.log(`PASS ${label}${suffix}`);
  } else {
    failures += 1;
    console.error(`FAIL ${label}${suffix}`);
  }
}

Core.setRng(mulberry32(7));
engine.setGame(engine.createGameState(2));
const game = engine.getGame();
const player = game.players[0];

// Lay a short road spine directly on the board (context evaluation is pure and
// reads the board as-is) so a premium Cabin has a legal, road-served parcel.
player.board[2][1].landscapeTile = { typeId: "road_straight", rotation: 1 };
player.board[2][2].landscapeTile = { typeId: "road_straight", rotation: 1 };
player.board[2][3].landscapeTile = { typeId: "road_straight", rotation: 1 };

const placement = engine.getCampTilePlacementEvaluation(game, player, 2, 2, "cabin", "horizontal");
check("cabin is a legal placement on the road parcel", placement.reasons.length === 0, placement.reasons.join("; "));

const before = engine.createEvaluationContext(game, player);
const after = Ai.evaluateHypotheticalPlacement(engine, game, player, (board) => {
  board[2][2].campTile = {
    placementId: "hypo-cabin-1",
    typeId: "cabin",
    anchorRow: 2,
    anchorCol: 2,
    orientation: "horizontal",
    occupiedCells: [{ row: 2, col: 2 }]
  };
});

check("premiumCount increments by 1", after.premiumCount === before.premiumCount + 1,
  `before ${before.premiumCount}, after ${after.premiumCount}`);
check("campsiteCount increments by 1 (cabin is lodging)", after.campsiteCount === before.campsiteCount + 1,
  `before ${before.campsiteCount}, after ${after.campsiteCount}`);
check("roadServedCampCount increments by 1", after.roadServedCampCount === before.roadServedCampCount + 1,
  `before ${before.roadServedCampCount}, after ${after.roadServedCampCount}`);
check("hypothetical did not touch the real board", !player.board[2][2].campTile);

// Objective delta: Glamor Guests (early-02) scores 4 for one premium guest stay.
const glamor = ObjectiveFactory.createEarlySummerObjectives().find((objective) => objective.id === "early-02");
check("Glamor Guests objective found", !!glamor);
game.activeRoundObjectives = [glamor];

const objectiveDelta = glamor.evaluate(after).points - glamor.evaluate(before).points;
check("Glamor Guests delta is non-negative", objectiveDelta >= 0, `delta ${objectiveDelta}`);
check("Glamor Guests delta is exactly +4", objectiveDelta === 4, `delta ${objectiveDelta}`);

// scoreContextDiff: only premiumCount (weight 2) and objective (weight 1) are
// weighted, so the expected score is 2 * 1 + 1 * 4 = 6.
const score = Ai.scoreContextDiff(engine, game, player, before, after, { premiumCount: 2, objective: 1 });
check("scoreContextDiff equals 2*1 + 1*4 = 6", score === 6, `score ${score}`);

// Director objectives only count once revealed.
game.activeDirectorObjectives = [glamor];
game.directorRevealed = false;
const hiddenScore = Ai.scoreContextDiff(engine, game, player, before, after, { objective: 1 });
game.directorRevealed = true;
const revealedScore = Ai.scoreContextDiff(engine, game, player, before, after, { objective: 1 });
check("director objectives ignored until revealed", hiddenScore === 4 && revealedScore === 8,
  `hidden ${hiddenScore}, revealed ${revealedScore}`);

Core.setRng(null);

if (failures) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All move-scoring checks passed.");
