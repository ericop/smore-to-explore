// Phase 3 probe: across seeded AI games, capture the exact player-facing
// "why blocked" reason strings and placement difficulty for every camp tile,
// so we can judge clarity (the UI shows reasons[0] verbatim in the bottom tray).
globalThis.__SMORE_HOST__ = { headless: true };
const Core = require("../smore-core.js");
require("../smore-objectives.js");
const engine = require("../smore-to-explore.js");

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

const ORI = ["horizontal", "vertical"];
const reasonsByTile = {};      // typeId -> Map(reason -> count)
const legalByTile = {};        // typeId -> {samples, legalSum, zero}
const campIds = Object.keys(engine.CAMP_TILE_DEFS);

function note(typeId, reasons, legalCount) {
  const L = legalByTile[typeId] || (legalByTile[typeId] = { samples: 0, legalSum: 0, zero: 0 });
  L.samples += 1; L.legalSum += legalCount; if (legalCount === 0) L.zero += 1;
  const R = reasonsByTile[typeId] || (reasonsByTile[typeId] = new Map());
  reasons.forEach((r) => R.set(r, (R.get(r) || 0) + 1));
}

// Sample boards by playing AI games and, at each build decision point for the
// current player, probing every camp tile's legality across the whole board.
const GAMES = 60;
for (let g = 0; g < GAMES; g++) {
  Core.setRng(mulberry32(50000 + g));
  engine.setGame(engine.createGameState(g % 4 === 0 ? 4 : 2));
  const game = engine.getGame();
  const Ai = require("../smore-ai.js");
  let steps = 0;
  let probedThisGame = 0;
  while (game.phase !== "gameOver" && steps++ < 4000) {
    if (game.overlay && game.overlay.blocking) {
      if (game.overlay.kind === "handoff") engine.closeOverlay();
      else if (game.overlay.kind === "round-summary") engine.startNextRound();
      else break;
      continue;
    }
    // On a build turn, before the AI acts, probe a few tile types on this board.
    if (game.phase === "build" && probedThisGame < 40) {
      const player = engine.getPlayer();
      for (const typeId of campIds) {
        let bestLegal = 0; let sampleReasons = null;
        for (let row = 0; row < engine.BOARD_ROWS; row++) {
          for (let col = 0; col < engine.BOARD_COLS; col++) {
            const oris = engine.isBigMarketItem(typeId) ? ORI : ["horizontal"];
            let cellLegal = false;
            for (const o of oris) {
              const ev = engine.getCampTilePlacementEvaluation(game, player, row, col, typeId, o);
              if (ev.reasons.length === 0) cellLegal = true;
              else if (!sampleReasons) sampleReasons = ev.reasons;
            }
            if (cellLegal) bestLegal++;
          }
        }
        note(typeId, sampleReasons || [], bestLegal);
        probedThisGame++;
      }
    }
    // advance one turn
    const before = game.currentPlayerIndex + "|" + game.phase + "|" + game.roundIndex;
    try { Ai.takeTurn(engine, game, Ai.getStrategy("balanced"), Math.random); }
    catch (e) { break; }
    const after = game.currentPlayerIndex + "|" + game.phase + "|" + game.roundIndex;
    if (before === after && !(game.overlay && game.overlay.blocking)) break;
  }
}

// Report ranked by difficulty (mean legal placements ascending).
const rows = campIds.map((id) => {
  const L = legalByTile[id] || { samples: 0, legalSum: 0, zero: 0 };
  const mean = L.samples ? L.legalSum / L.samples : 0;
  const zeroPct = L.samples ? (100 * L.zero / L.samples) : 0;
  return { id, mean, zeroPct, samples: L.samples, big: engine.isBigMarketItem(id) };
}).sort((a, b) => a.mean - b.mean);

console.log("=== placement difficulty across", GAMES, "seeded AI games (mean legal cells when offered, lower = harder) ===");
for (const r of rows) {
  console.log(`${r.id.padEnd(20)} big=${r.big?"Y":"n"} meanLegal=${r.mean.toFixed(1).padStart(5)} zeroLegal=${r.zeroPct.toFixed(0).padStart(3)}% (n=${r.samples})`);
}
console.log("\n=== distinct player-facing 'why blocked' reasons, hardest tiles ===");
for (const r of rows.slice(0, 8)) {
  const R = reasonsByTile[r.id];
  if (!R) continue;
  const top = [...R.entries()].sort((a,b)=>b[1]-a[1]).slice(0, 3);
  console.log(`\n${r.id}:`);
  top.forEach(([reason, n]) => console.log(`   (${n}x) "${reason}"`));
}
