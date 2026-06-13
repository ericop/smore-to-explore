// Swappable theme tokens for Smore to Explore (Phase 5 facelift).
// Pure data: presets that re-skin the game's high-impact surfaces (background
// scene, board terrain, camp tiles, players, primary buttons, panels) without
// touching any game logic. The render code reads the active preset's tokens
// and falls back to the original hardcoded values for anything a preset omits,
// so a partial preset is always safe.
(() => {
  "use strict";

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
      panel: { fill: "rgba(255, 251, 245, 0.94)", stroke: "rgba(108, 80, 54, 0.18)" },
      shell: { fill: "rgba(255, 250, 244, 0.94)", stroke: "rgba(108, 80, 54, 0.16)" }
    },

    // A bright, cute, cartoon camping look: sunny sky over a green meadow,
    // saturated friendly tiles, bouncy orange buttons.
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
      // Brighter, more saturated terrain (by board role) so the board reads cartoony.
      terrain: { open: "#cdeb9f", forest: "#84cf6f", water: "#93dcf2" },
      // Brighter camp tile fills keyed by tile id (accent left to the tile def).
      camp: {
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
      },
      players: [
        { fill: "#e07a3a", accent: "#ffe0bd", text: "#fff8f0" },
        { fill: "#46b27a", accent: "#cdf3d6", text: "#f8fff7" },
        { fill: "#3f93d6", accent: "#cfe9fb", text: "#f8fcff" },
        { fill: "#e0588a", accent: "#ffd5e6", text: "#fff9fc" },
        { fill: "#9466d6", accent: "#ebdcfb", text: "#fffaff" }
      ],
      buttonPrimary: { fill: "#ff8a3d", stroke: "#e0671c", text: "#fff7f1" },
      panel: { fill: "rgba(255, 253, 248, 0.96)", stroke: "rgba(120, 92, 64, 0.16)" },
      shell: { fill: "rgba(255, 253, 248, 0.95)", stroke: "rgba(120, 92, 64, 0.16)" }
    }
  };

  const THEME_ORDER = ["classic", "cartoon"];

  const api = { THEMES, THEME_ORDER };
  const root = typeof globalThis !== "undefined" ? globalThis : window;
  root.SmoreTheme = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
