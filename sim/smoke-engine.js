// Smoke test: the game engine must load and run headlessly in Node.
// Usage: node sim/smoke-engine.js

globalThis.__SMORE_HOST__ = { headless: true };
const Core = require("../smore-core.js");
require("../smore-objectives.js");
const engine = require("../smore-to-explore.js");

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

Core.setRng(mulberry32(42));
engine.setGame(engine.createGameState(2));
console.log(engine.getGame().phase, engine.getGame().players.length);
