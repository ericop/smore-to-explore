// Telemetry batch runner (Phase 1, step 6).
// Runs N headless games through simulateGame and prints an aggregate balance
// report (also written as JSON to sim/reports/<seed-base>.json).
//
// Usage:
//   node sim/run-batch.js --games 250 --players 2 --seats premium,balanced --seed-base 9000
//   node sim/run-batch.js --games 250 --players 2 --seats balanced,balanced --seed-base 4000
//
// --seats takes a comma list of strategy ids (or "random"), padded and cycled
// to the player count. Default is balanced for every seat.

"use strict";

const fs = require("fs");
const path = require("path");
const { simulateGame, buildSeats, seatLabel } = require("./run-headless.js");

const MIRROR_WIN_RATE_MIN = 0.42;
const MIRROR_WIN_RATE_MAX = 0.58;
const BUY_PROFILE_DISTANCE_FLOOR = 0.15;
const TIGHT_PLACEMENT_LIMIT = 2;

function parseArgs(argv) {
  const args = { games: 250, players: 2, seats: "balanced", seedBase: 9000 };
  for (let index = 2; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--games") args.games = Number(argv[++index]);
    else if (flag === "--players") args.players = Number(argv[++index]);
    else if (flag === "--seats") args.seats = argv[++index];
    else if (flag === "--seed-base") args.seedBase = Number(argv[++index]);
    else throw new Error(`Unknown flag: ${flag}`);
  }
  if (!Number.isInteger(args.games) || args.games < 1) throw new Error("--games must be a positive integer");
  if (!Number.isInteger(args.players) || args.players < 2 || args.players > 5) throw new Error("--players must be 2 to 5");
  if (!Number.isInteger(args.seedBase)) throw new Error("--seed-base must be an integer");
  return args;
}

// 1-based ranks where higher value is better; ties share the average rank.
function computeRanks(values) {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => b.value - a.value);
  const ranks = new Array(values.length).fill(0);
  let start = 0;
  while (start < order.length) {
    let end = start;
    while (end + 1 < order.length && order[end + 1].value === order[start].value) end += 1;
    const averageRank = (start + 1 + end + 1) / 2;
    for (let cursor = start; cursor <= end; cursor += 1) ranks[order[cursor].index] = averageRank;
    start = end + 1;
  }
  return ranks;
}

