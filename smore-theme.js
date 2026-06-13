// Swappable theme tokens for Smore to Explore (Phase 5 facelift).
// Pure data: presets that re-skin the game's high-impact surfaces (background
// scene, board terrain, camp tiles, players, primary buttons, panels) without
// touching any game logic. The render code reads the active preset's tokens
// and falls back to the original hardcoded values for anything a preset omits,
// so a partial preset is always safe. Panels stay light in every cartoon
// preset so the dark UI text keeps its contrast.
(() => {
  "use strict";

  // Shared bright palettes reused across the cartoon presets.
  const BRIGHT_CAMP = {
    rustic_tent_forest: "#e0915a",
    tent_electric: "#7fd08c",
    rv_full_hookups: "#67b6e6",
    group_site: "#f0a85c",
    cabin: "#ef8a5e",
    waterfront_site: "#5fc6e6",
    horse_riding: "#c08a6a",
    firewood: "#e07a44",
    pool: "#6fcdf2",
    bike_rental: "#9bd06a",
    canoe_rental: "#5fd0c4",
    event_pavilion: "#f0b85f",
    hiking_trail: "#86c95f",
    ice_cream_vending: "#ffb0d0",
    playground: "#ffae5c",
    bathrooms: "#c79bf0"
  };
  const BRIGHT_PLAYERS = [
    { fill: "#e07a3a", accent: "#ffe0bd", text: "#fff8f0" },
    { fill: "#46b27a", accent: "#cdf3d6", text: "#f8fff7" },
    { fill: "#3f93d6", accent: "#cfe9fb", text: "#f8fcff" },
    { fill: "#e0588a", accent: "#ffd5e6", text: "#fff9fc" },
    { fill: "#9466d6", accent: "#ebdcfb", text: "#fffaff" }
  ];
  const LIGHT_PANEL = { fill: "rgba(255, 253, 248, 0.96)", stroke: "rgba(120, 92, 64, 0.16)" };

  const THEMES = {
    // The original warm naturalistic look, expressed as tokens.
    classic: {
      id: "classic",
      label: "Classic Camp",
      pageBg:
        "radial-gradient(circle at top, rgba(255, 207, 140, 0.32), transparent 24%)," +
        "radial-gradient(circle at 85% 10%, rgba(103, 167, 200, 0.18), transparent 24%)," +
        "linear-gradient(180deg, #fdf3e5 0%, #f1dfbf 48%, #e3ca9f 100%)",
      background: { style: "soft", sky: ["#f7eedf", "#efe2c5", "#e2cca1"], orb: "rgba(255,255,255,0.22)" },
      terrain: {},
      camp: {},
      players: null,
      buttonPrimary: { fill: "#ca6f36", stroke: "#995127", text: "#fff7f1" },
      frameStyle: "logs",
      playerBadge: "stump",
      panel: { fill: "rgba(255, 251, 245, 0.94)", stroke: "rgba(108, 80, 54, 0.18)" },
      shell: { fill: "rgba(255, 250, 244, 0.94)", stroke: "rgba(108, 80, 54, 0.16)" }
    },

    // Bluey-inspired: a bright sunny sky over a green meadow, the friendly default.
    cartoon: {
      id: "cartoon",
      label: "Critter Camp",
      pageBg: "linear-gradient(180deg, #aee4ff 0%, #d7f3ff 38%, #d6f0c0 70%, #bfe49a 100%)",
      background: {
        style: "scene",
        sky: ["#a9e4ff", "#cdeeff", "#e7f7ff"],
        meadow: ["#d6f0bb", "#bce592", "#a9dd7e"],
        horizon: 0.62,
        sun: "rgba(255, 233, 150, 0.95)",
        sunRing: "rgba(255, 245, 195, 0.55)",
        cloud: "rgba(255, 255, 255, 0.92)",
        hill1: "#a9dd80",
        hill2: "#8fce6e"
      },
      terrain: { open: "#cdeb9f", forest: "#84cf6f", water: "#93dcf2" },
      camp: BRIGHT_CAMP,
      players: BRIGHT_PLAYERS,
      buttonPrimary: { fill: "#ff8a3d", stroke: "#e0671c", text: "#fff7f1" },
      frameStyle: "birds",
      playerBadge: "beaver",
      bird: { body: "#4f86c6", wing: "#39699f", belly: "#eef5fc", crest: "#3a5f93", rail: "rgba(255,255,255,0.62)" },
      panel: LIGHT_PANEL,
      shell: LIGHT_PANEL
    },

    // Amphibia-inspired: a misty teal wetland, mossy greens, warm coral buttons.
    frog: {
      id: "frog",
      label: "Frog Hollow",
      pageBg: "linear-gradient(180deg, #bfe6df 0%, #d8efe9 38%, #cfe7a8 72%, #aacf83 100%)",
      background: {
        style: "scene",
        sky: ["#bfe6df", "#d6efe8", "#eaf6f1"],
        meadow: ["#cfe7a4", "#a7d586", "#86c46e"],
        horizon: 0.6,
        sun: "rgba(255, 240, 185, 0.9)",
        sunRing: "rgba(255, 247, 210, 0.45)",
        cloud: "rgba(255, 255, 255, 0.85)",
        hill1: "#8fc97e",
        hill2: "#74b566"
      },
      terrain: { open: "#bfe097", forest: "#5fb86a", water: "#73d2c6" },
      camp: BRIGHT_CAMP,
      players: BRIGHT_PLAYERS,
      buttonPrimary: { fill: "#ef7a52", stroke: "#c85a34", text: "#fff7f1" },
      frameStyle: "birds",
      playerBadge: "frog",
      bird: { body: "#48b39a", wing: "#2f8a76", belly: "#eafaf4", crest: "#2f7d6b", rail: "rgba(255,255,255,0.6)" },
      panel: LIGHT_PANEL,
      shell: LIGHT_PANEL
    },

    // Kiff-inspired: candy-bright, bouncy, pink sky over a lime meadow.
    candy: {
      id: "candy",
      label: "Sunny Bounce",
      pageBg: "linear-gradient(180deg, #ffd6ea 0%, #ffe9f3 36%, #e2f4a0 72%, #c4ea76 100%)",
      background: {
        style: "scene",
        sky: ["#ffd6ea", "#ffe6f1", "#fff2e8"],
        meadow: ["#e8f79e", "#cdee74", "#b2e25a"],
        horizon: 0.62,
        sun: "rgba(255, 246, 150, 0.95)",
        sunRing: "rgba(255, 250, 200, 0.6)",
        cloud: "rgba(255, 255, 255, 0.95)",
        hill1: "#bce86a",
        hill2: "#a2dc52"
      },
      terrain: { open: "#e0f58c", forest: "#8fe06a", water: "#7fe0f0" },
      camp: BRIGHT_CAMP,
      players: BRIGHT_PLAYERS,
      buttonPrimary: { fill: "#ff5fa2", stroke: "#e03a82", text: "#fff7fb" },
      frameStyle: "birds",
      playerBadge: "beaver",
      bird: { body: "#ff8fc0", wing: "#e85fa0", belly: "#fff0f7", crest: "#e05294", rail: "rgba(255,255,255,0.66)" },
      panel: LIGHT_PANEL,
      shell: LIGHT_PANEL
    },

    // Nighttime: a dark starry sky with a moon. Panels stay light (like lit
    // lantern-boards on the table) so the dark UI text remains readable, and
    // the player badge becomes a campfire with sparks and smoke.
    night: {
      id: "night",
      label: "Night Camp",
      pageBg: "linear-gradient(180deg, #16213f 0%, #20335a 42%, #284a4f 74%, #2f4a3c 100%)",
      background: {
        style: "night",
        sky: ["#15213f", "#243a63", "#34526b"],
        ground: ["#2f4d3b", "#264033"],
        horizon: 0.64,
        moon: "#fdf4cc",
        moonGlow: "rgba(253, 244, 204, 0.28)",
        star: "rgba(255, 255, 255, 0.95)",
        hill1: "#26402f",
        hill2: "#1f3527"
      },
      terrain: { open: "#9ab98a", forest: "#5e9a6a", water: "#5fa6c6" },
      camp: BRIGHT_CAMP,
      players: BRIGHT_PLAYERS,
      buttonPrimary: { fill: "#ff9a3d", stroke: "#e0671c", text: "#fff7f1" },
      frameStyle: "stars",
      playerBadge: "campfire",
      // Inverted dark UI: panels and text flip via the themed() remap in code.
      invert: true,
      panel: { fill: "rgba(21, 30, 53, 0.94)", stroke: "rgba(150, 172, 214, 0.22)" },
      shell: { fill: "rgba(21, 30, 53, 0.94)", stroke: "rgba(150, 172, 214, 0.22)" }
    }
  };

  const THEME_ORDER = ["classic", "cartoon", "frog", "candy", "night"];

  const api = { THEMES, THEME_ORDER };
  const root = typeof globalThis !== "undefined" ? globalThis : window;
  root.SmoreTheme = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
