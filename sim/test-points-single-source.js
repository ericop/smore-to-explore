"use strict";

// Proof that objective scoring has a single source of truth: mutating an
// objective's points field alone changes what evaluate returns, with no
// literal edits. Covers three evaluate shapes: all-or-nothing, partial-credit
// divisor style, and capped style.

const factory = require("../smore-objectives.js");

let failures = 0;

function findObjective(list, id) {
  const objective = list.find((entry) => entry.id === id);
  if (!objective) throw new Error(`Objective ${id} not found.`);
  return objective;
}

function check(label, actual, expected) {
  if (actual === expected) {
    console.log(`PASS ${label}: ${actual}`);
  } else {
    failures += 1;
    console.log(`FAIL ${label}: expected ${expected}, got ${actual}`);
  }
}

// 1. All-or-nothing: early-06 "Beginner's Loop" awards self.points when a
//    road loop exists. Only context field read: hasRoadLoop.
{
  const objective = findObjective(factory.createEarlySummerObjectives(), "early-06");
  const context = { hasRoadLoop: true };
  const original = objective.points;
  check("early-06 all-or-nothing at original points", objective.evaluate(context).points, original);
  objective.points = original * 2;
  check("early-06 all-or-nothing at doubled points", objective.evaluate(context).points, original * 2);
}

// 2. Partial-credit divisor style: director-08 "Something for Everyone"
//    awards self.points / 5 per unique campsite type, capped at self.points.
//    Only context field read: uniqueCampsiteTypeCount.
{
  const objective = findObjective(factory.createDirectorObjectives(), "director-08");
  const maxedContext = { uniqueCampsiteTypeCount: 5 };
  const partialContext = { uniqueCampsiteTypeCount: 3 };
  const original = objective.points;
  check("director-08 divisor style maxed at original points", objective.evaluate(maxedContext).points, original);
  check("director-08 divisor style partial at original points", objective.evaluate(partialContext).points, (original / 5) * 3);
  objective.points = original * 2;
  check("director-08 divisor style maxed at doubled points", objective.evaluate(maxedContext).points, original * 2);
  check("director-08 divisor style partial scales proportionally", objective.evaluate(partialContext).points, ((original * 2) / 5) * 3);
}

// 3. Capped style: late-10 "Longest Route In" awards floor(longestRoadLength
//    / 2) capped at self.points. Only context field read: longestRoadLength.
{
  const objective = findObjective(factory.createLateSummerObjectives(), "late-10");
  const context = { longestRoadLength: 100 };
  const original = objective.points;
  check("late-10 capped style maxed at original points", objective.evaluate(context).points, original);
  objective.points = original * 2;
  check("late-10 capped style cap doubles with points", objective.evaluate(context).points, original * 2);
}

if (failures > 0) {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All single-source checks passed.");