function pearson(xs, ys) {
  const n = xs.length;
  if (!n) return 0;
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  for (let index = 0; index < n; index += 1) {
    const dx = xs[index] - meanX;
    const dy = ys[index] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  if (varianceX === 0 || varianceY === 0) return 0;
  return covariance / Math.sqrt(varianceX * varianceY);
}

function addBuys(target, buys) {
  for (const [typeId, count] of Object.entries(buys)) {
    target[typeId] = (target[typeId] || 0) + count;
  }
}

function normalizedBuyDistribution(buys) {
  const total = Object.values(buys).reduce((sum, count) => sum + count, 0);
  if (!total) return {};
  const normalized = {};
  for (const [typeId, count] of Object.entries(buys)) normalized[typeId] = count / total;
  return normalized;
}

function buyDistributionDistance(buysA, buysB) {
  const a = normalizedBuyDistribution(buysA);
  const b = normalizedBuyDistribution(buysB);
  const typeIds = new Set([...Object.keys(a), ...Object.keys(b)]);
  let distance = 0;
  for (const typeId of typeIds) distance += Math.abs((a[typeId] || 0) - (b[typeId] || 0));
  return distance;
}

function findNonFiniteNumbers(value, trail, sink) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) sink.push(trail);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findNonFiniteNumbers(entry, `${trail}[${index}]`, sink));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) findNonFiniteNumbers(entry, `${trail}.${key}`, sink);
  }
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function main() {
  const args = parseArgs(process.argv);
  const seats = buildSeats(args.seats, args.players);
  const seatLabels = seats.map(seatLabel);

  const policyStats = new Map(); // label -> aggregate bucket
  for (const label of seatLabels) {
    if (!policyStats.has(label)) {
      policyStats.set(label, { seatGames: 0, winCredit: 0, scoreSum: 0, moneySum: 0, rankSum: 0, buys: {} });
    }
  }

  const seatOrderWinCredit = seats.map(() => 0);
  const tileBuysTotal = {};
  const goalStats = new Map(); // objective id -> {name, kind, appearances, completions, pointsSum}
  const placementAgg = {}; // typeId -> {placedCount, legalSum, tightCount, zeroLegalEvents}
  const pooledRound0Ranks = [];
  const pooledFinalRanks = [];
  let gamesWithUniqueRound0Last = 0;
  let unrecoverableGames = 0;

  const startedAt = Date.now();
  for (let index = 0; index < args.games; index += 1) {
    const seed = args.seedBase + index;
    const result = simulateGame({ seed, seats });

    const scores = result.seatStats.map((stat) => stat.score);
    const maxScore = Math.max(...scores);
    const winners = result.seatStats.filter((stat) => stat.score === maxScore);
    const winCredit = 1 / winners.length;

    const round0Scores = result.seatStats.map((stat) => stat.roundScores[0]);
    const round0Ranks = computeRanks(round0Scores);
    const finalRanks = computeRanks(scores);
    pooledRound0Ranks.push(...round0Ranks);
    pooledFinalRanks.push(...finalRanks);

    const minRound0 = Math.min(...round0Scores);
    const round0LastSeats = round0Scores
      .map((score, seatIndex) => ({ score, seatIndex }))
      .filter((entry) => entry.score === minRound0);
    if (round0LastSeats.length === 1) {
      gamesWithUniqueRound0Last += 1;
      const lastSeat = round0LastSeats[0].seatIndex;
      const minFinal = Math.min(...scores);
      if (scores[lastSeat] === minFinal) unrecoverableGames += 1;
    }

    for (const stat of result.seatStats) {
      const bucket = policyStats.get(stat.policy);
      bucket.seatGames += 1;
      bucket.scoreSum += stat.score;
      bucket.moneySum += stat.money;
      bucket.rankSum += stat.rank;
      if (stat.score === maxScore) {
        bucket.winCredit += winCredit;
        seatOrderWinCredit[stat.seatIndex] += winCredit;
      }

      // buyLog is the engine-side record pushed by attemptCampPlacement.
      const buys = {};
      for (const entry of stat.buyLog) buys[entry.typeId] = (buys[entry.typeId] || 0) + 1;
      addBuys(bucket.buys, buys);
      addBuys(tileBuysTotal, buys);

      for (const logEntry of stat.scoreLog) {
        for (const lineItem of logEntry.results) {
          const objective = lineItem.objective;
          const goal = goalStats.get(objective.id)
            || { name: objective.name, kind: logEntry.kind, appearances: 0, completions: 0, pointsSum: 0 };
          goal.appearances += 1;
          if (lineItem.result.points > 0) goal.completions += 1;
          goal.pointsSum += lineItem.result.points;
          goalStats.set(objective.id, goal);
        }
      }
    }

    for (const [typeId, stats] of Object.entries(result.placementTelemetry || {})) {
      const agg = placementAgg[typeId]
        || (placementAgg[typeId] = { placedCount: 0, legalSum: 0, tightCount: 0, zeroLegalEvents: 0 });
      agg.placedCount += stats.placedCount;
      agg.legalSum += stats.legalSum;
      agg.tightCount += stats.tightCount;
      agg.zeroLegalEvents += stats.zeroLegalEvents;
    }

    if ((index + 1) % 50 === 0) {
      process.stderr.write(`  ...${index + 1}/${args.games} games (${((Date.now() - startedAt) / 1000).toFixed(1)}s)\n`);
    }
  }

  // ---------------------------------------------------------------- report
  const perStrategy = {};
  for (const [label, bucket] of policyStats) {
    const buysPerSeatGame = {};
    for (const [typeId, count] of Object.entries(bucket.buys)) {
      buysPerSeatGame[typeId] = round(count / bucket.seatGames);
    }
    perStrategy[label] = {
      seatGames: bucket.seatGames,
      winRate: round(bucket.winCredit / bucket.seatGames),
      meanPlacement: round(bucket.rankSum / bucket.seatGames),
      meanScore: round(bucket.scoreSum / bucket.seatGames),
      meanMoneyLeft: round(bucket.moneySum / bucket.seatGames),
      buysPerSeatGame
    };
  }

  const perTileType = {};
  for (const typeId of Object.keys(tileBuysTotal).sort()) {
    const perStrategyRate = {};
    for (const [label, bucket] of policyStats) {
      perStrategyRate[label] = round((bucket.buys[typeId] || 0) / bucket.seatGames);
    }
    perTileType[typeId] = {
      buysPerGame: round(tileBuysTotal[typeId] / args.games),
      perStrategyBuysPerSeatGame: perStrategyRate
    };
  }

  const perGoal = {};
  for (const [id, goal] of [...goalStats.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    perGoal[id] = {
      name: goal.name,
      kind: goal.kind,
      appearances: goal.appearances,
      completionRate: round(goal.completions / goal.appearances),
      meanPointsWhenActive: round(goal.pointsSum / goal.appearances)
    };
  }

  const placementDifficulty = {};
  for (const typeId of Object.keys(placementAgg).sort()) {
    const agg = placementAgg[typeId];
    placementDifficulty[typeId] = {
      placedCount: agg.placedCount,
      meanLegalPlacements: agg.placedCount ? round(agg.legalSum / agg.placedCount) : 0,
      boughtButTightRate: agg.placedCount ? round(agg.tightCount / agg.placedCount) : 0,
      zeroLegalEvents: agg.zeroLegalEvents
    };
  }

  const report = {
    config: {
      games: args.games,
      players: args.players,
      seats: seatLabels,
      seedBase: args.seedBase
    },
    perStrategy,
    seatOrderWinRates: seatOrderWinCredit.map((credit) => round(credit / args.games)),
    spearmanEarlyToFinalRank: round(pearson(pooledRound0Ranks, pooledFinalRanks)),
    unrecoverableEarlyMistake: {
      gamesWithUniqueRound0Last,
      unrecoverableGames,
      rate: gamesWithUniqueRound0Last ? round(unrecoverableGames / gamesWithUniqueRound0Last) : 0
    },
    perTileType,
    perGoal,
    placementDifficulty,
    checks: []
  };

  // ---------------------------------------------------------------- checks
  const distinctAiPolicies = [...new Set(seatLabels)];
  if (distinctAiPolicies.length === 1) {
    const within = report.seatOrderWinRates.every(
      (rate) => rate >= MIRROR_WIN_RATE_MIN && rate <= MIRROR_WIN_RATE_MAX
    );
    report.checks.push({
      label: `mirror matchup seat win rates within ${Math.round(MIRROR_WIN_RATE_MIN * 100)}-${Math.round(MIRROR_WIN_RATE_MAX * 100)} percent`,
      pass: within,
      detail: report.seatOrderWinRates.map((rate) => `${(rate * 100).toFixed(1)}%`).join(" vs ")
    });
  }
  if (distinctAiPolicies.length === 2) {
    const [labelA, labelB] = distinctAiPolicies;
    const distance = buyDistributionDistance(policyStats.get(labelA).buys, policyStats.get(labelB).buys);
    report.checks.push({
      label: `buy profiles differ visibly (${labelA} vs ${labelB})`,
      pass: distance >= BUY_PROFILE_DISTANCE_FLOOR,
      detail: `L1 distance ${distance.toFixed(3)}, floor ${BUY_PROFILE_DISTANCE_FLOOR}`
    });
  }

  const nonFinite = [];
  findNonFiniteNumbers(report, "report", nonFinite);
  report.checks.push({
    label: "report contains no NaN or infinite values",
    pass: nonFinite.length === 0,
    detail: nonFinite.length ? nonFinite.slice(0, 5).join(", ") : `all numbers finite`
  });

  // ---------------------------------------------------------------- output
  console.log(`=== batch report: ${args.games} games, seats ${seatLabels.join(",")}, seed base ${args.seedBase} ===`);
  console.log("");
  console.log("per-strategy:");
  for (const [label, stats] of Object.entries(report.perStrategy)) {
    console.log(`  ${label}: win rate ${(stats.winRate * 100).toFixed(1)}%, mean placement ${stats.meanPlacement.toFixed(2)}, `
      + `mean score ${stats.meanScore.toFixed(2)}, mean money left ${stats.meanMoneyLeft.toFixed(0)}`);
  }
  console.log("");
  console.log(`seat-order win rates: ${report.seatOrderWinRates.map((rate, index) => `seat ${index} ${(rate * 100).toFixed(1)}%`).join(", ")}`);
  console.log(`early-to-final rank correlation (Spearman): ${report.spearmanEarlyToFinalRank.toFixed(3)}`);
  console.log(`unrecoverable-early-mistake rate: ${(report.unrecoverableEarlyMistake.rate * 100).toFixed(1)}% `
    + `(${report.unrecoverableEarlyMistake.unrecoverableGames}/${report.unrecoverableEarlyMistake.gamesWithUniqueRound0Last} games with a unique round-0 last place)`);
  console.log("");
  console.log("per-tile-type buy rate (per game | per strategy seat-game):");
  for (const [typeId, stats] of Object.entries(report.perTileType)) {
    const perPolicy = Object.entries(stats.perStrategyBuysPerSeatGame)
      .map(([label, rate]) => `${label} ${rate.toFixed(2)}`).join(", ");
    console.log(`  ${typeId}: ${stats.buysPerGame.toFixed(2)}/game | ${perPolicy}`);
  }
  console.log("");
  console.log("per-goal (appearances, completion rate when active, mean points when active):");
  for (const [id, goal] of Object.entries(report.perGoal)) {
    console.log(`  ${id} ${goal.name}: ${goal.appearances} appearances, `
      + `${(goal.completionRate * 100).toFixed(1)}% completed, ${goal.meanPointsWhenActive.toFixed(2)} mean pts`);
  }
  console.log("");
  console.log("placement difficulty (AI build turns):");
  for (const [typeId, stats] of Object.entries(report.placementDifficulty)) {
    console.log(`  ${typeId}: placed ${stats.placedCount}, mean legal placements ${stats.meanLegalPlacements.toFixed(2)}, `
      + `bought-but-tight (<=${TIGHT_PLACEMENT_LIMIT}) ${(stats.boughtButTightRate * 100).toFixed(1)}%, zero-legal events ${stats.zeroLegalEvents}`);
  }
  console.log("");
  for (const check of report.checks) {
    console.log(`${check.pass ? "PASS" : "FAIL"} ${check.label} (${check.detail})`);
  }

  const reportsDir = path.join(__dirname, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `batch-${args.seedBase}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`report written to ${reportPath}`);

  if (report.checks.some((check) => !check.pass)) process.exitCode = 1;
}

main();
