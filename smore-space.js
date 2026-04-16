(() => {
  "use strict";

  const Core = window.SmoreCore;
  const ObjectiveFactory = window.SmoreObjectiveFactory;
  const appShell = document.getElementById("appShell");
  const canvas = document.getElementById("gameCanvas");
  const nameEditorHost = document.getElementById("nameEditorHost");
  const fallbackMessage = document.getElementById("fallbackMessage");

  if (!Core || !ObjectiveFactory || !canvas || !appShell) {
    if (fallbackMessage) fallbackMessage.classList.add("visible");
    throw new Error("Smore to Explore needs the core helpers, objective data, and the main canvas shell.");
  }

  const BOARD_COLS = 8;
  const BOARD_ROWS = 5;
  const STARTING_BUDGET = 100000;
  const SEASON_BUDGET_GRANT = 50000;
  const CAMP_TILE_COST = 10000;
  const ACTIVE_SHARED_OBJECTIVE_COUNT = 4;
  const ACTIVE_DIRECTOR_OBJECTIVE_COUNT = 3;
  const MAX_FEED_ITEMS = 6;
  const PLAYER_NAME_STORAGE_KEY = "smore-to-explore-player-names-v1";

  const SIDES = ["north", "east", "south", "west"];
  const OPPOSITE = {
    north: "south",
    east: "west",
    south: "north",
    west: "east"
  };

  const ROUND_DEFS = [
    { id: "early", name: "Early Summer", description: "Opening groups, scout trips, and first campground momentum." },
    { id: "mid", name: "Mid Summer", description: "Family season, activity demand, and a busier road network." },
    { id: "late", name: "Late Summer", description: "Premium stays, polished amenities, and final scoring." }
  ];

  const PLAYER_COLORS = [
    { fill: "#8d5a36", accent: "#f4d2a8", text: "#fff8f0" },
    { fill: "#4f7d5a", accent: "#d4efcf", text: "#f8fff7" },
    { fill: "#4e769c", accent: "#d6e7f5", text: "#f8fcff" },
    { fill: "#a45369", accent: "#f3d5de", text: "#fff9fc" },
    { fill: "#7b5a8f", accent: "#e7d7f2", text: "#fffaff" }
  ];

  const MARKET_COLUMNS = [
    { id: "amenity-1", label: "Amenity Crew", category: "amenity" },
    { id: "amenity-2", label: "Activity Crew", category: "amenity" },
    { id: "camp-1", label: "Camping Sites", category: "camp" },
    { id: "camp-2", label: "Comfort Sites", category: "camp" },
    { id: "camp-3", label: "Premium Sites", category: "camp" },
    { id: "camp-4", label: "Specialty Sites", category: "camp" }
  ];

  const LANDSCAPE_TILE_DEFS = {
    entrance: {
      id: "entrance",
      name: "Entrance to Camp",
      shortLabel: "Gate",
      color: "#b96d3f",
      tags: ["anchor"],
      description: "Must face the outer edge of the board and start the main road.",
      edges: { north: "entrance", east: "open", south: "road", west: "open" }
    },
    office: {
      id: "office",
      name: "Camp Office",
      shortLabel: "Office",
      color: "#e0c17e",
      tags: ["office"],
      description: "A service building with two road approaches if you rotate it well.",
      edges: { north: "road", east: "road", south: "open", west: "open" }
    },
    road_straight: {
      id: "road_straight",
      name: "Straight Road",
      shortLabel: "Road",
      color: "#b7d29b",
      tags: ["road"],
      description: "A clean two-way road segment.",
      edges: { north: "road", east: "open", south: "road", west: "open" }
    },
    road_turn: {
      id: "road_turn",
      name: "Road Turn",
      shortLabel: "Turn",
      color: "#b7d29b",
      tags: ["road"],
      description: "Curves the campground road around a corner.",
      edges: { north: "road", east: "road", south: "open", west: "open" }
    },
    road_cross: {
      id: "road_cross",
      name: "Four-Way Cross",
      shortLabel: "Cross",
      color: "#b7d29b",
      tags: ["road", "intersection"],
      description: "A full crossroads with road access from every side.",
      edges: { north: "road", east: "road", south: "road", west: "road" }
    },
    road_t: {
      id: "road_t",
      name: "Three-Way Split",
      shortLabel: "Split",
      color: "#b7d29b",
      tags: ["road", "intersection"],
      description: "A branching road hub with one side closed.",
      edges: { north: "road", east: "road", south: "open", west: "road" }
    },
    scenic_meadow: {
      id: "scenic_meadow",
      name: "Scenic Meadow",
      shortLabel: "Meadow",
      color: "#cfe0a8",
      tags: ["scenic"],
      description: "Open ground that works well for flexible camps and support amenities.",
      edges: { north: "open", east: "open", south: "open", west: "open" }
    },
    forest_nook: {
      id: "forest_nook",
      name: "Forest Nook",
      shortLabel: "Forest",
      color: "#9db57f",
      tags: ["scenic", "forest"],
      description: "A wooded parcel that loves rustic camping and trails.",
      edges: { north: "open", east: "open", south: "open", west: "open" }
    },
    lakeside_straight: {
      id: "lakeside_straight",
      name: "Lakeside Road",
      shortLabel: "Lake Rd",
      color: "#b7d7d8",
      tags: ["scenic", "waterfront"],
      description: "A road parcel with a clear waterfront edge for premium sites.",
      edges: { north: "water", east: "road", south: "open", west: "road" }
    },
    lakeside_turn: {
      id: "lakeside_turn",
      name: "Lakeside Turn",
      shortLabel: "Lake Turn",
      color: "#b7d7d8",
      tags: ["scenic", "waterfront"],
      description: "A curving road with a water-facing side.",
      edges: { north: "water", east: "road", south: "road", west: "open" }
    },
    lakeside_meadow: {
      id: "lakeside_meadow",
      name: "Lakeside Meadow",
      shortLabel: "Lakeside",
      color: "#b7d7d8",
      tags: ["scenic", "waterfront"],
      description: "A scenic water edge without a road already cut through it.",
      edges: { north: "water", east: "open", south: "open", west: "open" }
    }
  };

  const STARTING_LANDSCAPE_HAND = [
    { typeId: "entrance", count: 1 },
    { typeId: "office", count: 1 },
    { typeId: "road_straight", count: 4 },
    { typeId: "road_turn", count: 2 },
    { typeId: "road_cross", count: 1 },
    { typeId: "road_t", count: 1 }
  ];

  const ROAD_POOL = [
    { typeId: "road_straight", weight: 5 },
    { typeId: "road_turn", weight: 5 },
    { typeId: "road_t", weight: 3 },
    { typeId: "road_cross", weight: 2 }
  ];

  const WATER_POOL = [
    { typeId: "lakeside_straight", weight: 3 },
    { typeId: "lakeside_turn", weight: 3 },
    { typeId: "lakeside_meadow", weight: 2 }
  ];

  const SCENIC_POOL = [
    { typeId: "forest_nook", weight: 4 },
    { typeId: "scenic_meadow", weight: 3 },
    { typeId: "road_t", weight: 2 },
    { typeId: "lakeside_turn", weight: 1 }
  ];

  const CAMP_TILE_DEFS = {
    rustic_tent_forest: { id: "rustic_tent_forest", name: "Rustic Tent Forest", shortLabel: "Rustic", marketGroup: "camp", kind: "campsite", copies: 5, cost: CAMP_TILE_COST, color: "#b47b4f", accent: "#7c4f2d", tags: ["tent", "rustic", "family"], description: "Flexible camping that is happiest in wooded or scenic corners.", rulesText: "Can go on almost any non-office parcel. Forest and scenic terrain score better." },
    tent_electric: { id: "tent_electric", name: "Tent Site with Electric Hookup", shortLabel: "E-Tent", marketGroup: "camp", kind: "campsite", copies: 5, cost: CAMP_TILE_COST, color: "#7db987", accent: "#477b53", tags: ["tent", "electric", "comfort"], description: "A road-adjacent tent site with more comfort built in.", rulesText: "Needs at least one road edge on the landscape below." },
    rv_full_hookups: { id: "rv_full_hookups", name: "RV Site with Full Hookups", shortLabel: "RV", marketGroup: "camp", kind: "campsite", copies: 5, cost: CAMP_TILE_COST, color: "#73a4c6", accent: "#3f6d90", tags: ["rv", "premium"], description: "A premium RV pad that wants strong drive-up access.", rulesText: "Needs strong road access from at least two sides on the same landscape tile." },
    group_site: { id: "group_site", name: "Group Site", shortLabel: "Group", marketGroup: "camp", kind: "campsite", copies: 5, cost: CAMP_TILE_COST, color: "#d5965d", accent: "#945927", tags: ["group", "family"], description: "A larger social camping zone for scouts, reunions, and clubs.", rulesText: "Needs at least one road edge. It likes hub roads and nearby amenities." },
    cabin: { id: "cabin", name: "Cabin", shortLabel: "Cabin", marketGroup: "camp", kind: "lodging", copies: 5, cost: CAMP_TILE_COST, color: "#d07d58", accent: "#8d4a30", tags: ["cabin", "premium", "comfort"], description: "Comfort lodging that still wants proper road access.", rulesText: "Needs at least one road edge on the landscape below." },
    waterfront_site: { id: "waterfront_site", name: "Waterfront Site", shortLabel: "Waterfront", marketGroup: "camp", kind: "lodging", copies: 5, cost: CAMP_TILE_COST, color: "#6aaec8", accent: "#2f7087", tags: ["waterfront", "premium"], description: "A premium scenic site that must sit on a water-edge landscape.", rulesText: "Only placeable on a landscape tile with a water edge." },
    horse_riding: { id: "horse_riding", name: "Horse Riding", shortLabel: "Horse", marketGroup: "camp", kind: "activity", copies: 2, cost: CAMP_TILE_COST, color: "#a97b63", accent: "#6c4c3d", tags: ["horse", "activity", "premium"], description: "A rare specialty attraction that wants road access and a scenic feel.", rulesText: "Needs at least one road edge and a scenic, forest, or lakeside landscape." },
    firewood: { id: "firewood", name: "Firewood", shortLabel: "Wood", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#b97142", accent: "#784421", tags: ["amenity", "campfire"], description: "A flexible support amenity that thrives near tents and group camping.", rulesText: "Very flexible. Best beside tent-heavy camping areas." },
    pool: { id: "pool", name: "Pool", shortLabel: "Pool", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#79bfde", accent: "#397394", tags: ["amenity", "family", "premium"], description: "A family favorite that wants good access and nearby campers.", rulesText: "Needs at least one road edge on the landscape below." },
    bike_rental: { id: "bike_rental", name: "Bike Rental", shortLabel: "Bikes", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#87a56f", accent: "#4b6535", tags: ["amenity", "activity"], description: "Works best off a longer connected road network.", rulesText: "Needs at least one road edge. It loves long connected road runs." },
    canoe_rental: { id: "canoe_rental", name: "Canoe Rental", shortLabel: "Canoes", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#72b6b0", accent: "#37746f", tags: ["amenity", "activity", "waterfront"], description: "A lakeside activity amenity that needs direct water access.", rulesText: "Needs a water-edge landscape tile." },
    event_pavilion: { id: "event_pavilion", name: "Event Pavilion", shortLabel: "Pavilion", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#d8a96d", accent: "#9a6a31", tags: ["amenity", "family", "event"], description: "A social gathering space for busy clusters and group campers.", rulesText: "Needs at least one road edge for easy access." },
    hiking_trail: { id: "hiking_trail", name: "Hiking Trail", shortLabel: "Trail", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#87ab68", accent: "#4f6a33", tags: ["amenity", "activity", "scenic"], description: "A scenic feature that likes forest parcels, edges, and quieter cells.", rulesText: "Place on scenic or border parcels. Forest parcels are especially strong." },
    ice_cream_vending: { id: "ice_cream_vending", name: "Ice Cream Vending", shortLabel: "Ice Cream", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#efb2c8", accent: "#b56f8d", tags: ["amenity", "family", "premium"], description: "A central-traffic treat stop for busy parts of camp.", rulesText: "Needs at least one road edge and likes the middle of the board." },
    playground: { id: "playground", name: "Playground", shortLabel: "Play", marketGroup: "amenity", kind: "amenity", copies: 2, cost: CAMP_TILE_COST, color: "#f0a26a", accent: "#b56331", tags: ["amenity", "family"], description: "Best near group and family camping.", rulesText: "Needs at least one road edge. It shines near Group Sites and tent camping." },
    bathrooms: { id: "bathrooms", name: "Bathrooms", shortLabel: "Bath", marketGroup: "amenity", kind: "amenity", copies: 4, cost: CAMP_TILE_COST, color: "#b496d8", accent: "#735796", tags: ["amenity", "service"], description: "A practical campground service tile added for prototype clarity.", rulesText: "Uses the same strong-road-access rule as RV sites." }
  };

  const AMENITY_MARKET_POOL = Object.values(CAMP_TILE_DEFS).filter((tile) => tile.marketGroup === "amenity");
  const CAMP_MARKET_POOL = Object.values(CAMP_TILE_DEFS).filter((tile) => tile.marketGroup === "camp");

  let runtime = {
    now: 0,
    layout: null,
    targets: [],
    hoveredTargetId: null
  };

  const controller = Core.createCanvasController({
    canvas,
    onResize: handleResize,
    onPointerMove: handlePointerMove,
    onPointerDown: handlePointerDown,
    onPointerLeave: handlePointerLeave
  });

  const nameEditor = createNameEditorController();

  const ctx = controller.context;
  let game = createBootstrapState(2);

  function createBoard() {
    return Array.from({ length: BOARD_ROWS }, (_, row) =>
      Array.from({ length: BOARD_COLS }, (_, col) => ({ row, col, landscapeTile: null, campTile: null }))
    );
  }

  function createSelection() {
    return { source: null, typeId: null, rotation: 0, columnIndex: null, slotIndex: null };
  }

  function createUiState(playerCount = 2) {
    return {
      configuredPlayerCount: playerCount,
      mobileTab: "board",
      boardView: "hand",
      sideTab: "objectives",
      objectiveTab: "shared",
      objectivePages: {
        shared: 0,
        director: 0
      },
      marketPage: 0,
      marketSlotPage: 0,
      selection: createSelection(),
      inspectedCell: null,
      hoveredCell: null,
      lastAttempt: null
    };
  }

  function createTurnState() {
    return {
      actionTaken: false,
      actionType: null
    };
  }

  function getDefaultPlayerName(index) {
    return `Player ${index + 1}`;
  }

  function normalizePlayerName(name, index) {
    const trimmed = String(name || "").trim().replace(/\s+/g, " ");
    return trimmed ? trimmed.slice(0, 18) : getDefaultPlayerName(index);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hexToRgba(hex, alpha) {
    const cleaned = String(hex || "").replace("#", "");
    if (cleaned.length !== 6) return `rgba(202, 111, 54, ${alpha})`;
    const red = parseInt(cleaned.slice(0, 2), 16);
    const green = parseInt(cleaned.slice(2, 4), 16);
    const blue = parseInt(cleaned.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function readStoredPlayerNames() {
    try {
      const raw = window.localStorage.getItem(PLAYER_NAME_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function writeStoredPlayerNames(names) {
    try {
      window.localStorage.setItem(PLAYER_NAME_STORAGE_KEY, JSON.stringify(names));
    } catch (_error) {
      // Ignore storage errors and keep the current session playable.
    }
  }

  function getStoredPlayerName(index) {
    return normalizePlayerName(readStoredPlayerNames()[index], index);
  }

  function getCurrentPlayerNames() {
    return game.players.map((player, index) => normalizePlayerName(player.name, index));
  }

  function createNameEditorController() {
    if (!nameEditorHost) return null;

    nameEditorHost.innerHTML = [
      "<div class='name-editor-card'>",
      "  <h2>Rename Players</h2>",
      "  <p>Update the pass-and-play roster. These names are saved on this device for future sessions.</p>",
      "  <div class='name-editor-grid' id='nameEditorGrid'></div>",
      "  <div class='name-editor-actions'>",
      "    <button type='button' id='nameEditorCancel'>Cancel</button>",
      "    <button type='button' class='primary' id='nameEditorSave'>Save Names</button>",
      "  </div>",
      "</div>"
    ].join("");

    const grid = document.getElementById("nameEditorGrid");
    const cancelButton = document.getElementById("nameEditorCancel");
    const saveButton = document.getElementById("nameEditorSave");

    cancelButton?.addEventListener("click", () => {
      closeOverlay();
    });

    saveButton?.addEventListener("click", () => {
      applyPlayerNamesFromEditor();
    });

    return {
      open(players) {
        if (!grid) return;
        grid.innerHTML = players.map((player, index) => {
          const safeName = escapeHtml(player.name);
          const fill = player.color?.fill || "#8d5a36";
          const glow = hexToRgba(fill, 0.18);
          const shadow = hexToRgba(fill, 0.22);
          const soft = hexToRgba(fill, 0.12);
          const label = escapeHtml(getDefaultPlayerName(index));
          return [
            `<div class='name-editor-field' style='--player-fill:${fill}; --player-glow:${glow}; --player-shadow:${shadow}; --player-soft:${soft};'>`,
            `  <label for='playerName${index}'><span class='name-editor-swatch' aria-hidden='true'></span>${label}</label>`,
            `  <input id='playerName${index}' data-player-index='${index}' type='text' maxlength='18' autocomplete='off' value='${safeName}'>`,
            "</div>"
          ].join("");
        }).join("");
        nameEditorHost.hidden = false;
        nameEditorHost.classList.add("visible");
        nameEditorHost.setAttribute("aria-hidden", "false");
        window.setTimeout(() => {
          const firstInput = grid.querySelector("input");
          firstInput?.focus();
          firstInput?.select();
        }, 0);
      },
      close() {
        nameEditorHost.classList.remove("visible");
        nameEditorHost.setAttribute("aria-hidden", "true");
        nameEditorHost.hidden = true;
      },
      readNames() {
        if (!grid) return [];
        return Array.from(grid.querySelectorAll("input")).map((input) => input.value);
      }
    };
  }

  function createPlayerState(index) {
    return {
      id: `player-${index + 1}`,
      name: getStoredPlayerName(index),
      color: PLAYER_COLORS[index % PLAYER_COLORS.length],
      board: createBoard(),
      money: STARTING_BUDGET,
      score: 0,
      roundCampPlacements: [0, 0, 0],
      roundScores: [0, 0, 0],
      directorScore: 0,
      landscapeInventory: cloneInventory(STARTING_LANDSCAPE_HAND),
      landscapePlacementStack: [],
      scoreLog: [],
      passedThisRound: false
    };
  }

  function createBootstrapState(playerCount) {
    return {
      phase: "pregame",
      roundIndex: 0,
      players: [],
      currentPlayerIndex: 0,
      roundDecks: null,
      activeRoundObjectives: [],
      directorDeck: [],
      activeDirectorObjectives: [],
      directorRevealed: false,
      market: createMarket(),
      message: {
        tone: "info",
        title: "Pass-and-play ready",
        body: "Choose a player count, then build separate campgrounds on one shared device."
      },
      feed: [],
      overlay: {
        kind: "start",
        blocking: true
      },
      ui: createUiState(playerCount),
      turn: createTurnState()
    };
  }

  function createGameState(playerCount) {
    const state = {
      phase: "setupLandscape",
      roundIndex: 0,
      players: Array.from({ length: playerCount }, (_, index) => createPlayerState(index)),
      currentPlayerIndex: 0,
      roundDecks: {
        early: Core.shuffle(ObjectiveFactory.createEarlySummerObjectives()),
        mid: Core.shuffle(ObjectiveFactory.createMidSummerObjectives()),
        late: Core.shuffle(ObjectiveFactory.createLateSummerObjectives())
      },
      activeRoundObjectives: [],
      directorDeck: Core.shuffle(ObjectiveFactory.createDirectorObjectives()),
      activeDirectorObjectives: [],
      directorRevealed: false,
      market: createMarket(),
      message: {
        tone: "info",
        title: "Starting layout",
        body: "Select the Entrance, rotate it to face the edge, and build one connected road network."
      },
      feed: [],
      overlay: null,
      ui: createUiState(playerCount),
      turn: createTurnState()
    };

    setActiveRoundObjectives(state, 0);
    pushFeed(state, "info", "Campground setup", "Each player places the 10 starting landscape tiles before contractor turns begin.");
    openHandoffOverlay(state);
    return state;
  }

  function getPlayer() {
    return game.players[game.currentPlayerIndex] || null;
  }

  function getCurrentRound(gameState = game) {
    return ROUND_DEFS[gameState.roundIndex];
  }

  function cloneInventory(list) {
    return list.map((entry) => ({ ...entry }));
  }

  function createInventoryFromTypeIds(typeIds) {
    const counts = {};
    for (const typeId of typeIds) counts[typeId] = (counts[typeId] || 0) + 1;
    return Object.entries(counts).map(([typeId, count]) => ({ typeId, count }));
  }

  function getCell(board, row, col) {
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    return board[row][col];
  }

  function cellKey(row, col) {
    return `${row},${col}`;
  }

  function getNeighborPosition(row, col, side) {
    if (side === "north") return { row: row - 1, col };
    if (side === "east") return { row, col: col + 1 };
    if (side === "south") return { row: row + 1, col };
    return { row, col: col - 1 };
  }

  function getOrthogonalNeighbors(board, row, col) {
    return SIDES.map((side) => {
      const next = getNeighborPosition(row, col, side);
      return { side, row: next.row, col: next.col, cell: getCell(board, next.row, next.col) };
    }).filter((neighbor) => neighbor.cell);
  }

  function formatBoardCellLabel(row, col) {
    return `${String.fromCharCode(65 + col)}${row + 1}`;
  }

  function getLandscapeDef(typeId) {
    return LANDSCAPE_TILE_DEFS[typeId];
  }

  function getCampDef(typeId) {
    return CAMP_TILE_DEFS[typeId];
  }

  function getLandscapeInfoFromTile(tile) {
    if (!tile) return null;
    const def = getLandscapeDef(tile.typeId);
    const edges = Core.rotateEdges(def.edges, tile.rotation || 0);
    const roadEdgeCount = SIDES.filter((side) => edges[side] === "road").length;
    return {
      def,
      edges,
      roadEdgeCount,
      hasWaterEdge: SIDES.some((side) => edges[side] === "water"),
      hasScenicTag: def.tags.includes("scenic") || def.tags.includes("waterfront"),
      hasForestTag: def.tags.includes("forest"),
      isOffice: tile.typeId === "office",
      isEntrance: tile.typeId === "entrance"
    };
  }

  function countRemainingLandscapeTiles(inventory) {
    return Core.sum(inventory, (entry) => entry.count);
  }

  function decrementLandscapeInventory(inventory, typeId) {
    const entry = inventory.find((item) => item.typeId === typeId);
    if (!entry) return;
    entry.count -= 1;
    if (entry.count <= 0) inventory.splice(inventory.indexOf(entry), 1);
  }

  function incrementLandscapeInventory(inventory, typeId) {
    const entry = inventory.find((item) => item.typeId === typeId);
    if (entry) {
      entry.count += 1;
      return;
    }
    inventory.push({ typeId, count: 1 });
    inventory.sort((a, b) => a.typeId.localeCompare(b.typeId));
  }

  function clearSelection() {
    game.ui.selection = createSelection();
  }

  function clearTurnUi() {
    clearSelection();
    game.ui.inspectedCell = null;
    game.ui.hoveredCell = null;
    game.ui.lastAttempt = null;
  }

  function setMessage(gameState, tone, title, body) {
    gameState.message = { tone, title, body };
  }

  function pushFeed(gameState, tone, title, body) {
    gameState.feed.unshift({ tone, title, body });
    gameState.feed = gameState.feed.slice(0, MAX_FEED_ITEMS);
  }

  function drawWeightedType(pool) {
    return Core.pickWeighted(pool, (entry) => entry.weight).typeId;
  }

  function drawExpansionLandscapeInventory(roundIndex) {
    const typeIds = [
      drawWeightedType(ROAD_POOL),
      drawWeightedType(ROAD_POOL),
      drawWeightedType(ROAD_POOL),
      drawWeightedType(ROAD_POOL),
      drawWeightedType(WATER_POOL),
      drawWeightedType(WATER_POOL),
      "forest_nook",
      roundIndex === 1 ? drawWeightedType(SCENIC_POOL) : drawWeightedType([...SCENIC_POOL, { typeId: "road_cross", weight: 1 }])
    ];
    return createInventoryFromTypeIds(typeIds);
  }

  function createMarket() {
    return {
      columns: MARKET_COLUMNS.map((column) => ({
        ...column,
        slots: Array.from({ length: 8 }, () => createMarketSlot(column.category))
      }))
    };
  }

  function createMarketSlot(category) {
    const pool = category === "amenity" ? AMENITY_MARKET_POOL : CAMP_MARKET_POOL;
    return {
      typeId: Core.pickWeighted(pool, (entry) => entry.copies).id
    };
  }

  function refillMarketSlot(gameState, columnIndex, slotIndex) {
    gameState.market.columns[columnIndex].slots[slotIndex] = createMarketSlot(gameState.market.columns[columnIndex].category);
  }

  function refreshMarket(gameState) {
    gameState.market = createMarket();
  }

  function setActiveRoundObjectives(gameState, roundIndex) {
    const roundId = ROUND_DEFS[roundIndex].id;
    gameState.activeRoundObjectives = gameState.roundDecks[roundId].slice(0, ACTIVE_SHARED_OBJECTIVE_COUNT);
  }

  function revealDirectorObjectives(gameState) {
    if (gameState.directorRevealed) return;
    gameState.activeDirectorObjectives = gameState.directorDeck.slice(0, ACTIVE_DIRECTOR_OBJECTIVE_COUNT);
    gameState.directorRevealed = true;
    pushFeed(gameState, "info", "Camp Director goals", "Director objectives are now active and will score after Late Summer.");
  }

  function countPlacedLandscapeTiles(board) {
    let total = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell.landscapeTile) total += 1;
      }
    }
    return total;
  }

  function getEntranceCell(board) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = board[row][col];
        if (cell.landscapeTile && cell.landscapeTile.typeId === "entrance") return { row, col, cell };
      }
    }
    return null;
  }

  function getOfficeCell(board) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = board[row][col];
        if (cell.landscapeTile && cell.landscapeTile.typeId === "office") return { row, col, cell };
      }
    }
    return null;
  }

  function isLandscapeTopologicallyConnected(board) {
    const occupied = [];
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        if (board[row][col].landscapeTile) occupied.push({ row, col });
      }
    }
    if (!occupied.length) return true;

    const visited = new Set();
    const queue = [occupied[0]];
    while (queue.length) {
      const current = queue.shift();
      const key = cellKey(current.row, current.col);
      if (visited.has(key)) continue;
      visited.add(key);
      for (const neighbor of getOrthogonalNeighbors(board, current.row, current.col)) {
        if (neighbor.cell.landscapeTile && !visited.has(cellKey(neighbor.row, neighbor.col))) {
          queue.push({ row: neighbor.row, col: neighbor.col });
        }
      }
    }
    return visited.size === occupied.length;
  }

  function buildRoadGraph(board) {
    const graph = new Map();
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = board[row][col];
        if (!cell.landscapeTile) continue;
        const info = getLandscapeInfoFromTile(cell.landscapeTile);
        if (info.roadEdgeCount === 0) continue;
        const key = cellKey(row, col);
        if (!graph.has(key)) graph.set(key, []);
        for (const side of SIDES) {
          if (info.edges[side] !== "road") continue;
          const next = getNeighborPosition(row, col, side);
          const neighborCell = getCell(board, next.row, next.col);
          if (!neighborCell || !neighborCell.landscapeTile) continue;
          const neighborInfo = getLandscapeInfoFromTile(neighborCell.landscapeTile);
          if (neighborInfo.edges[OPPOSITE[side]] !== "road") continue;
          const neighborKey = cellKey(next.row, next.col);
          const neighbors = graph.get(key);
          if (!neighbors.includes(neighborKey)) neighbors.push(neighborKey);
        }
      }
    }
    return graph;
  }

  function getRoadDistanceMap(graph, startKey) {
    const distances = new Map();
    if (!graph.has(startKey)) return distances;
    const queue = [startKey];
    distances.set(startKey, 0);
    while (queue.length) {
      const current = queue.shift();
      const distance = distances.get(current);
      for (const neighbor of graph.get(current) || []) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, distance + 1);
          queue.push(neighbor);
        }
      }
    }
    return distances;
  }

  function getReachableRoadKeys(board, graph) {
    const entrance = getEntranceCell(board);
    if (!entrance) return new Set();
    return new Set(getRoadDistanceMap(graph, cellKey(entrance.row, entrance.col)).keys());
  }

  function getRoadDiameter(graph) {
    let best = 0;
    for (const key of graph.keys()) {
      for (const distance of getRoadDistanceMap(graph, key).values()) {
        best = Math.max(best, distance + 1);
      }
    }
    return best;
  }

  function getRoadComponentSize(graph, startKey) {
    return getRoadDistanceMap(graph, startKey).size;
  }

  function hasRoadCycle(graph) {
    const visited = new Set();
    function dfs(node, parent) {
      visited.add(node);
      for (const neighbor of graph.get(node) || []) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, node)) return true;
        } else if (neighbor !== parent) {
          return true;
        }
      }
      return false;
    }
    for (const key of graph.keys()) {
      if (!visited.has(key) && dfs(key, null)) return true;
    }
    return false;
  }

  function getEntranceSpineLength(graph, entranceKey) {
    if (!graph.has(entranceKey)) return 0;
    let current = entranceKey;
    let previous = null;
    let length = 1;
    while (true) {
      const options = (graph.get(current) || []).filter((neighbor) => neighbor !== previous);
      if (options.length !== 1) return length;
      previous = current;
      current = options[0];
      length += 1;
    }
  }

  function countDeadEndRoads(board, graph) {
    let total = 0;
    for (const [key, neighbors] of graph.entries()) {
      const [row, col] = key.split(",").map(Number);
      const typeId = board[row][col].landscapeTile.typeId;
      if (typeId === "entrance" || typeId === "office") continue;
      if (neighbors.length <= 1) total += 1;
    }
    return total;
  }

  function countRoadHubs(graph) {
    let hubs = 0;
    for (const neighbors of graph.values()) {
      if (neighbors.length >= 3) hubs += 1;
    }
    return hubs;
  }

  function hasAdjacentRoadCell(board, row, col) {
    return getOrthogonalNeighbors(board, row, col).some((neighbor) => {
      if (!neighbor.cell.landscapeTile) return false;
      return getLandscapeInfoFromTile(neighbor.cell.landscapeTile).roadEdgeCount >= 1;
    });
  }

  function isBorderParcel(row, col) {
    return row === 0 || row === BOARD_ROWS - 1 || col === 0 || col === BOARD_COLS - 1;
  }

  function isCentralParcel(row, col) {
    return row >= 1 && row <= 3 && col >= 2 && col <= 5;
  }

  function getQuadrantKey(row, col) {
    return `${row <= 1 ? "north" : "south"}-${col <= 3 ? "west" : "east"}`;
  }

  function hasRoadConnectionBetween(board, rowA, colA, rowB, colB) {
    const cellA = getCell(board, rowA, colA);
    const cellB = getCell(board, rowB, colB);
    if (!cellA || !cellB || !cellA.landscapeTile || !cellB.landscapeTile) return false;
    const infoA = getLandscapeInfoFromTile(cellA.landscapeTile);
    const infoB = getLandscapeInfoFromTile(cellB.landscapeTile);
    if (rowA === rowB && colA + 1 === colB) return infoA.edges.east === "road" && infoB.edges.west === "road";
    if (rowA === rowB && colA - 1 === colB) return infoA.edges.west === "road" && infoB.edges.east === "road";
    if (colA === colB && rowA + 1 === rowB) return infoA.edges.south === "road" && infoB.edges.north === "road";
    if (colA === colB && rowA - 1 === rowB) return infoA.edges.north === "road" && infoB.edges.south === "road";
    return false;
  }

  function getLongestAlignedCampRun(context, predicate) {
    let best = 0;
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      let current = 0;
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const decorated = context.campCells.find((entry) => entry.row === row && entry.col === col);
        if (decorated && predicate(decorated) && (col === 0 || hasRoadConnectionBetween(context.board, row, col - 1, row, col))) {
          current = col === 0 ? 1 : current + 1;
          best = Math.max(best, current);
        } else if (decorated && predicate(decorated)) {
          current = 1;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      }
    }
    for (let col = 0; col < BOARD_COLS; col += 1) {
      let current = 0;
      for (let row = 0; row < BOARD_ROWS; row += 1) {
        const decorated = context.campCells.find((entry) => entry.row === row && entry.col === col);
        if (decorated && predicate(decorated) && (row === 0 || hasRoadConnectionBetween(context.board, row - 1, col, row, col))) {
          current = row === 0 ? 1 : current + 1;
          best = Math.max(best, current);
        } else if (decorated && predicate(decorated)) {
          current = 1;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      }
    }
    return best;
  }

  function getLandscapePlacementReasons(gameState, player, row, col, typeId, rotation) {
    const reasons = [];
    const board = player.board;
    const cell = getCell(board, row, col);
    if (!cell) return ["Choose a space inside the board."];
    if (cell.landscapeTile) reasons.push("There is already a landscape tile here.");

    const def = getLandscapeDef(typeId);
    const edges = Core.rotateEdges(def.edges, rotation);
    const placedCount = countPlacedLandscapeTiles(board);
    const occupiedNeighbors = getOrthogonalNeighbors(board, row, col).filter((neighbor) => neighbor.cell.landscapeTile);
    const roadConnections = [];

    if (gameState.phase === "setupLandscape" && gameState.roundIndex === 0 && placedCount === 0 && typeId !== "entrance") {
      reasons.push("The Entrance should start the opening layout.");
    }
    if (placedCount > 0 && occupiedNeighbors.length === 0) {
      reasons.push("New landscape tiles must touch the existing campground.");
    }

    let entranceFacesBorder = false;
    for (const side of SIDES) {
      const edge = edges[side];
      const next = getNeighborPosition(row, col, side);
      const neighborCell = getCell(board, next.row, next.col);

      if (!neighborCell) {
        if (edge === "road") reasons.push("Road edges cannot run straight off the board.");
        if (edge === "entrance") entranceFacesBorder = true;
        continue;
      }

      if (edge === "entrance") {
        reasons.push("The Entrance gate must face the outside edge of the board.");
        continue;
      }
      if (!neighborCell.landscapeTile) continue;

      const neighborInfo = getLandscapeInfoFromTile(neighborCell.landscapeTile);
      const neighborEdge = neighborInfo.edges[OPPOSITE[side]];
      if (edge === "road" && neighborEdge !== "road") reasons.push("Road edges must meet matching road edges.");
      if (edge !== "road" && neighborEdge === "road") reasons.push("An open edge cannot crash into an existing road.");
      if (edge === "road" && neighborEdge === "road") roadConnections.push(side);
    }

    if (typeId === "entrance" && !entranceFacesBorder) reasons.push("The Entrance tile must place its gate on the outer border.");
    const hasRoadEdge = SIDES.some((side) => edges[side] === "road");
    if (placedCount > 0 && hasRoadEdge && typeId !== "entrance" && roadConnections.length === 0) {
      reasons.push("Road tiles should connect into the current road network as they are placed.");
    }

    return Core.unique(reasons);
  }

  function validateFinishedLandscapePhase(player) {
    const board = player.board;
    const roadGraph = buildRoadGraph(board);
    const entrance = getEntranceCell(board);
    const office = getOfficeCell(board);
    const errors = [];
    if (!entrance) errors.push("The Entrance tile is missing.");
    if (!office) errors.push("The Camp Office tile is missing.");
    if (!isLandscapeTopologicallyConnected(board)) errors.push("Every landscape tile should be part of one connected campground layout.");
    if (entrance && office) {
      const distances = getRoadDistanceMap(roadGraph, cellKey(entrance.row, entrance.col));
      if (!distances.has(cellKey(office.row, office.col))) {
        errors.push("The Camp Office must connect into the road network from the Entrance.");
      }
    }
    return errors;
  }

  function getCampTilePlacementReasons(gameState, player, row, col, typeId) {
    const reasons = [];
    const cell = getCell(player.board, row, col);
    const campDef = getCampDef(typeId);
    if (!cell) return ["Choose a board space inside the campground."];
    if (!cell.landscapeTile) return ["Place a landscape tile here first."];
    if (cell.campTile) reasons.push("There is already a camp tile on this parcel.");
    if (player.money < campDef.cost) reasons.push(`You need ${Core.formatMoney(campDef.cost)} to hire this contractor.`);

    const landscapeInfo = getLandscapeInfoFromTile(cell.landscapeTile);
    const practicalRoadAccess = landscapeInfo.roadEdgeCount >= 1 || hasAdjacentRoadCell(player.board, row, col);

    if (landscapeInfo.isEntrance || landscapeInfo.isOffice) reasons.push("The Entrance and Camp Office tiles stay reserved for road services.");
    if (["tent_electric", "group_site", "cabin", "pool", "bike_rental", "event_pavilion", "ice_cream_vending", "playground"].includes(typeId) && landscapeInfo.roadEdgeCount < 1) {
      reasons.push("This tile needs at least one road edge on the landscape below.");
    }
    if (["rv_full_hookups", "bathrooms"].includes(typeId) && landscapeInfo.roadEdgeCount < 2) {
      reasons.push("This tile needs strong road access from at least two sides.");
    }
    if (typeId === "waterfront_site" && !landscapeInfo.hasWaterEdge) reasons.push("Waterfront Sites only fit on a water-edge landscape tile.");
    if (typeId === "canoe_rental" && !landscapeInfo.hasWaterEdge) reasons.push("Canoe Rental must sit on a water-edge landscape tile.");
    if (typeId === "horse_riding") {
      if (landscapeInfo.roadEdgeCount < 1) reasons.push("Horse Riding needs at least one road edge for access.");
      if (!landscapeInfo.hasScenicTag && !landscapeInfo.hasForestTag && !isBorderParcel(row, col)) reasons.push("Horse Riding wants scenic, forest, or edge-of-camp placement.");
    }
    if (typeId === "hiking_trail" && !landscapeInfo.hasScenicTag && !landscapeInfo.hasForestTag && !isBorderParcel(row, col)) {
      reasons.push("Hiking Trail wants scenic, forest, or board-edge placement.");
    }
    if (typeId === "firewood" && !practicalRoadAccess && !landscapeInfo.hasScenicTag) {
      reasons.push("Firewood should reach camp either from a road parcel or a scenic gathering spot.");
    }

    return Core.unique(reasons);
  }

  function getLargestCampCluster(board, campCells, predicate) {
    const matching = new Set(campCells.filter(predicate).map((cell) => cellKey(cell.row, cell.col)));
    let best = 0;
    const visited = new Set();
    for (const key of matching) {
      if (visited.has(key)) continue;
      const queue = [key];
      let size = 0;
      while (queue.length) {
        const current = queue.shift();
        if (visited.has(current) || !matching.has(current)) continue;
        visited.add(current);
        size += 1;
        const [row, col] = current.split(",").map(Number);
        for (const neighbor of getOrthogonalNeighbors(board, row, col)) {
          const neighborKey = cellKey(neighbor.row, neighbor.col);
          if (!visited.has(neighborKey) && matching.has(neighborKey)) queue.push(neighborKey);
        }
      }
      best = Math.max(best, size);
    }
    return best;
  }

  function createEvaluationContext(gameState, player) {
    const board = player.board;
    const roadGraph = buildRoadGraph(board);
    const entrance = getEntranceCell(board);
    const office = getOfficeCell(board);
    const entranceKey = entrance ? cellKey(entrance.row, entrance.col) : null;
    const reachableRoadKeys = getReachableRoadKeys(board, roadGraph);
    const distancesFromEntrance = entranceKey ? getRoadDistanceMap(roadGraph, entranceKey) : new Map();

    const campCells = [];
    const campCellsByType = {};
    const campTypeCounts = {};
    const amenityTypeCounts = {};
    const landscapeInfos = new Map();

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = board[row][col];
        if (cell.landscapeTile) landscapeInfos.set(cellKey(row, col), getLandscapeInfoFromTile(cell.landscapeTile));
        if (cell.campTile) {
          const campDef = getCampDef(cell.campTile.typeId);
          const decorated = { row, col, campTile: cell.campTile, campDef, landscapeInfo: landscapeInfos.get(cellKey(row, col)) };
          campCells.push(decorated);
          campCellsByType[campDef.id] = campCellsByType[campDef.id] || [];
          campCellsByType[campDef.id].push(decorated);
          campTypeCounts[campDef.id] = (campTypeCounts[campDef.id] || 0) + 1;
          if (campDef.kind === "amenity") amenityTypeCounts[campDef.id] = (amenityTypeCounts[campDef.id] || 0) + 1;
        }
      }
    }

    const campsiteCells = campCells.filter((cell) => cell.campDef.kind === "campsite" || cell.campDef.kind === "lodging");
    const premiumCells = campCells.filter((cell) => cell.campDef.tags.includes("premium"));
    const developedQuadrants = new Set();
    let centerCampCount = 0;
    let centerRoadServedCampCount = 0;
    let roadServedCampCount = 0;
    let unusedSupportedSpaces = 0;
    let allDevelopedTilesPracticallyAccessible = true;
    let intersectionCount = 0;

    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) {
        const cell = board[row][col];
        const info = landscapeInfos.get(cellKey(row, col));
        if (!info) continue;
        if (info.def.tags.includes("intersection")) intersectionCount += 1;
        const practical = info.roadEdgeCount >= 1 || hasAdjacentRoadCell(board, row, col);
        if (!cell.campTile && !info.isEntrance && !info.isOffice) unusedSupportedSpaces += 1;
        if (cell.campTile) {
          developedQuadrants.add(getQuadrantKey(row, col));
          if (isCentralParcel(row, col)) centerCampCount += 1;
          if (practical) {
            roadServedCampCount += 1;
            if (isCentralParcel(row, col)) centerRoadServedCampCount += 1;
          } else {
            allDevelopedTilesPracticallyAccessible = false;
          }
        }
      }
    }

    const context = {
      game: gameState,
      player,
      board,
      entrance,
      office,
      roadGraph,
      reachableRoadKeys,
      campCells,
      campCellsByType,
      campTypeCounts,
      amenityTypeCounts,
      campsiteCount: campsiteCells.length,
      premiumCount: premiumCells.length,
      uniqueAmenityCount: Object.keys(amenityTypeCounts).length,
      uniqueCampsiteTypeCount: [...new Set(campsiteCells.map((cell) => cell.campTile.typeId))].length,
      allLandscapeConnected: isLandscapeTopologicallyConnected(board),
      allRoadCellsReachEntrance: roadGraph.size === 0 || reachableRoadKeys.size === roadGraph.size,
      officeDistance: office && entrance ? (distancesFromEntrance.get(cellKey(office.row, office.col)) ?? -1) + 1 : -1,
      officeConnectedRoadSides: office ? (roadGraph.get(cellKey(office.row, office.col)) || []).length : 0,
      roadHubCount: countRoadHubs(roadGraph),
      longestRoadLength: getRoadDiameter(roadGraph),
      hasRoadLoop: hasRoadCycle(roadGraph),
      deadEndRoadCount: countDeadEndRoads(board, roadGraph),
      entranceSpineLength: entranceKey ? getEntranceSpineLength(roadGraph, entranceKey) : 0,
      developedQuadrantCount: developedQuadrants.size,
      centerCampCount,
      centerRoadServedCampCount,
      roadServedCampCount,
      unusedSupportedSpaces,
      allDevelopedTilesPracticallyAccessible,
      intersectionCount,
      placementsThisRound: player.roundCampPlacements[gameState.roundIndex],
      rusticClusterSize: getLargestCampCluster(board, campCells, (cell) => cell.campTile.typeId === "rustic_tent_forest"),
      premiumClusterSize: getLargestCampCluster(board, campCells, (cell) => cell.campDef.tags.includes("premium")),
      longestAlignedCampRun: 0,
      longestAlignedPremiumRun: 0,
      getOrthogonalNeighbors: (row, col) => getOrthogonalNeighbors(board, row, col),
      getRoadComponentSizeForCell: (row, col) => {
        const key = cellKey(row, col);
        if (roadGraph.has(key)) return getRoadComponentSize(roadGraph, key);
        const neighborKey = getOrthogonalNeighbors(board, row, col).map((neighbor) => cellKey(neighbor.row, neighbor.col)).find((testKey) => roadGraph.has(testKey));
        return neighborKey ? getRoadComponentSize(roadGraph, neighborKey) : 0;
      },
      isCentralTrafficCell: (row, col) => isCentralParcel(row, col) || ((roadGraph.get(cellKey(row, col)) || []).length >= 3),
      countNearby: (source, predicate, distance) => {
        let total = 0;
        for (const other of campCells) {
          if (other.row === source.row && other.col === source.col) continue;
          if (Math.abs(other.row - source.row) + Math.abs(other.col - source.col) <= distance && predicate(other)) total += 1;
        }
        return total;
      }
    };

    context.longestAlignedCampRun = getLongestAlignedCampRun(context, (cell) => cell.campDef.kind === "campsite" || cell.campDef.kind === "lodging");
    context.longestAlignedPremiumRun = getLongestAlignedCampRun(context, (cell) => cell.campDef.tags.includes("premium"));
    return context;
  }

  function scoreAdjacencyBonuses(gameState, player, row, col, typeId) {
    const context = createEvaluationContext(gameState, player);
    const cell = getCell(player.board, row, col);
    if (!cell || !cell.landscapeTile) return { score: 0, lines: [] };
    const source = { row, col, campTile: { typeId }, campDef: getCampDef(typeId), landscapeInfo: getLandscapeInfoFromTile(cell.landscapeTile) };
    const lines = [];
    let score = 0;

    if (typeId === "pool") {
      const nearby = context.countNearby(source, (other) => other.campDef.kind === "campsite" || other.campDef.kind === "lodging", 1);
      if (nearby > 0) {
        score += nearby;
        lines.push(`Pool would serve ${nearby} nearby campsite${nearby === 1 ? "" : "s"}.`);
      }
    }
    if (typeId === "firewood") {
      const nearby = context.countNearby(source, (other) => other.campTile.typeId === "group_site" || other.campDef.tags.includes("tent"), 1);
      if (nearby > 0) lines.push(`Firewood would support ${nearby} nearby tent or group camp tiles.`);
    }
    if (typeId === "playground") {
      const family = context.countNearby(source, (other) => other.campTile.typeId === "group_site" || other.campDef.tags.includes("tent"), 2);
      if (family > 0) lines.push(`Playground would sit near ${family} family-focused camp tiles.`);
    }
    if (typeId === "event_pavilion") {
      const nearby = context.countNearby(source, () => true, 2);
      if (nearby > 0) lines.push(`Event Pavilion would anchor ${nearby} nearby developed camp tiles.`);
    }
    if (typeId === "bike_rental") {
      const roadSize = context.getRoadComponentSizeForCell(row, col);
      if (roadSize > 0) lines.push(`Bike Rental would connect to a road corridor ${roadSize} tiles long.`);
    }
    if (typeId === "hiking_trail" && (source.landscapeInfo.hasForestTag || source.landscapeInfo.hasScenicTag || isBorderParcel(row, col))) {
      lines.push("Trail placement gets a scenic bonus here.");
    }

    return { score, lines };
  }

  function openHandoffOverlay(gameState) {
    const player = gameState.players[gameState.currentPlayerIndex];
    const round = getCurrentRound(gameState);
    let lines = [];
    if (gameState.ui) gameState.ui.boardView = gameState.phase === "setupLandscape" ? "hand" : "board";
    if (gameState.phase === "setupLandscape" && gameState.roundIndex === 0) {
      lines = [
        `${player.name} is building the opening road skeleton.`,
        "Place all 10 starting landscape tiles, keep the network connected, and fold the Camp Office into the road.",
        "Hand the device over after pressing Ready."
      ];
    } else if (gameState.phase === "setupLandscape") {
      lines = [
        `${player.name} is placing the ${round.name} expansion tiles.`,
        `Place all 8 new landscape tiles before the contractor market reopens for ${round.name}.`,
        "Hand the device over after pressing Ready."
      ];
    } else if (gameState.phase === "build") {
      lines = [
        `${player.name} is taking a ${round.name} build turn.`,
        "Buy one visible contractor tile, place it on your own board, then end your turn or pass for the round.",
        "Hand the device over after pressing Ready."
      ];
    }

    gameState.overlay = {
      kind: "handoff",
      blocking: true,
      title: `${player.name}'s Turn`,
      lines
    };
  }

  function beginPlaySession(playerCount) {
    game = createGameState(playerCount);
  }

  function restartToStartScreen() {
    nameEditor?.close();
    game = createBootstrapState(game.ui.configuredPlayerCount || 2);
  }

  function openPauseMenu() {
    nameEditor?.close();
    game.overlay = {
      kind: "pause-menu",
      blocking: true
    };
  }

  function openRenamePlayersOverlay() {
    game.overlay = {
      kind: "rename-players",
      blocking: true
    };
    nameEditor?.open(game.players);
  }

  function openRestartConfirmOverlay() {
    nameEditor?.close();
    game.overlay = {
      kind: "restart-confirm",
      blocking: true
    };
  }

  function openAboutOverlay() {
    nameEditor?.close();
    game.overlay = {
      kind: "about",
      blocking: true
    };
  }

  function applyPlayerNamesFromEditor() {
    if (!nameEditor) return;
    const names = nameEditor.readNames().map((name, index) => normalizePlayerName(name, index));
    game.players.forEach((player, index) => {
      player.name = names[index] || getDefaultPlayerName(index);
    });
    writeStoredPlayerNames(names);
    pushFeed(game, "info", "Roster updated", `${game.players.map((player) => player.name).join(", ")} joined the campground plan.`);
    setMessage(game, "success", "Player names saved", "The new roster is saved on this device for future sessions.");
    closeOverlay();
  }

  function isCurrentLandscapePhaseComplete() {
    const player = getPlayer();
    if (!player) return false;
    return countRemainingLandscapeTiles(player.landscapeInventory) === 0 && validateFinishedLandscapePhase(player).length === 0;
  }

  function markAttempt(row, col, reasons) {
    game.ui.lastAttempt = {
      row,
      col,
      reasons,
      at: performance.now()
    };
  }

  function selectLandscapeTile(typeId) {
    const player = getPlayer();
    if (!player || game.phase !== "setupLandscape") return;
    const same = game.ui.selection.source === "landscape" && game.ui.selection.typeId === typeId;
    game.ui.selection = {
      source: "landscape",
      typeId,
      rotation: same ? game.ui.selection.rotation : 0,
      columnIndex: null,
      slotIndex: null
    };
    game.ui.inspectedCell = null;
    game.ui.lastAttempt = null;
    if (runtime.layout?.mode === "mobile-portrait") game.ui.boardView = "board";
    setMessage(game, "info", "Landscape selected", `${getLandscapeDef(typeId).name} is ready. Use the turn tray to rotate it, then tap a board parcel to place it.`);
  }

  function selectMarketTile(columnIndex, slotIndex) {
    const player = getPlayer();
    if (!player || game.phase !== "build" || game.turn.actionTaken) return;
    const same = game.ui.selection.source === "market" && game.ui.selection.columnIndex === columnIndex && game.ui.selection.slotIndex === slotIndex;
    game.ui.selection = same
      ? createSelection()
      : { source: "market", typeId: game.market.columns[columnIndex].slots[slotIndex].typeId, rotation: 0, columnIndex, slotIndex };
    game.ui.inspectedCell = null;
    game.ui.lastAttempt = null;
    if (same) {
      setMessage(game, "info", "Selection cleared", "Choose another contractor or inspect your board.");
    } else {
      const def = getCampDef(game.ui.selection.typeId);
      setMessage(game, "info", "Contractor selected", `${def.name} costs ${Core.formatMoney(def.cost)}. The phone switches back to the board so you can tap a valid parcel to place it.`);
      if (runtime.layout?.mode === "mobile-portrait") game.ui.mobileTab = "board";
    }
  }

  function rotateSelectedLandscape(delta) {
    if (game.ui.selection.source !== "landscape") return;
    game.ui.selection.rotation = (game.ui.selection.rotation + delta + 4) % 4;
    game.ui.lastAttempt = null;
  }

  function undoLandscapePlacement() {
    const player = getPlayer();
    if (!player || game.phase !== "setupLandscape" || !player.landscapePlacementStack.length) return;
    const last = player.landscapePlacementStack.pop();
    const cell = getCell(player.board, last.row, last.col);
    if (!cell) return;
    cell.landscapeTile = null;
    incrementLandscapeInventory(player.landscapeInventory, last.tile.typeId);
    game.turn = createTurnState();
    clearSelection();
    game.ui.inspectedCell = { row: last.row, col: last.col };
    game.ui.lastAttempt = null;
    setMessage(game, "info", "Landscape undone", `${getLandscapeDef(last.tile.typeId).name} was returned to the current hand.`);
  }

  function attemptLandscapePlacement(row, col) {
    const player = getPlayer();
    if (!player || game.ui.selection.source !== "landscape" || game.phase !== "setupLandscape") return;
    const reasons = getLandscapePlacementReasons(game, player, row, col, game.ui.selection.typeId, game.ui.selection.rotation);
    markAttempt(row, col, reasons);
    if (reasons.length) {
      setMessage(game, "error", "Invalid landscape placement", reasons[0]);
      return;
    }

    const tile = { typeId: game.ui.selection.typeId, rotation: game.ui.selection.rotation };
    getCell(player.board, row, col).landscapeTile = tile;
    player.landscapePlacementStack.push({ row, col, tile: { ...tile } });
    decrementLandscapeInventory(player.landscapeInventory, game.ui.selection.typeId);
    game.ui.inspectedCell = { row, col };
    game.ui.lastAttempt = null;
    if (!player.landscapeInventory.some((entry) => entry.typeId === game.ui.selection.typeId)) clearSelection();

    if (countRemainingLandscapeTiles(player.landscapeInventory) === 0) {
      const errors = validateFinishedLandscapePhase(player);
      if (errors.length) {
        setMessage(game, "error", "Layout still needs work", `${errors[0]} Undo the latest tile if you need to re-route the road network.`);
        return;
      }
      game.turn.actionTaken = true;
      game.turn.actionType = "landscape-complete";
      setMessage(game, "success", "Landscape phase complete", "This board is ready. Continue to the next player or the contractor market.");
      pushFeed(game, "success", `${player.name} finished layout`, `${player.name} completed the ${game.roundIndex === 0 ? "starting campground skeleton" : `${getCurrentRound().name} expansion layout`}.`);
      clearSelection();
      return;
    }

    setMessage(game, "success", "Landscape placed", `${getLandscapeDef(tile.typeId).name} added to ${player.name}'s campground.`);
  }

  function attemptCampPlacement(row, col) {
    const player = getPlayer();
    if (!player || game.phase !== "build" || game.ui.selection.source !== "market" || game.turn.actionTaken) return;
    const reasons = getCampTilePlacementReasons(game, player, row, col, game.ui.selection.typeId);
    markAttempt(row, col, reasons);
    if (reasons.length) {
      setMessage(game, "error", "Invalid camp placement", reasons[0]);
      return;
    }

    const selection = { ...game.ui.selection };
    const cell = getCell(player.board, row, col);
    const campDef = getCampDef(selection.typeId);
    cell.campTile = { typeId: selection.typeId };
    player.money -= campDef.cost;
    player.roundCampPlacements[game.roundIndex] += 1;
    player.passedThisRound = false;
    game.ui.inspectedCell = { row, col };
    game.turn.actionTaken = true;
    game.turn.actionType = "build";

    const bonuses = scoreAdjacencyBonuses(game, player, row, col, selection.typeId);
    refillMarketSlot(game, selection.columnIndex, selection.slotIndex);
    clearSelection();
    game.ui.lastAttempt = null;

    setMessage(game, "success", "Contractor placed", `${campDef.name} was built for ${Core.formatMoney(campDef.cost)}.${bonuses.lines.length ? ` ${bonuses.lines[0]}` : ""}`);
    pushFeed(game, "success", `${player.name} built ${campDef.name}`, `${player.name} spent ${Core.formatMoney(campDef.cost)} during ${getCurrentRound().name}.`);
  }

  function passCurrentPlayerForRound() {
    const player = getPlayer();
    if (!player || game.phase !== "build" || game.turn.actionTaken) return;
    player.passedThisRound = true;
    clearSelection();
    game.turn.actionTaken = true;
    game.turn.actionType = "pass";
    setMessage(game, "warning", "Player passed", `${player.name} is done building for ${getCurrentRound().name}.`);
    pushFeed(game, "info", `${player.name} passed`, `${player.name} ended build turns for ${getCurrentRound().name}.`);
  }

  function continueLandscapeFlow() {
    const player = getPlayer();
    if (!player || !isCurrentLandscapePhaseComplete()) return;
    clearTurnUi();
    game.turn = createTurnState();
    if (game.currentPlayerIndex < game.players.length - 1) {
      game.currentPlayerIndex += 1;
      openHandoffOverlay(game);
      return;
    }

    game.phase = "build";
    game.currentPlayerIndex = 0;
    game.turn = createTurnState();
    clearTurnUi();
    game.players.forEach((entry) => {
      entry.passedThisRound = false;
    });
    refreshMarket(game);
    setMessage(game, "info", `${getCurrentRound().name} build`, "Select a contractor from the market, place it on your own board, then end your turn.");
    pushFeed(game, "info", `${getCurrentRound().name} market opened`, "All players finished landscape placement and the shared contractor market is open.");
    openHandoffOverlay(game);
  }

  function findNextActiveBuildPlayerIndex() {
    if (!game.players.length) return -1;
    for (let offset = 1; offset <= game.players.length; offset += 1) {
      const nextIndex = (game.currentPlayerIndex + offset) % game.players.length;
      if (!game.players[nextIndex].passedThisRound) return nextIndex;
    }
    return -1;
  }

  function canScoreCurrentRound() {
    return game.phase === "build" && game.players.length > 0 && game.players.every((player) => player.passedThisRound);
  }

  function endBuildTurnOrScore() {
    if (!game.turn.actionTaken || game.phase !== "build") return;
    if (canScoreCurrentRound()) {
      scoreRoundForAllPlayers();
      return;
    }

    const currentIndex = game.currentPlayerIndex;
    const nextIndex = findNextActiveBuildPlayerIndex();
    game.turn = createTurnState();
    clearTurnUi();

    if (nextIndex === -1) {
      scoreRoundForAllPlayers();
      return;
    }
    game.currentPlayerIndex = nextIndex;
    if (nextIndex === currentIndex) {
      setMessage(game, "info", "Another turn", `${getPlayer().name} is the only player still building this round.`);
      return;
    }
    openHandoffOverlay(game);
  }

  function buildObjectiveResultsForPlayer(player, objectives) {
    const context = createEvaluationContext(game, player);
    return objectives.map((objective) => ({
      objective,
      result: objective.evaluate(context)
    }));
  }

  function scoreRoundForAllPlayers() {
    const round = getCurrentRound();
    game.phase = "scoreRound";

    const playerSummaries = game.players.map((player) => {
      const results = buildObjectiveResultsForPlayer(player, game.activeRoundObjectives);
      const roundPoints = Core.sum(results, (entry) => entry.result.points);
      const completedCount = results.filter((entry) => entry.result.points > 0).length;
      player.score += roundPoints;
      player.roundScores[game.roundIndex] = roundPoints;
      player.scoreLog.push({ kind: "round", roundName: round.name, results, total: roundPoints });
      return {
        player,
        results,
        roundPoints,
        completedCount
      };
    });

    if (game.roundIndex === 0) revealDirectorObjectives(game);
    pushFeed(game, "success", `${round.name} scored`, `${playerSummaries.length} campground${playerSummaries.length === 1 ? "" : "s"} were scored for ${round.name}.`);

    if (game.roundIndex === ROUND_DEFS.length - 1) {
      applyFinalScoring(playerSummaries);
      return;
    }

    const nextRound = ROUND_DEFS[game.roundIndex + 1];
    const revealLine = game.roundIndex === 0 ? "Camp Director objectives are now active for the final two rounds." : `${nextRound.name} will begin with fresh expansion tiles and another $50,000 grant.`;

    game.overlay = {
      kind: "round-summary",
      blocking: true,
      title: `${round.name} Summary`,
      lines: [
        `${round.name} scoring is complete for all players.`,
        revealLine
      ],
      rows: playerSummaries.map((summary) => ({
        player: summary.player,
        left: `${summary.player.name}`,
        right: `+${summary.roundPoints} pts`,
        detail: `${summary.completedCount}/${summary.results.length} objectives completed | ${summary.player.score} total`
      }))
    };
  }

  function applyFinalScoring(roundSummaries) {
    const directorSummaries = game.players.map((player) => {
      const results = buildObjectiveResultsForPlayer(player, game.activeDirectorObjectives);
      const directorPoints = Core.sum(results, (entry) => entry.result.points);
      player.directorScore = directorPoints;
      player.score += directorPoints;
      player.scoreLog.push({ kind: "director", roundName: "Camp Director Goals", results, total: directorPoints });
      return {
        player,
        results,
        directorPoints
      };
    });

    const standings = game.players
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        player,
        total: player.score,
        money: player.money,
        director: player.directorScore
      }));

    pushFeed(game, "success", "Final scoring", "Camp Director goals have been added and the final standings are ready.");
    game.phase = "gameOver";
    game.overlay = {
      kind: "final",
      blocking: true,
      title: "Final Camp Director Review",
      lines: [
        `Winner: ${standings[0].player.name} with ${standings[0].total} points.`,
        "Every board stayed separate, while the contractor market and seasonal objectives stayed shared."
      ],
      rows: standings.map((entry) => ({
        player: entry.player,
        left: `${entry.rank}. ${entry.player.name}`,
        right: `${entry.total} pts`,
        detail: `${Core.formatMoney(entry.money)} left | ${entry.director} director pts`
      })),
      roundRows: roundSummaries,
      directorRows: directorSummaries
    };
  }

  function startNextRound() {
    game.roundIndex += 1;
    game.phase = "setupLandscape";
    setActiveRoundObjectives(game, game.roundIndex);
    game.turn = createTurnState();
    clearTurnUi();
    game.currentPlayerIndex = 0;
    game.players.forEach((player) => {
      player.money += SEASON_BUDGET_GRANT;
      player.landscapeInventory = drawExpansionLandscapeInventory(game.roundIndex);
      player.landscapePlacementStack = [];
      player.passedThisRound = false;
    });
    refreshMarket(game);
    setMessage(game, "info", `${getCurrentRound().name} expansion`, `Every player received ${Core.formatMoney(SEASON_BUDGET_GRANT)} and 8 expansion landscape tiles.`);
    pushFeed(game, "info", `${getCurrentRound().name} begins`, "Season expansion tiles were dealt and the next layout phase is ready.");
    openHandoffOverlay(game);
  }

  function closeOverlay() {
    nameEditor?.close();
    game.overlay = null;
  }

  function handleResize() {
    runtime.layout = null;
  }

  function registerTarget(rect, onClick, options = {}) {
    const target = {
      id: options.id || `target-${runtime.targets.length}`,
      rect,
      onClick,
      enabled: options.enabled !== false,
      scope: options.scope || "main",
      kind: options.kind || "button",
      data: options.data || null
    };
    runtime.targets.push(target);
    return target.id;
  }

  function findTargetAtPoint(point) {
    const overlayOnly = !!game.overlay?.blocking;
    for (let index = runtime.targets.length - 1; index >= 0; index -= 1) {
      const target = runtime.targets[index];
      if (!target.enabled) continue;
      if (overlayOnly && target.scope !== "overlay") continue;
      if (Core.pointInRect(point, target.rect)) return target;
    }
    return null;
  }

  function handlePointerMove(point) {
    const target = findTargetAtPoint(point);
    runtime.hoveredTargetId = target?.id || null;
    game.ui.hoveredCell = target?.kind === "board-cell" ? target.data : null;
  }

  function handlePointerDown(point) {
    const target = findTargetAtPoint(point);
    if (!target || !target.onClick) return;
    target.onClick();
  }

  function handlePointerLeave() {
    runtime.hoveredTargetId = null;
    game.ui.hoveredCell = null;
  }

  function getPhaseLabel() {
    if (game.phase === "pregame") return "Start Game";
    if (game.phase === "setupLandscape" && game.roundIndex === 0) return "Starting Layout";
    if (game.phase === "setupLandscape") return "Season Expansion";
    if (game.phase === "build") return "Buy + Place";
    if (game.phase === "scoreRound") return "Round Scoring";
    return "Final Review";
  }

  function getLayoutMode(width, height) {
    if (width >= 1180 && height >= 760) return "desktop";
    if (height >= width) return "mobile-portrait";
    return "mobile-landscape";
  }

  function computeLayout(width, height) {
    const pad = Core.clamp(Math.round(Math.min(width, height) * 0.014), 8, 18);
    const gap = Core.clamp(Math.round(Math.min(width, height) * 0.01), 8, 14);
    const mode = getLayoutMode(width, height);

    if (mode === "desktop") {
      const topBarHeight = 116;
      const bottomBarHeight = 102;
      const topBar = { x: pad, y: pad, w: width - pad * 2, h: topBarHeight };
      const bottomBar = { x: pad, y: height - pad - bottomBarHeight, w: width - pad * 2, h: bottomBarHeight };
      const content = {
        x: pad,
        y: topBar.y + topBar.h + gap,
        w: width - pad * 2,
        h: bottomBar.y - (topBar.y + topBar.h + gap) - gap
      };
      const marketHeight = Core.clamp(Math.round(content.h * 0.42), 290, 380);
      const topAreaHeight = content.h - marketHeight - gap;
      const boardWidth = Math.round(content.w * 0.62);
      const boardPanel = { x: content.x, y: content.y, w: boardWidth, h: topAreaHeight };
      const sidePanel = { x: boardPanel.x + boardPanel.w + gap, y: content.y, w: content.w - boardWidth - gap, h: topAreaHeight };
      const infoHeight = 156;
      const sideTabs = { x: sidePanel.x, y: sidePanel.y + infoHeight + gap, w: sidePanel.w, h: 42 };
      const sideBody = { x: sidePanel.x, y: sideTabs.y + sideTabs.h + gap, w: sidePanel.w, h: sidePanel.h - infoHeight - sideTabs.h - gap * 2 };
      const marketPanel = { x: content.x, y: content.y + topAreaHeight + gap, w: content.w, h: marketHeight };
      return { mode, pad, gap, width, height, topBar, bottomBar, boardPanel, infoPanel: { x: sidePanel.x, y: sidePanel.y, w: sidePanel.w, h: infoHeight }, sideTabs, sideBody, marketPanel };
    }

    if (mode === "mobile-landscape") {
      const topBarHeight = 100;
      const bottomBarHeight = 94;
      const topBar = { x: pad, y: pad, w: width - pad * 2, h: topBarHeight };
      const bottomBar = { x: pad, y: height - pad - bottomBarHeight, w: width - pad * 2, h: bottomBarHeight };
      const content = {
        x: pad,
        y: topBar.y + topBar.h + gap,
        w: width - pad * 2,
        h: bottomBar.y - (topBar.y + topBar.h + gap) - gap
      };
      const boardWidth = Math.round(content.w * 0.56);
      const boardPanel = { x: content.x, y: content.y, w: boardWidth, h: content.h };
      const sidePanel = { x: boardPanel.x + boardPanel.w + gap, y: content.y, w: content.w - boardWidth - gap, h: content.h };
      const infoHeight = 108;
      const sideTabs = { x: sidePanel.x, y: sidePanel.y + infoHeight + gap, w: sidePanel.w, h: 40 };
      const sideBody = { x: sidePanel.x, y: sideTabs.y + sideTabs.h + gap, w: sidePanel.w, h: sidePanel.h - infoHeight - sideTabs.h - gap * 2 };
      return { mode, pad, gap, width, height, topBar, bottomBar, boardPanel, infoPanel: { x: sidePanel.x, y: sidePanel.y, w: sidePanel.w, h: infoHeight }, sideTabs, sideBody };
    }

    const playerCount = Math.max(2, game.players.length || game.ui.configuredPlayerCount || 2);
    const extraRosterRows = playerCount > 4 ? 1 : 0;
    const selectionHeavy = game.ui.selection.source === "landscape" || game.ui.selection.source === "market";
    const topBarHeight = game.players.length ? 182 + extraRosterRows * 34 : 120;
    const bottomBarHeight = selectionHeavy ? 176 : game.phase === "setupLandscape" ? 154 : 142;
    const topBar = { x: pad, y: pad, w: width - pad * 2, h: topBarHeight };
    const bottomBar = { x: pad, y: height - pad - bottomBarHeight, w: width - pad * 2, h: bottomBarHeight };
    const content = {
      x: pad,
      y: topBar.y + topBar.h + gap,
      w: width - pad * 2,
      h: bottomBar.y - (topBar.y + topBar.h + gap) - gap
    };
    const tabBar = { x: content.x, y: content.y, w: content.w, h: 52 };
    const mainPanel = { x: content.x, y: tabBar.y + tabBar.h + gap, w: content.w, h: content.h - tabBar.h - gap };
    return { mode, pad, gap, width, height, topBar, bottomBar, tabBar, mainPanel };
  }

  function getBoardGeometry(panelRect) {
    const headerHeight = runtime.layout.mode === "mobile-portrait" ? 58 : 34;
    const inner = Core.insetRect(panelRect, 12);
    const rackVisible = game.phase === "setupLandscape" && runtime.layout.mode !== "mobile-portrait";
    const rackHeight = rackVisible ? Core.clamp(Math.round(panelRect.h * 0.24), runtime.layout.mode === "mobile-landscape" ? 128 : 104, 168) : 0;
    const boardArea = {
      x: inner.x,
      y: inner.y + headerHeight,
      w: inner.w,
      h: inner.h - headerHeight - (rackVisible ? rackHeight + 8 : 0)
    };
    return getBoardGeometryForArea(boardArea, rackVisible
      ? { x: inner.x, y: panelRect.y + panelRect.h - rackHeight - 12, w: inner.w, h: rackHeight }
      : null, headerHeight);
  }

  function getBoardGeometryForArea(boardArea, rackRect = null, headerHeight = 0) {
    const labelSize = runtime.layout.mode === "mobile-portrait" ? 16 : 22;
    const gap = Core.clamp(Math.floor(Math.min(boardArea.w / 80, boardArea.h / 40) * 6), runtime.layout.mode === "mobile-portrait" ? 2 : 3, 8);
    const availableWidth = boardArea.w - labelSize;
    const availableHeight = boardArea.h - labelSize;
    const cellSize = Math.floor(Math.min(
      (availableWidth - gap * (BOARD_COLS - 1)) / BOARD_COLS,
      (availableHeight - gap * (BOARD_ROWS - 1)) / BOARD_ROWS
    ));
    const boardWidth = cellSize * BOARD_COLS + gap * (BOARD_COLS - 1);
    const boardHeight = cellSize * BOARD_ROWS + gap * (BOARD_ROWS - 1);
    const originX = boardArea.x + labelSize + Math.max(0, (availableWidth - boardWidth) / 2);
    const originY = boardArea.y + labelSize + Math.max(0, (availableHeight - boardHeight) / 2);
    return { headerHeight, labelSize, gap, cellSize, originX, originY, boardWidth, boardHeight, rackRect };
  }

  function getCellRect(geometry, row, col) {
    return {
      x: geometry.originX + col * (geometry.cellSize + geometry.gap),
      y: geometry.originY + row * (geometry.cellSize + geometry.gap),
      w: geometry.cellSize,
      h: geometry.cellSize
    };
  }

  function cleanupTransientState() {
    if (game.ui.lastAttempt && performance.now() - game.ui.lastAttempt.at > 1400) {
      game.ui.lastAttempt = null;
    }
  }

  function getVisibleMarketPageSize() {
    if (!runtime.layout) return 6;
    if (runtime.layout.mode === "desktop") return 6;
    if (runtime.layout.mode === "mobile-landscape") return 3;
    return runtime.layout.width < 410 ? 1 : 2;
  }

  function getObjectiveCardsPerPage() {
    if (!runtime.layout) return 4;
    if (runtime.layout.mode === "desktop") return 4;
    return 1;
  }

  function drawPanel(rect, title, subtitle) {
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22, "rgba(255, 249, 240, 0.96)", "rgba(108, 80, 54, 0.16)", 1.4);
    ctx.fillStyle = "#3f2d20";
    const isPortrait = runtime.layout.mode === "mobile-portrait";
    ctx.font = isPortrait
      ? "800 16px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "700 18px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, rect.x + 12, rect.y + 10);
    if (subtitle) {
      Core.drawWrappedText(ctx, subtitle, isPortrait ? rect.x + 12 : rect.x + rect.w - 12, rect.y + (isPortrait ? 30 : 12), isPortrait ? rect.w - 24 : Math.max(110, rect.w * 0.54), isPortrait ? 12 : 13, {
        font: isPortrait
          ? "600 10px 'Avenir Next', 'Trebuchet MS', sans-serif"
          : "600 12px 'Avenir Next', 'Trebuchet MS', sans-serif",
        align: isPortrait ? "left" : "right",
        color: "rgba(82, 61, 44, 0.72)",
        maxLines: isPortrait ? 2 : 2
      });
    }
    return {
      x: rect.x + 10,
      y: rect.y + (isPortrait ? 56 : 42),
      w: rect.w - 20,
      h: rect.h - (isPortrait ? 66 : 52)
    };
  }

  function getButtonPalette(variant, enabled, selected) {
    if (!enabled) {
      return {
        fill: "rgba(223, 214, 201, 0.9)",
        stroke: "rgba(116, 98, 77, 0.14)",
        text: "rgba(91, 74, 56, 0.52)"
      };
    }
    if (selected) {
      return {
        fill: "#d38245",
        stroke: "#a55723",
        text: "#fff9f3"
      };
    }
    if (variant === "primary") return { fill: "#ca6f36", stroke: "#995127", text: "#fff7f1" };
    if (variant === "danger") return { fill: "#a95f55", stroke: "#7d3a34", text: "#fff7f6" };
    if (variant === "success") return { fill: "#5f8d65", stroke: "#3e6544", text: "#f7fff8" };
    if (variant === "warning") return { fill: "#d3a24d", stroke: "#9e7331", text: "#fff8ee" };
    return {
      fill: "rgba(247, 236, 220, 0.98)",
      stroke: "rgba(108, 80, 54, 0.18)",
      text: "#4a3524"
    };
  }

  function drawButton(rect, label, onClick, options = {}) {
    const enabled = options.enabled !== false;
    const id = options.id || label;
    const palette = getButtonPalette(options.variant, enabled, options.selected);
    const hovered = runtime.hoveredTargetId === id;
    const yOffset = hovered && enabled ? -1 : 0;
    const radius = options.radius || (runtime.layout?.mode === "mobile-portrait" ? 18 : 16);

    if (onClick) {
      registerTarget(rect, onClick, { id, enabled, scope: options.scope || "main", kind: "button" });
    }

    Core.drawRoundedRect(ctx, rect.x, rect.y + yOffset, rect.w, rect.h, radius, palette.fill, palette.stroke, hovered && enabled ? 2 : 1.5);
    if (hovered && enabled) {
      Core.drawRoundedRect(ctx, rect.x + 2, rect.y + yOffset + 2, rect.w - 4, rect.h - 4, radius - 2, null, "rgba(255,255,255,0.28)", 1);
    }

    ctx.fillStyle = palette.text;
    ctx.font = options.font || (runtime.layout?.mode === "mobile-portrait"
      ? "800 13px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "700 13px 'Avenir Next', 'Trebuchet MS', sans-serif");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + yOffset + (options.textYOffset ?? 0.5));
  }

  function drawMenuButton(rect, onClick, options = {}) {
    drawButton(rect, "", onClick, options);
    const stroke = options.selected ? "#fff9f3" : "#4a3524";
    const left = rect.x + rect.w * 0.28;
    const right = rect.x + rect.w * 0.72;
    const centerY = rect.y + rect.h / 2 + (options.textYOffset ?? 0);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.2;
    [-6, 0, 6].forEach((offset) => {
      ctx.beginPath();
      ctx.moveTo(left, centerY + offset);
      ctx.lineTo(right, centerY + offset);
      ctx.stroke();
    });
  }

  function drawPill(x, y, text, fill, textColor, options = {}) {
    const paddingX = options.paddingX || 12;
    const height = options.height || 24;
    const radius = options.radius || Math.floor(height / 2);
    ctx.save();
    ctx.font = options.font || "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
    const width = ctx.measureText(text).width + paddingX * 2;
    Core.drawRoundedRect(ctx, x, y, width, height, radius, fill, options.stroke || null, options.stroke ? 1 : 0);
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2 + (options.textYOffset ?? 0.5));
    ctx.restore();
    return width;
  }

  function fitText(text, maxWidth, font) {
    const value = String(text || "");
    ctx.save();
    if (font) ctx.font = font;
    if (ctx.measureText(value).width <= maxWidth) {
      ctx.restore();
      return value;
    }
    let trimmed = value;
    while (trimmed.length > 1 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
      trimmed = trimmed.slice(0, -1).trimEnd();
    }
    ctx.restore();
    return `${trimmed || value.slice(0, 1)}...`;
  }

  function renderBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, runtime.layout.height);
    gradient.addColorStop(0, "#f7eedf");
    gradient.addColorStop(0.48, "#efe2c5");
    gradient.addColorStop(1, "#e2cca1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, runtime.layout.width, runtime.layout.height);

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(runtime.layout.width * 0.18, runtime.layout.height * 0.08, runtime.layout.width * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(runtime.layout.width * 0.86, runtime.layout.height * 0.14, runtime.layout.width * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function renderPortraitTopBar(rect, player) {
    const pad = 14;
    const titleFont = "800 20px 'Avenir Next', 'Trebuchet MS', sans-serif";
    const buttonHeight = 36;
    const menuWidth = 40;
    const fullWidth = 58;
    const menuX = rect.x + rect.w - pad - menuWidth;
    const fullscreenX = menuX - 8 - fullWidth;

    ctx.fillStyle = "#3b2c20";
    ctx.font = titleFont;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Smore to Explore", rect.x + pad, rect.y + 12);

    drawButton(
      { x: fullscreenX, y: rect.y + 10, w: fullWidth, h: buttonHeight },
      controller.state.isFullscreen ? "Exit" : "Full",
      async () => {
        if (!controller.state.fullscreenSupported) {
          setMessage(game, "warning", "Fullscreen unavailable", "This browser is managing fullscreen itself on the current device.");
          return;
        }
        try {
          await controller.toggleFullscreen(appShell);
        } catch (_error) {
          setMessage(game, "warning", "Fullscreen unavailable", "The browser refused fullscreen for this tap.");
        }
      },
      {
        id: "top-fullscreen",
        enabled: controller.state.fullscreenSupported,
        font: "800 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
      }
    );
    drawMenuButton(
      { x: menuX, y: rect.y + 10, w: menuWidth, h: buttonHeight },
      openPauseMenu,
      {
        id: "top-pause-menu"
      }
    );

    if (!player) {
      Core.drawWrappedText(ctx, "Pass one phone around the table and build each campground one turn at a time.", rect.x + pad, rect.y + 48, rect.w - pad * 2 - menuWidth - fullWidth - 16, 14, {
        font: "600 11px 'Avenir Next', 'Trebuchet MS', sans-serif",
        color: "rgba(82, 61, 44, 0.8)",
        maxLines: 2
      });
      return;
    }

    const roundName = getCurrentRound().name;
    const phaseFill = game.phase === "build" ? "#d77837" : game.phase === "setupLandscape" ? "#7c9c63" : "#8e6a9f";
    const pillY = rect.y + 42;
    const roundWidth = drawPill(rect.x + pad, pillY, roundName, "#efe2ca", "#5f4731", {
      height: 24,
      paddingX: 12,
      font: "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
    });
    drawPill(rect.x + pad + roundWidth + 8, pillY, getPhaseLabel(), phaseFill, "#fffaf6", {
      height: 24,
      paddingX: 12,
      font: "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
    });

    const heroRect = {
      x: rect.x + pad,
      y: rect.y + 70,
      w: rect.w - pad * 2,
      h: 54
    };
    Core.drawRoundedRect(ctx, heroRect.x, heroRect.y, heroRect.w, heroRect.h, 20, player.color.fill, "rgba(0,0,0,0.08)", 1.5);
    Core.drawRoundedRect(ctx, heroRect.x + 1, heroRect.y + 1, heroRect.w - 2, heroRect.h - 2, 19, null, "rgba(255,255,255,0.22)", 1);

    ctx.fillStyle = player.color.text;
    ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Current player", heroRect.x + 14, heroRect.y + 8);
    ctx.font = "800 18px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.fillText(fitText(player.name, heroRect.w * 0.48, ctx.font), heroRect.x + 14, heroRect.y + 24);

    const statusText = game.phase === "build" && player.passedThisRound
      ? "Passed"
      : game.turn.actionTaken
        ? "Turn done"
        : "Ready now";
    drawPill(heroRect.x + heroRect.w - 96, heroRect.y + 9, statusText, "rgba(255,255,255,0.24)", player.color.text, {
      height: 20,
      paddingX: 10,
      font: "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif",
      stroke: "rgba(255,255,255,0.2)"
    });

    ctx.textAlign = "right";
    ctx.font = "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.fillText(Core.formatMoney(player.money), heroRect.x + heroRect.w - 14, heroRect.y + 18);
    ctx.font = "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.fillText(`${player.score} pts`, heroRect.x + heroRect.w - 14, heroRect.y + 37);

    const others = game.players.filter((_, index) => index !== game.currentPlayerIndex);
    if (!others.length) return;

    ctx.fillStyle = "rgba(74, 53, 36, 0.76)";
    ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Other players", rect.x + pad, heroRect.y + heroRect.h + 6);

    const chipTop = heroRect.y + heroRect.h + 20;
    const chipGap = 6;
    const columns = Math.min(3, others.length);
    const chipWidth = (rect.w - pad * 2 - chipGap * (columns - 1)) / columns;
    const chipHeight = 28;
    others.forEach((entry, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const chipRect = {
        x: rect.x + pad + col * (chipWidth + chipGap),
        y: chipTop + row * (chipHeight + chipGap),
        w: chipWidth,
        h: chipHeight
      };
      Core.drawRoundedRect(ctx, chipRect.x, chipRect.y, chipRect.w, chipRect.h, 14, "rgba(248, 240, 228, 0.98)", "rgba(108,80,54,0.14)", 1);
      Core.drawRoundedRect(ctx, chipRect.x + 6, chipRect.y + 6, 6, chipRect.h - 12, 3, entry.color.fill);
      ctx.fillStyle = "#4a3524";
      ctx.font = "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const suffix = game.phase === "build" && entry.passedThisRound ? " | passed" : "";
      ctx.fillText(fitText(`${entry.name}${suffix}`, chipRect.w - 24, ctx.font), chipRect.x + 18, chipRect.y + chipRect.h / 2 + 0.5);
    });
  }

  function renderTopBar(rect) {
    const player = getPlayer();
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 26, "rgba(255, 250, 243, 0.97)", "rgba(108, 80, 54, 0.16)", 1.5);

    if (runtime.layout.mode === "mobile-portrait") {
      renderPortraitTopBar(rect, player);
      return;
    }

    ctx.fillStyle = "#3b2c20";
    ctx.font = runtime.layout.mode === "mobile-portrait"
      ? "800 22px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "800 26px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Smore to Explore", rect.x + 18, rect.y + 14);

    const phaseFill = game.phase === "build" ? "#d77837" : game.phase === "setupLandscape" ? "#7c9c63" : "#8e6a9f";
    const roundName = game.players.length ? getCurrentRound().name : "Campground Pass-and-Play";
    const pillY = rect.y + 54;
    const roundPillWidth = drawPill(rect.x + 18, pillY, roundName, "#efe2ca", "#5f4731", {
      height: 26,
      paddingX: 13,
      font: "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif"
    });
    drawPill(rect.x + 18 + roundPillWidth + 8, pillY, getPhaseLabel(), phaseFill, "#fffaf6", {
      height: 26,
      paddingX: 13,
      font: "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif"
    });

    const buttonWidth = runtime.layout.mode === "mobile-portrait" ? 72 : 84;
    const buttonHeight = runtime.layout.mode === "mobile-portrait" ? 32 : 30;
    const menuWidth = buttonHeight;
    const buttonGap = 8;
    const menuX = rect.x + rect.w - menuWidth - 18;
    const fullscreenX = menuX - buttonGap - buttonWidth;
    drawButton(
      { x: fullscreenX, y: rect.y + 14, w: buttonWidth, h: buttonHeight },
      controller.state.isFullscreen ? "Exit Full" : "Fullscreen",
      async () => {
        if (!controller.state.fullscreenSupported) {
          setMessage(game, "warning", "Fullscreen unavailable", "This browser is managing fullscreen itself on the current device.");
          return;
        }
        try {
          await controller.toggleFullscreen(appShell);
        } catch (_error) {
          setMessage(game, "warning", "Fullscreen unavailable", "The browser refused fullscreen for this tap.");
        }
      },
      {
        id: "top-fullscreen",
        enabled: controller.state.fullscreenSupported,
        font: "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif"
      }
    );
    drawMenuButton(
      { x: menuX, y: rect.y + 14, w: menuWidth, h: buttonHeight },
      openPauseMenu,
      {
        id: "top-pause-menu"
      }
    );

    if (!player) return;

    const rosterRect = {
      x: rect.x + rect.w * 0.34,
      y: rect.y + 16,
      w: fullscreenX - (rect.x + rect.w * 0.34) - 12,
      h: runtime.layout.mode === "mobile-portrait" ? 62 : 66
    };
    const chipGap = 8;
    const chipWidth = (rosterRect.w - chipGap * (game.players.length - 1)) / game.players.length;
    game.players.forEach((entry, index) => {
      const chipRect = {
        x: rosterRect.x + index * (chipWidth + chipGap),
        y: rosterRect.y,
        w: chipWidth,
        h: rosterRect.h
      };
      const active = index === game.currentPlayerIndex;
      const fill = active ? entry.color.fill : "rgba(243, 232, 216, 0.96)";
      const stroke = active ? "rgba(0,0,0,0.08)" : "rgba(108,80,54,0.14)";
      const text = active ? entry.color.text : "#5b4330";
      Core.drawRoundedRect(ctx, chipRect.x, chipRect.y, chipRect.w, chipRect.h, 20, fill, stroke, active ? 1.6 : 1);
      if (!active) {
        Core.drawRoundedRect(ctx, chipRect.x + 6, chipRect.y + 6, 8, chipRect.h - 12, 4, entry.color.fill, null, 0);
      }
      ctx.fillStyle = text;
      ctx.font = runtime.layout.mode === "mobile-portrait"
        ? "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "800 15px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const statusSuffix = game.phase === "build" && entry.passedThisRound ? " | passed" : "";
      ctx.fillText(fitText(entry.name, chipRect.w - 18, ctx.font), chipRect.x + chipRect.w / 2, chipRect.y + 10);
      ctx.font = runtime.layout.mode === "mobile-portrait"
        ? "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.fillText(`${Core.formatMoney(entry.money)} | ${entry.score} pts${statusSuffix}`, chipRect.x + chipRect.w / 2, chipRect.y + 34);
    });
  }

  function getBottomSummary() {
    const player = getPlayer();
    if (!player) return game.message;

    if (game.ui.selection.source === "landscape") {
      const def = getLandscapeDef(game.ui.selection.typeId);
      if (game.ui.hoveredCell) {
        const reasons = getLandscapePlacementReasons(game, player, game.ui.hoveredCell.row, game.ui.hoveredCell.col, game.ui.selection.typeId, game.ui.selection.rotation);
        if (reasons.length) {
          return {
            tone: "error",
            title: `${def.name} on ${formatBoardCellLabel(game.ui.hoveredCell.row, game.ui.hoveredCell.col)}`,
            body: reasons[0]
          };
        }
        return {
          tone: "success",
          title: `${def.name} on ${formatBoardCellLabel(game.ui.hoveredCell.row, game.ui.hoveredCell.col)}`,
          body: `Valid placement at ${game.ui.selection.rotation * 90} degrees.`
        };
      }
      const remaining = player.landscapeInventory.find((entry) => entry.typeId === def.id)?.count || 0;
      return {
        tone: "info",
        title: `${def.name} selected`,
        body: `Rotation: ${game.ui.selection.rotation * 90} degrees | Remaining in hand: ${remaining}.`
      };
    }

    if (game.ui.selection.source === "market") {
      const def = getCampDef(game.ui.selection.typeId);
      if (game.ui.hoveredCell) {
        const reasons = getCampTilePlacementReasons(game, player, game.ui.hoveredCell.row, game.ui.hoveredCell.col, def.id);
        if (reasons.length) {
          return {
            tone: "error",
            title: `${def.name} on ${formatBoardCellLabel(game.ui.hoveredCell.row, game.ui.hoveredCell.col)}`,
            body: reasons[0]
          };
        }
        const bonuses = scoreAdjacencyBonuses(game, player, game.ui.hoveredCell.row, game.ui.hoveredCell.col, def.id);
        return {
          tone: "success",
          title: `${def.name} on ${formatBoardCellLabel(game.ui.hoveredCell.row, game.ui.hoveredCell.col)}`,
          body: bonuses.lines[0] || "Valid placement on this parcel."
        };
      }
      return {
        tone: "info",
        title: `${def.name} selected`,
        body: `${Core.formatMoney(def.cost)} | ${def.rulesText}`
      };
    }

    if (game.turn.actionTaken && game.phase === "build") {
      return canScoreCurrentRound()
        ? { tone: "success", title: "Round ready to score", body: `All players have passed for ${getCurrentRound().name}. Score the round when you are ready.` }
        : { tone: "success", title: "Turn complete", body: "End the turn to hand the device to the next player." };
    }
    if (game.turn.actionTaken && game.phase === "setupLandscape") {
      return { tone: "success", title: "Layout complete", body: "Continue to the next player or open the contractor market." };
    }
    if (game.ui.inspectedCell) {
      const cell = getCell(player.board, game.ui.inspectedCell.row, game.ui.inspectedCell.col);
      if (!cell.landscapeTile) {
        return {
          tone: "info",
          title: `Parcel ${formatBoardCellLabel(game.ui.inspectedCell.row, game.ui.inspectedCell.col)}`,
          body: "This parcel is still empty. Add landscape first, then camp tiles later."
        };
      }
      return {
        tone: "info",
        title: `Parcel ${formatBoardCellLabel(game.ui.inspectedCell.row, game.ui.inspectedCell.col)}`,
        body: cell.campTile ? `${getLandscapeDef(cell.landscapeTile.typeId).name} with ${getCampDef(cell.campTile.typeId).name}.` : `${getLandscapeDef(cell.landscapeTile.typeId).name} is open for camp development.`
      };
    }
    return game.message;
  }

  function getBottomActions(player) {
    if (!player || game.overlay?.blocking) return [];
    const actions = [];
    if (game.phase === "setupLandscape") {
      if (player.landscapePlacementStack.length) actions.push({ label: "Undo", onClick: undoLandscapePlacement });
      if (game.ui.selection.source === "landscape") {
        actions.push({ label: "Rotate Left", onClick: () => rotateSelectedLandscape(-1) });
        actions.push({ label: "Rotate Right", onClick: () => rotateSelectedLandscape(1) });
      }
      if (game.ui.selection.source) actions.push({ label: "Clear", onClick: clearSelection });
      if (isCurrentLandscapePhaseComplete()) actions.push({ label: "Continue", onClick: continueLandscapeFlow, variant: "primary" });
      return actions;
    }
    if (game.phase === "build") {
      if (game.ui.selection.source) actions.push({ label: "Clear", onClick: clearSelection });
      if (!game.turn.actionTaken) actions.push({ label: "Pass Round", onClick: passCurrentPlayerForRound, variant: "warning" });
      if (game.turn.actionTaken) {
        actions.push({
          label: canScoreCurrentRound() ? `Score ${getCurrentRound().name}` : "End Turn",
          onClick: endBuildTurnOrScore,
          variant: "primary"
        });
      }
      return actions;
    }
    return actions;
  }

  function drawActionGrid(rect, actions) {
    if (!actions.length) {
      ctx.fillStyle = "rgba(82, 61, 44, 0.64)";
      ctx.font = "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No actions right now", rect.x + rect.w / 2, rect.y + rect.h / 2);
      return;
    }
    const isPortrait = runtime.layout.mode === "mobile-portrait";
    const gap = 8;
    const columns = isPortrait ? 2 : Math.min(actions.length, 4);
    const rows = Math.ceil(actions.length / columns);
    const buttonWidth = (rect.w - gap * (columns - 1)) / columns;
    const buttonHeight = (rect.h - gap * (rows - 1)) / rows;

    actions.forEach((action, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      drawButton({
        x: rect.x + col * (buttonWidth + gap),
        y: rect.y + row * (buttonHeight + gap),
        w: buttonWidth,
        h: buttonHeight
      }, action.label, action.onClick, {
        id: `bottom-${action.label}`,
        variant: action.variant
      });
    });
  }

  function drawSelectionTray(rect, summary) {
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1);
    const previewRect = { x: rect.x + 8, y: rect.y + 8, w: 52, h: 52 };
    if (game.ui.selection.source === "landscape") {
      drawLandscapeTileVisual(previewRect, { typeId: game.ui.selection.typeId, rotation: game.ui.selection.rotation });
    } else if (game.ui.selection.source === "market") {
      drawCampTileVisual(previewRect, { typeId: game.ui.selection.typeId });
    }
    ctx.fillStyle = summary.tone === "error" ? "#8f4338" : summary.tone === "success" ? "#3d6a46" : "#4a3524";
    ctx.font = "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    const textX = previewRect.x + previewRect.w + 10;
    const textWidth = rect.w - (textX - rect.x) - 10;
    ctx.fillText(fitText(summary.title, textWidth, ctx.font), textX, rect.y + 10);
    Core.drawWrappedText(ctx, summary.body, textX, rect.y + 28, textWidth, 13, {
      font: "600 11px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      maxLines: 2
    });
  }

  function renderBottomBar(rect) {
    const player = getPlayer();
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 22, "rgba(255, 248, 239, 0.97)", "rgba(108, 80, 54, 0.16)", 1.4);
    const summary = getBottomSummary();
    const actions = getBottomActions(player);

    if (runtime.layout.mode === "mobile-portrait") {
      const inner = Core.insetRect(rect, 10);
      let actionRect;
      if (game.ui.selection.source) {
        const trayRect = { x: inner.x, y: inner.y, w: inner.w, h: 68 };
        drawSelectionTray(trayRect, summary);
        actionRect = { x: inner.x, y: trayRect.y + trayRect.h + 8, w: inner.w, h: rect.y + rect.h - (trayRect.y + trayRect.h + 18) };
      } else {
        const summaryRect = { x: inner.x, y: inner.y, w: inner.w, h: 54 };
        Core.drawRoundedRect(ctx, summaryRect.x, summaryRect.y, summaryRect.w, summaryRect.h, 16, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1);
        ctx.fillStyle = summary.tone === "error" ? "#8f4338" : summary.tone === "success" ? "#3d6a46" : summary.tone === "warning" ? "#88622d" : "#4a3524";
        ctx.font = "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(fitText(summary.title, summaryRect.w - 20, ctx.font), summaryRect.x + 10, summaryRect.y + 8);
        Core.drawWrappedText(ctx, summary.body, summaryRect.x + 10, summaryRect.y + 24, summaryRect.w - 20, 12, {
          font: "600 10px 'Avenir Next', 'Trebuchet MS', sans-serif",
          color: "rgba(82, 61, 44, 0.86)",
          maxLines: 2
        });
        actionRect = { x: inner.x, y: summaryRect.y + summaryRect.h + 8, w: inner.w, h: rect.y + rect.h - (summaryRect.y + summaryRect.h + 18) };
      }
      drawActionGrid(actionRect, actions);
      return;
    }

    const gap = 10;
    const summaryRect = { x: rect.x + 10, y: rect.y + 10, w: rect.w * 0.54, h: rect.h - 20 };
    const buttonRect = { x: summaryRect.x + summaryRect.w + gap, y: rect.y + 10, w: rect.w - summaryRect.w - gap - 20, h: rect.h - 20 };

    Core.drawRoundedRect(ctx, summaryRect.x, summaryRect.y, summaryRect.w, summaryRect.h, 16, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1);
    ctx.fillStyle = summary.tone === "error" ? "#8f4338" : summary.tone === "success" ? "#3d6a46" : summary.tone === "warning" ? "#88622d" : "#4a3524";
    ctx.font = "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(summary.title, summaryRect.x + 10, summaryRect.y + 8);
    Core.drawWrappedText(ctx, summary.body, summaryRect.x + 10, summaryRect.y + 23, summaryRect.w - 20, 13, {
      font: "600 11px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.86)",
      maxLines: 2
    });
    drawActionGrid(buttonRect, actions);
  }

  function renderPortraitTabBar(rect) {
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 20, "rgba(255,249,240,0.95)", "rgba(108,80,54,0.16)", 1.2);
    const tabs = [
      { id: "board", label: "Board" },
      { id: "market", label: "Market" },
      { id: "objectives", label: "Goals" },
      { id: "score", label: "Score" }
    ];
    const gap = 5;
    const width = (rect.w - gap * (tabs.length - 1) - 10) / tabs.length;
    tabs.forEach((tab, index) => {
      drawButton({
        x: rect.x + 5 + index * (width + gap),
        y: rect.y + 5,
        w: width,
        h: rect.h - 10
      }, tab.label, () => {
        game.ui.mobileTab = tab.id;
      }, {
        id: `portrait-tab-${tab.id}`,
        selected: game.ui.mobileTab === tab.id,
        font: "800 11px 'Avenir Next', 'Trebuchet MS', sans-serif",
        textYOffset: 1
      });
    });
  }

  function renderSegmentTabs(rect, tabs, activeId, onSelect, scopePrefix) {
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, "rgba(249, 242, 232, 0.96)", "rgba(108,80,54,0.14)", 1);
    const gap = runtime.layout.mode === "mobile-portrait" ? 5 : 4;
    const width = (rect.w - gap * (tabs.length - 1) - 8) / tabs.length;
    tabs.forEach((tab, index) => {
      drawButton({
        x: rect.x + 4 + index * (width + gap),
        y: rect.y + 4,
        w: width,
        h: rect.h - 8
      }, tab.label, tab.enabled === false ? null : () => onSelect(tab.id), {
        id: `${scopePrefix}-${tab.id}`,
        enabled: tab.enabled !== false,
        selected: activeId === tab.id,
        font: runtime.layout.mode === "mobile-portrait"
          ? "800 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
          : "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif",
        textYOffset: 1
      });
    });
  }

  function drawBoardLabels(geometry) {
    ctx.fillStyle = "rgba(70, 52, 37, 0.72)";
    ctx.font = geometry.cellSize >= 54
      ? "700 15px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const rect = getCellRect(geometry, 0, col);
      ctx.fillText(String.fromCharCode(65 + col), rect.x + rect.w / 2, geometry.originY - geometry.labelSize * 0.55);
    }
    ctx.textAlign = "right";
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const rect = getCellRect(geometry, row, 0);
      ctx.fillText(String(row + 1), geometry.originX - 10, rect.y + rect.h / 2);
    }
  }

  function drawWaterEdges(rect, info) {
    const fill = "rgba(103, 167, 200, 0.92)";
    const thickness = Math.max(8, rect.w * 0.14);
    for (const side of SIDES) {
      if (info.edges[side] !== "water") continue;
      if (side === "north") Core.drawRoundedRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, thickness, thickness / 2, fill);
      if (side === "east") Core.drawRoundedRect(ctx, rect.x + rect.w - thickness - 6, rect.y + 6, thickness, rect.h - 12, thickness / 2, fill);
      if (side === "south") Core.drawRoundedRect(ctx, rect.x + 6, rect.y + rect.h - thickness - 6, rect.w - 12, thickness, thickness / 2, fill);
      if (side === "west") Core.drawRoundedRect(ctx, rect.x + 6, rect.y + 6, thickness, rect.h - 12, thickness / 2, fill);
    }
  }

  function drawRoadEdges(rect, info) {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    ctx.strokeStyle = "#d6b07a";
    ctx.lineWidth = Math.max(8, rect.w * 0.15);
    ctx.lineCap = "round";
    ctx.beginPath();
    let hasRoad = false;
    for (const side of SIDES) {
      if (info.edges[side] !== "road") continue;
      hasRoad = true;
      ctx.moveTo(centerX, centerY);
      if (side === "north") ctx.lineTo(centerX, rect.y + 8);
      if (side === "east") ctx.lineTo(rect.x + rect.w - 8, centerY);
      if (side === "south") ctx.lineTo(centerX, rect.y + rect.h - 8);
      if (side === "west") ctx.lineTo(rect.x + 8, centerY);
    }
    ctx.stroke();
    if (hasRoad) {
      ctx.fillStyle = "#c99e62";
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(7, rect.w * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    for (const side of SIDES) {
      if (info.edges[side] !== "entrance") continue;
      ctx.strokeStyle = "#874721";
      ctx.lineWidth = Math.max(3, rect.w * 0.06);
      ctx.beginPath();
      const offset = Math.max(10, rect.w * 0.18);
      const depth = Math.max(16, rect.w * 0.28);
      if (side === "north") {
        ctx.moveTo(centerX - offset, rect.y + 10); ctx.lineTo(centerX - offset, rect.y + depth);
        ctx.moveTo(centerX + offset, rect.y + 10); ctx.lineTo(centerX + offset, rect.y + depth);
      }
      if (side === "east") {
        ctx.moveTo(rect.x + rect.w - 10, centerY - offset); ctx.lineTo(rect.x + rect.w - depth, centerY - offset);
        ctx.moveTo(rect.x + rect.w - 10, centerY + offset); ctx.lineTo(rect.x + rect.w - depth, centerY + offset);
      }
      if (side === "south") {
        ctx.moveTo(centerX - offset, rect.y + rect.h - 10); ctx.lineTo(centerX - offset, rect.y + rect.h - depth);
        ctx.moveTo(centerX + offset, rect.y + rect.h - 10); ctx.lineTo(centerX + offset, rect.y + rect.h - depth);
      }
      if (side === "west") {
        ctx.moveTo(rect.x + 10, centerY - offset); ctx.lineTo(rect.x + depth, centerY - offset);
        ctx.moveTo(rect.x + 10, centerY + offset); ctx.lineTo(rect.x + depth, centerY + offset);
      }
      ctx.stroke();
    }
  }

  function drawCornerBadge(rect, text) {
    Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 8, rect.w * 0.42, 18, 9, "rgba(255,255,255,0.74)");
    ctx.fillStyle = "#5a4430";
    ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rect.x + rect.w * 0.21, rect.y + 17);
  }

  function drawMiniBadge(rect, text, fill, textColor) {
    Core.drawRoundedRect(ctx, rect.x + rect.w * 0.18, rect.y + rect.h - 24, rect.w * 0.64, 18, 9, fill, "rgba(0,0,0,0.08)", 1);
    ctx.fillStyle = textColor;
    ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h - 15);
  }

  function drawLandscapeTileVisual(rect, tile) {
    const info = getLandscapeInfoFromTile(tile);
    const fill = info.hasForestTag ? "#9fba7d" : info.hasWaterEdge ? "#c4dee2" : "#c8dca3";
    Core.drawRoundedRect(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, Math.max(8, rect.w * 0.18), fill, "rgba(64, 58, 38, 0.12)", 1.2);
    drawWaterEdges(rect, info);
    drawRoadEdges(rect, info);
    if (rect.w >= 58) {
      if (info.isOffice) drawMiniBadge(rect, "Office", "#fff0bf", "#7e5f2f");
      else if (info.isEntrance) drawMiniBadge(rect, "Gate", "#ffe2be", "#8d5227");
      else if (info.hasForestTag) drawCornerBadge(rect, "Forest");
      else if (info.hasWaterEdge) drawCornerBadge(rect, "Lake");
    }
  }

  function drawCampTileVisual(rect, campTile) {
    const def = getCampDef(campTile.typeId);
    const stroke = def.tags.includes("premium") ? "rgba(255, 236, 175, 0.94)" : "rgba(64, 45, 31, 0.16)";
    Core.drawRoundedRect(ctx, rect.x + rect.w * 0.18, rect.y + rect.h * 0.18, rect.w * 0.64, rect.h * 0.64, Math.max(8, rect.w * 0.16), def.color, stroke, 2);
    ctx.fillStyle = "#fffdf8";
    ctx.font = rect.w >= 58 ? "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif" : "700 9px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    Core.drawWrappedText(ctx, def.shortLabel, rect.x + rect.w / 2, rect.y + rect.h * 0.31, rect.w * 0.52, rect.w >= 58 ? 12 : 10, {
      font: ctx.font,
      align: "center",
      color: "#fffdf8",
      maxLines: 2
    });
  }

  function drawBoardCell(board, geometry, row, col) {
    const player = getPlayer();
    const rect = getCellRect(geometry, row, col);
    const cell = getCell(board, row, col);
    const lastAttempt = game.ui.lastAttempt && game.ui.lastAttempt.row === row && game.ui.lastAttempt.col === col;
    const inspected = game.ui.inspectedCell && game.ui.inspectedCell.row === row && game.ui.inspectedCell.col === col;
    const hovered = game.ui.hoveredCell && game.ui.hoveredCell.row === row && game.ui.hoveredCell.col === col;
    const pulse = 0.62 + Math.sin(runtime.now / 180) * 0.15;

    registerTarget(rect, () => {
      game.ui.inspectedCell = { row, col };
      if (game.ui.selection.source === "landscape") {
        attemptLandscapePlacement(row, col);
        return;
      }
      if (game.ui.selection.source === "market") {
        attemptCampPlacement(row, col);
        return;
      }
      const currentCell = getCell(player.board, row, col);
      if (!currentCell.landscapeTile) setMessage(game, "info", "Empty parcel", "No landscape tile has been placed here yet.");
      else if (currentCell.campTile) setMessage(game, "info", "Developed parcel", `${getLandscapeDef(currentCell.landscapeTile.typeId).name} supports ${getCampDef(currentCell.campTile.typeId).name}.`);
      else setMessage(game, "info", "Open parcel", `${getLandscapeDef(currentCell.landscapeTile.typeId).name} is open for camp development.`);
    }, {
      id: `board-${row}-${col}`,
      kind: "board-cell",
      data: { row, col }
    });

    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, Math.max(10, rect.w * 0.16), "rgba(251, 246, 236, 0.92)", "rgba(95, 70, 51, 0.12)", 1.4);
    if (!cell.landscapeTile) {
      ctx.strokeStyle = "rgba(95, 70, 51, 0.2)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 20);
      ctx.setLineDash([]);
    } else {
      drawLandscapeTileVisual(rect, cell.landscapeTile);
      if (cell.campTile) drawCampTileVisual(rect, cell.campTile);
    }
    if (hovered) Core.drawRoundedRect(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, Math.max(8, rect.w * 0.14), null, `rgba(215, 118, 56, ${pulse})`, 2);
    if (inspected) Core.drawRoundedRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, Math.max(8, rect.w * 0.14), null, "rgba(56, 108, 69, 0.58)", 2);
    if (lastAttempt) {
      const invalid = game.ui.lastAttempt.reasons.length > 0;
      const color = invalid ? "rgba(185, 75, 60, 0.72)" : "rgba(56, 120, 77, 0.72)";
      Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, Math.max(8, rect.w * 0.14), invalid ? "rgba(185,75,60,0.14)" : "rgba(56,120,77,0.14)", color, 2);
    }
  }

  function drawPlacementPreview(player, geometry) {
    if (!game.ui.hoveredCell || !game.ui.selection.source) return;
    const rect = getCellRect(geometry, game.ui.hoveredCell.row, game.ui.hoveredCell.col);
    if (game.ui.selection.source === "landscape") {
      const reasons = getLandscapePlacementReasons(game, player, game.ui.hoveredCell.row, game.ui.hoveredCell.col, game.ui.selection.typeId, game.ui.selection.rotation);
      ctx.save();
      ctx.globalAlpha = reasons.length ? 0.5 : 0.8;
      drawLandscapeTileVisual(rect, { typeId: game.ui.selection.typeId, rotation: game.ui.selection.rotation });
      ctx.restore();
      Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, Math.max(8, rect.w * 0.14), null, reasons.length ? "rgba(185,75,60,0.78)" : "rgba(56,120,77,0.78)", 2);
      return;
    }
    const reasons = getCampTilePlacementReasons(game, player, game.ui.hoveredCell.row, game.ui.hoveredCell.col, game.ui.selection.typeId);
    if (getCell(player.board, game.ui.hoveredCell.row, game.ui.hoveredCell.col)?.landscapeTile) {
      ctx.save();
      ctx.globalAlpha = reasons.length ? 0.5 : 0.82;
      drawCampTileVisual(rect, { typeId: game.ui.selection.typeId });
      ctx.restore();
    }
    Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, Math.max(8, rect.w * 0.14), null, reasons.length ? "rgba(185,75,60,0.78)" : "rgba(56,120,77,0.78)", 2);
  }

  function renderLandscapeRackCards(player, content) {
    if (!player.landscapeInventory.length) {
      ctx.fillStyle = "rgba(82, 61, 44, 0.72)";
      ctx.font = "700 13px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Landscape hand complete", content.x + content.w / 2, content.y + content.h / 2);
      return;
    }

    const entries = player.landscapeInventory.slice();
    const columns = runtime.layout.mode === "mobile-portrait" ? 2 : 3;
    const rows = Math.ceil(entries.length / columns);
    const gap = runtime.layout.mode === "mobile-portrait" ? 8 : 10;
    const cardWidth = (content.w - gap * (columns - 1)) / columns;
    const cardHeight = (content.h - gap * (rows - 1)) / rows;

    entries.forEach((entry, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cardRect = { x: content.x + col * (cardWidth + gap), y: content.y + row * (cardHeight + gap), w: cardWidth, h: cardHeight };
      const selected = game.ui.selection.source === "landscape" && game.ui.selection.typeId === entry.typeId;
      registerTarget(cardRect, () => selectLandscapeTile(entry.typeId), { id: `landscape-${entry.typeId}`, kind: "landscape-card" });
      Core.drawRoundedRect(ctx, cardRect.x, cardRect.y, cardRect.w, cardRect.h, 18, selected ? "rgba(255, 229, 197, 0.98)" : "rgba(250, 242, 230, 0.98)", selected ? "#cc7a3f" : "rgba(108,80,54,0.16)", selected ? 2 : 1.2);
      const miniRect = { x: cardRect.x + 10, y: cardRect.y + 10, w: Math.min(runtime.layout.mode === "mobile-portrait" ? 44 : 56, cardRect.h - 20), h: Math.min(runtime.layout.mode === "mobile-portrait" ? 44 : 56, cardRect.h - 20) };
      drawLandscapeTileVisual(miniRect, { typeId: entry.typeId, rotation: selected ? game.ui.selection.rotation : 0 });
      const def = getLandscapeDef(entry.typeId);
      ctx.fillStyle = "#452f1e";
      ctx.font = runtime.layout.mode === "mobile-portrait"
        ? "800 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "700 13px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const textX = miniRect.x + miniRect.w + 10;
      ctx.fillText(fitText(def.name, cardRect.w - (textX - cardRect.x) - 10, ctx.font), textX, cardRect.y + 12);
      ctx.fillStyle = "rgba(82, 61, 44, 0.78)";
      ctx.font = runtime.layout.mode === "mobile-portrait"
        ? "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.fillText(selected ? `x${entry.count} | ${game.ui.selection.rotation * 90} deg` : `x${entry.count}`, textX, cardRect.y + (runtime.layout.mode === "mobile-portrait" ? 28 : 32));
      if (selected) {
        ctx.fillStyle = "#b9642a";
        ctx.fillText("Selected", textX, cardRect.y + (runtime.layout.mode === "mobile-portrait" ? 42 : 50));
      }
    });
  }

  function renderLandscapeRack(player, rect) {
    const content = drawPanel(rect, game.roundIndex === 0 ? "Starting Landscape Tiles" : `${getCurrentRound().name} Expansion Hand`, player.landscapeInventory.length ? "Pick a tile, rotate it in the turn tray, then tap the board." : "All landscape tiles from this phase are already placed.");
    renderLandscapeRackCards(player, content);
  }

  function renderBoardPanel(rect) {
    const player = getPlayer();
    const subtitle = player ? `${player.name}'s 8x5 campground board` : "Player boards appear once the game begins";
    const content = drawPanel(rect, "Campground Board", subtitle);
    if (!player) return;
    if (runtime.layout.mode === "mobile-portrait" && game.phase === "setupLandscape") {
      renderSegmentTabs({ x: content.x, y: content.y, w: content.w, h: 34 }, [
        { id: "board", label: "Board" },
        { id: "hand", label: `Tiles (${countRemainingLandscapeTiles(player.landscapeInventory)})` }
      ], game.ui.boardView, (value) => {
        game.ui.boardView = value;
      }, "board-view");
      const bodyRect = { x: content.x, y: content.y + 42, w: content.w, h: content.h - 42 };
      if (game.ui.boardView === "hand") {
        renderLandscapeRackCards(player, bodyRect);
        return;
      }
      const geometry = getBoardGeometryForArea(bodyRect);
      drawBoardLabels(geometry);
      for (let row = 0; row < BOARD_ROWS; row += 1) {
        for (let col = 0; col < BOARD_COLS; col += 1) drawBoardCell(player.board, geometry, row, col);
      }
      drawPlacementPreview(player, geometry);
      return;
    }
    const geometry = getBoardGeometry(rect);
    drawBoardLabels(geometry);
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) drawBoardCell(player.board, geometry, row, col);
    }
    drawPlacementPreview(player, geometry);
    if (geometry.rackRect) renderLandscapeRack(player, geometry.rackRect);
  }

  function renderMarketPanel(rect) {
    const player = getPlayer();
    const isPortrait = runtime.layout.mode === "mobile-portrait";
    const buildOpen = game.phase === "build" && !game.turn.actionTaken;
    const subtitle = buildOpen ? "Two amenity columns plus four campsite columns stay face-up. Each contractor costs $10,000." : "Contractors stay visible between turns, but hiring only works during the build phase.";
    const content = drawPanel(rect, "Contractor Market", subtitle);
    if (!player) return;

    const columnsPerPage = getVisibleMarketPageSize();
    const totalPages = Math.ceil(game.market.columns.length / columnsPerPage);
    game.ui.marketPage = Core.clamp(game.ui.marketPage, 0, totalPages - 1);
    const startIndex = game.ui.marketPage * columnsPerPage;
    const visibleColumns = game.market.columns.slice(startIndex, startIndex + columnsPerPage);
    const slotsPerPage = isPortrait ? 4 : 8;
    const totalSlotPages = Math.max(1, Math.ceil(8 / slotsPerPage));
    game.ui.marketSlotPage = Core.clamp(game.ui.marketSlotPage || 0, 0, totalSlotPages - 1);
    const slotStartIndex = game.ui.marketSlotPage * slotsPerPage;

    const headerHeight = isPortrait ? 68 : 34;
    ctx.fillStyle = "rgba(82, 61, 44, 0.76)";
    ctx.font = isPortrait
      ? "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = isPortrait ? "center" : "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Showing columns ${startIndex + 1}-${startIndex + visibleColumns.length} of ${game.market.columns.length}`, isPortrait ? content.x + content.w / 2 : content.x, content.y + (isPortrait ? 16 : headerHeight / 2));
    if (totalPages > 1) {
      drawButton({ x: content.x, y: content.y + 4, w: isPortrait ? 42 : 46, h: 30 }, "<", () => {
        game.ui.marketPage = Math.max(0, game.ui.marketPage - 1);
        game.ui.marketSlotPage = 0;
      }, { id: "market-prev", enabled: game.ui.marketPage > 0 });
      drawButton({ x: content.x + content.w - (isPortrait ? 42 : 46), y: content.y + 4, w: isPortrait ? 42 : 46, h: 30 }, ">", () => {
        game.ui.marketPage = Math.min(totalPages - 1, game.ui.marketPage + 1);
        game.ui.marketSlotPage = 0;
      }, { id: "market-next", enabled: game.ui.marketPage < totalPages - 1 });
    }
    if (isPortrait && totalSlotPages > 1) {
      ctx.fillText(`Contractors ${slotStartIndex + 1}-${Math.min(8, slotStartIndex + slotsPerPage)} of 8`, content.x + content.w / 2, content.y + 46);
      drawButton({ x: content.x, y: content.y + 32, w: 42, h: 30 }, "<", () => {
        game.ui.marketSlotPage = Math.max(0, game.ui.marketSlotPage - 1);
      }, { id: "market-slot-prev", enabled: game.ui.marketSlotPage > 0 });
      drawButton({ x: content.x + content.w - 42, y: content.y + 32, w: 42, h: 30 }, ">", () => {
        game.ui.marketSlotPage = Math.min(totalSlotPages - 1, game.ui.marketSlotPage + 1);
      }, { id: "market-slot-next", enabled: game.ui.marketSlotPage < totalSlotPages - 1 });
    }

    const bodyRect = { x: content.x, y: content.y + headerHeight + 8, w: content.w, h: content.h - headerHeight - 8 };
    const colGap = 8;
    const rowGap = 6;
    const colWidth = (bodyRect.w - colGap * (visibleColumns.length - 1)) / visibleColumns.length;
    const visibleRowCount = 1 + slotsPerPage;
    const rowHeight = (bodyRect.h - rowGap * (visibleRowCount - 1)) / visibleRowCount;

    visibleColumns.forEach((column, visibleIndex) => {
      const colRect = { x: bodyRect.x + visibleIndex * (colWidth + colGap), y: bodyRect.y, w: colWidth, h: bodyRect.h };
      Core.drawRoundedRect(ctx, colRect.x, colRect.y, colRect.w, rowHeight, 16, column.category === "amenity" ? "rgba(198, 224, 226, 0.96)" : "rgba(235, 224, 202, 0.96)", "rgba(108,80,54,0.16)", 1);
      ctx.fillStyle = "#4b3726";
      ctx.font = isPortrait
        ? "800 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fitText(column.label, colRect.w - 16, ctx.font), colRect.x + colRect.w / 2, colRect.y + rowHeight / 2);

      column.slots.slice(slotStartIndex, slotStartIndex + slotsPerPage).forEach((slot, visibleSlotIndex) => {
        const def = getCampDef(slot.typeId);
        const slotIndex = slotStartIndex + visibleSlotIndex;
        const slotRect = { x: colRect.x, y: colRect.y + rowHeight + rowGap + visibleSlotIndex * (rowHeight + rowGap), w: colRect.w, h: rowHeight };
        const globalColumnIndex = startIndex + visibleIndex;
        const selected = game.ui.selection.source === "market" && game.ui.selection.columnIndex === globalColumnIndex && game.ui.selection.slotIndex === slotIndex;
        registerTarget(slotRect, buildOpen ? () => selectMarketTile(globalColumnIndex, slotIndex) : null, {
          id: `market-${globalColumnIndex}-${slotIndex}`,
          enabled: buildOpen,
          kind: "market-slot"
        });
        Core.drawRoundedRect(ctx, slotRect.x, slotRect.y, slotRect.w, slotRect.h, 16, selected ? "rgba(255, 232, 204, 0.98)" : "rgba(250, 243, 233, 0.98)", selected ? "#cc7a3f" : "rgba(108,80,54,0.16)", selected ? 2 : 1.1);
        const iconSize = Math.max(16, slotRect.h - 10);
        const miniRect = { x: slotRect.x + 6, y: slotRect.y + (slotRect.h - iconSize) / 2, w: iconSize, h: iconSize };
        drawCampTileVisual(miniRect, { typeId: def.id });
        const compact = slotRect.h < 54 || slotRect.w < 150;
        ctx.fillStyle = buildOpen ? "#442f20" : "rgba(68,47,32,0.52)";
        const textX = miniRect.x + miniRect.w + 8;
        const priceX = slotRect.x + slotRect.w - 10;
        if (compact) {
          ctx.font = isPortrait
            ? "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif"
            : "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(fitText(def.shortLabel, priceX - textX - 30, ctx.font), textX, slotRect.y + slotRect.h / 2 + 0.5);
          ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
          ctx.textAlign = "right";
          ctx.fillText("$10k", priceX, slotRect.y + slotRect.h / 2 + 0.5);
        } else {
          ctx.font = "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(fitText(def.name, slotRect.w - miniRect.w - 28, ctx.font), textX, slotRect.y + 7);
          ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
          ctx.fillStyle = column.category === "amenity" ? "#3f6870" : "#7d5a37";
          ctx.fillText(column.category === "amenity" ? "Amenity" : "Camp", textX, slotRect.y + slotRect.h - 16);
          ctx.fillStyle = buildOpen ? "#442f20" : "rgba(68,47,32,0.52)";
          ctx.textAlign = "right";
          ctx.fillText("$10k", priceX, slotRect.y + 7);
        }
      });
    });
  }

  function renderObjectiveCards(player, objectives, rect, variant, page, cardsPerPage) {
    if (!objectives.length) {
      ctx.fillStyle = "rgba(82, 61, 44, 0.72)";
      ctx.font = "700 13px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(variant === "director" ? "Director goals reveal after the first round." : "No objectives available.", rect.x + rect.w / 2, rect.y + rect.h / 2);
      return;
    }
    const results = buildObjectiveResultsForPlayer(player, objectives);
    const start = page * cardsPerPage;
    const visibleResults = results.slice(start, start + cardsPerPage);
    const gap = runtime.layout.mode === "mobile-portrait" ? 8 : 12;
    const cardHeight = (rect.h - gap * Math.max(0, visibleResults.length - 1)) / Math.max(1, visibleResults.length);

    visibleResults.forEach((entry, index) => {
      const cardRect = { x: rect.x, y: rect.y + index * (cardHeight + gap), w: rect.w, h: cardHeight };
      const complete = entry.result.points >= entry.objective.points;
      const fill = complete ? "rgba(232, 246, 228, 0.98)" : "rgba(250, 242, 232, 0.98)";
      const stroke = complete ? "rgba(86, 132, 93, 0.48)" : "rgba(108,80,54,0.16)";
      const inset = runtime.layout.mode === "mobile-portrait" ? 10 : 14;
      const titleFont = runtime.layout.mode === "mobile-portrait"
        ? "800 13px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
      const bodyFont = runtime.layout.mode === "mobile-portrait"
        ? "600 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "600 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
      const detailFont = runtime.layout.mode === "mobile-portrait"
        ? "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
        : "700 12px 'Avenir Next', 'Trebuchet MS', sans-serif";
      const titleLineHeight = runtime.layout.mode === "mobile-portrait" ? 16 : 18;
      const bodyLineHeight = runtime.layout.mode === "mobile-portrait" ? 14 : 16;
      const detailLineHeight = runtime.layout.mode === "mobile-portrait" ? 13 : 15;
      const footerHeight = runtime.layout.mode === "desktop" ? 42 : 48;
      Core.drawRoundedRect(ctx, cardRect.x, cardRect.y, cardRect.w, cardRect.h, 16, fill, stroke, 1.1);
      const pillText = `${entry.result.points}/${entry.objective.points}`;
      const pillWidth = (() => {
        ctx.save();
        ctx.font = "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
        const width = ctx.measureText(pillText).width + 24;
        ctx.restore();
        return width;
      })();
      const titleWidth = Math.max(116, cardRect.w - pillWidth - inset * 2 - 10);
      Core.drawWrappedText(ctx, entry.objective.name, cardRect.x + inset, cardRect.y + inset, titleWidth, titleLineHeight, {
        font: titleFont,
        color: "#452f1e",
        maxLines: 2
      });
      drawPill(cardRect.x + cardRect.w - pillWidth - inset, cardRect.y + inset, pillText, complete ? "#5f8d65" : variant === "director" ? "#8e6a9f" : "#c6783c", "#fff9f3", {
        paddingX: 12,
        height: runtime.layout.mode === "mobile-portrait" ? 26 : 30,
        font: "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif"
      });

      const descriptionY = cardRect.y + inset + 34;
      const footerY = cardRect.y + cardRect.h - footerHeight;
      Core.drawWrappedText(ctx, entry.objective.description, cardRect.x + inset, descriptionY, cardRect.w - inset * 2, bodyLineHeight, {
        font: bodyFont,
        color: "rgba(82, 61, 44, 0.86)",
        maxLines: runtime.layout.mode === "desktop" ? 3 : 5
      });

      ctx.strokeStyle = "rgba(108,80,54,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardRect.x + inset, footerY - 8);
      ctx.lineTo(cardRect.x + cardRect.w - inset, footerY - 8);
      ctx.stroke();

      Core.drawWrappedText(ctx, entry.result.detail, cardRect.x + inset, footerY, cardRect.w - inset * 2, detailLineHeight, {
        font: detailFont,
        color: complete ? "#3f6b47" : "#7d5a37",
        maxLines: runtime.layout.mode === "mobile-portrait" ? 2 : 2
      });
    });
  }

  function renderObjectivesPanel(rect) {
    const player = getPlayer();
    const content = drawPanel(rect, "Objectives", "Shared seasonal goals and Camp Director goals score against the current player's board.");
    if (!player) return;
    const objectiveTab = game.ui.objectiveTab;
    renderSegmentTabs({ x: content.x, y: content.y, w: content.w, h: 34 }, [
      { id: "shared", label: "Shared" },
      { id: "director", label: "Director", enabled: game.directorRevealed }
    ], objectiveTab, (value) => {
      game.ui.objectiveTab = value;
      game.ui.objectivePages[value] = 0;
    }, "objective-tab");
    const tabKey = game.ui.objectiveTab === "director" ? "director" : "shared";
    const objectives = tabKey === "director" ? game.activeDirectorObjectives : game.activeRoundObjectives;
    const cardsPerPage = getObjectiveCardsPerPage();
    const totalPages = Math.max(1, Math.ceil(objectives.length / cardsPerPage));
    game.ui.objectivePages[tabKey] = Core.clamp(game.ui.objectivePages[tabKey] || 0, 0, totalPages - 1);

    const pagerY = content.y + 40;
    if (totalPages > 1) {
      const indicatorText = `Showing ${game.ui.objectivePages[tabKey] * cardsPerPage + 1}-${Math.min(objectives.length, (game.ui.objectivePages[tabKey] + 1) * cardsPerPage)} of ${objectives.length}`;
      ctx.fillStyle = "rgba(82, 61, 44, 0.72)";
      ctx.font = "700 10px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(indicatorText, content.x + content.w / 2, pagerY + 13);
      drawButton({ x: content.x, y: pagerY, w: 38, h: 26 }, "<", () => {
        game.ui.objectivePages[tabKey] = Math.max(0, game.ui.objectivePages[tabKey] - 1);
      }, {
        id: `objective-prev-${tabKey}`,
        enabled: game.ui.objectivePages[tabKey] > 0,
        font: "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif"
      });
      drawButton({ x: content.x + content.w - 38, y: pagerY, w: 38, h: 26 }, ">", () => {
        game.ui.objectivePages[tabKey] = Math.min(totalPages - 1, game.ui.objectivePages[tabKey] + 1);
      }, {
        id: `objective-next-${tabKey}`,
        enabled: game.ui.objectivePages[tabKey] < totalPages - 1,
        font: "800 12px 'Avenir Next', 'Trebuchet MS', sans-serif"
      });
    }

    renderObjectiveCards(
      player,
      objectives,
      { x: content.x, y: content.y + 72, w: content.w, h: content.h - 72 },
      tabKey === "director" ? "director" : "shared",
      game.ui.objectivePages[tabKey],
      cardsPerPage
    );
  }

  function renderScorePanel(rect) {
    const player = getPlayer();
    const content = drawPanel(rect, "Camp Scores", "Only the current player's board is shown, but the scoreboard tracks everyone.");
    if (!player) return;
    const standings = game.players.slice().sort((a, b) => b.score - a.score);
    const rowHeight = 52;
    standings.forEach((entry, index) => {
      const rowRect = { x: content.x, y: content.y + index * (rowHeight + 8), w: content.w, h: rowHeight };
      Core.drawRoundedRect(ctx, rowRect.x, rowRect.y, rowRect.w, rowRect.h, 16, "rgba(249, 241, 229, 0.98)", "rgba(108,80,54,0.14)", 1);
      Core.drawRoundedRect(ctx, rowRect.x + 8, rowRect.y + 8, 36, rowRect.h - 16, 12, entry.color.fill);
      ctx.fillStyle = entry.color.text;
      ctx.font = "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), rowRect.x + 26, rowRect.y + rowRect.h / 2);
      ctx.fillStyle = "#432e1e";
      ctx.font = "700 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(fitText(entry.name, rowRect.w - 150, ctx.font), rowRect.x + 56, rowRect.y + 10);
      ctx.font = "700 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "rgba(82, 61, 44, 0.76)";
      const status = game.phase === "build" && entry.passedThisRound ? " | passed this round" : "";
      ctx.fillText(`${Core.formatMoney(entry.money)} | ${entry.roundCampPlacements[game.roundIndex]} placed this round${status}`, rowRect.x + 56, rowRect.y + 29);
      ctx.fillStyle = "#432e1e";
      ctx.font = "800 16px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${entry.score} pts`, rowRect.x + rowRect.w - 14, rowRect.y + 16);
    });
  }

  function renderInfoPanel(rect) {
    const player = getPlayer();
    const content = drawPanel(rect, "Current Focus", player ? `${player.name} | ${getPhaseLabel()}` : "Setup");
    const summary = getBottomSummary();
    Core.drawRoundedRect(ctx, content.x, content.y, content.w, content.h, 18, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1);
    ctx.fillStyle = summary.tone === "error" ? "#8f4338" : summary.tone === "success" ? "#3d6a46" : summary.tone === "warning" ? "#88622d" : "#4a3524";
    ctx.font = "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(summary.title, content.x + 12, content.y + 10);
    Core.drawWrappedText(ctx, summary.body, content.x + 12, content.y + 30, content.w - 24, 15, {
      font: "600 12px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      maxLines: 4
    });
  }

  function renderDesktopOrLandscapeSide() {
    renderInfoPanel(runtime.layout.infoPanel);
    renderSegmentTabs(runtime.layout.sideTabs, [
      { id: "objectives", label: "Goals" },
      { id: "score", label: "Score" }
    ], game.ui.sideTab, (value) => {
      game.ui.sideTab = value;
    }, "side-tab");
    if (game.ui.sideTab === "score") renderScorePanel(runtime.layout.sideBody);
    else renderObjectivesPanel(runtime.layout.sideBody);
  }

  function renderOverlay() {
    if (!game.overlay) return;
    ctx.fillStyle = "rgba(47, 34, 23, 0.58)";
    ctx.fillRect(0, 0, runtime.layout.width, runtime.layout.height);

    if (game.overlay.kind === "rename-players") return;

    const isPortrait = runtime.layout.mode === "mobile-portrait";
    const maxHeight = runtime.layout.height - runtime.layout.pad * 2;
    const panelWidth = Math.min(runtime.layout.width - runtime.layout.pad * 2, isPortrait ? runtime.layout.width - runtime.layout.pad * 2 : 760);
    let panelHeight = game.overlay.kind === "start"
      ? (isPortrait ? 336 : 312)
      : game.overlay.kind === "handoff"
        ? (isPortrait ? 322 : 290)
        : game.overlay.kind === "pause-menu"
          ? (isPortrait ? 360 : 334)
          : game.overlay.kind === "restart-confirm"
            ? (isPortrait ? 270 : 246)
            : game.overlay.kind === "about"
              ? (isPortrait ? 346 : 332)
              : game.overlay.kind === "round-summary"
                ? 176 + ((game.overlay.rows?.length || 0) * (isPortrait ? 56 : 62)) + 74
                : game.overlay.kind === "final"
                  ? 164 + ((game.overlay.rows?.length || 0) * (isPortrait ? 54 : 60)) + 78
                  : (isPortrait ? 430 : 460);
    panelHeight = Math.min(maxHeight, panelHeight);
    const rect = isPortrait
      ? {
          x: runtime.layout.pad,
          y: runtime.layout.height - runtime.layout.pad - panelHeight,
          w: panelWidth,
          h: panelHeight
        }
      : {
          x: (runtime.layout.width - panelWidth) / 2,
          y: (runtime.layout.height - panelHeight) / 2,
          w: panelWidth,
          h: panelHeight
        };

    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 28, "rgba(255, 248, 239, 0.98)", "rgba(108,80,54,0.18)", 1.6);
    ctx.fillStyle = "#3d2d20";
    ctx.font = "800 26px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    if (game.overlay.kind === "start") {
      renderStartOverlay(rect);
      return;
    }
    if (game.overlay.kind === "handoff") {
      renderHandoffOverlay(rect);
      return;
    }
    if (game.overlay.kind === "pause-menu") {
      renderPauseMenuOverlay(rect);
      return;
    }
    if (game.overlay.kind === "restart-confirm") {
      renderRestartConfirmOverlay(rect);
      return;
    }
    if (game.overlay.kind === "about") {
      renderAboutOverlay(rect);
      return;
    }
    if (game.overlay.kind === "round-summary") {
      renderRoundSummaryOverlay(rect);
      return;
    }
    if (game.overlay.kind === "final") renderFinalOverlay(rect);
  }

  function renderStartOverlay(rect) {
    const isPortrait = runtime.layout.mode === "mobile-portrait";
    const titleY = rect.y + (isPortrait ? 20 : 18);
    const introY = titleY + 48;
    const horizontalInset = isPortrait ? 26 : 40;
    ctx.fillText("Smore to Explore", rect.x + rect.w / 2, titleY);
    const introMetrics = Core.drawWrappedText(ctx, "Build the best campground over three summer rounds as each player shapes a separate board on the same device. Draft from the shared contractor market, chase seasonal goals, and pass the game to the next player after each turn.", rect.x + rect.w / 2, introY, rect.w - horizontalInset * 2, isPortrait ? 17 : 18, {
      font: "600 14px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.86)",
      align: "center",
      maxLines: isPortrait ? 4 : 3
    });
    const chooserTop = introY + introMetrics.height + (isPortrait ? 14 : 12);
    const chooserRect = {
      x: rect.x + (isPortrait ? 26 : 44),
      y: chooserTop,
      w: rect.w - (isPortrait ? 52 : 88),
      h: isPortrait ? 82 : 74
    };
    Core.drawRoundedRect(ctx, chooserRect.x, chooserRect.y, chooserRect.w, chooserRect.h, 20, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1.2);
    ctx.fillStyle = "#4a3524";
    ctx.font = "700 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Player Count", chooserRect.x + chooserRect.w / 2, chooserRect.y + 10);
    drawButton({ x: chooserRect.x + 18, y: chooserRect.y + 34, w: isPortrait ? 60 : 54, h: isPortrait ? 36 : 28 }, "-", () => {
      game.ui.configuredPlayerCount = Math.max(2, game.ui.configuredPlayerCount - 1);
    }, {
      id: "overlay-player-minus",
      scope: "overlay",
      enabled: game.ui.configuredPlayerCount > 2
    });
    drawButton({ x: chooserRect.x + chooserRect.w - (isPortrait ? 78 : 72), y: chooserRect.y + 34, w: isPortrait ? 60 : 54, h: isPortrait ? 36 : 28 }, "+", () => {
      game.ui.configuredPlayerCount = Math.min(5, game.ui.configuredPlayerCount + 1);
    }, {
      id: "overlay-player-plus",
      scope: "overlay",
      enabled: game.ui.configuredPlayerCount < 5
    });
    ctx.fillStyle = "#4a3524";
    ctx.font = "800 28px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(game.ui.configuredPlayerCount), chooserRect.x + chooserRect.w / 2, chooserRect.y + (isPortrait ? 52 : 46));

    const buttonY = Math.min(rect.y + rect.h - 66, chooserRect.y + chooserRect.h + 16);
    drawButton({ x: rect.x + (isPortrait ? 26 : 80), y: buttonY, w: rect.w - (isPortrait ? 52 : 160), h: 46 }, "Start Campground", () => {
      beginPlaySession(game.ui.configuredPlayerCount);
    }, {
      id: "overlay-start-game",
      scope: "overlay",
      variant: "primary"
    });
  }

  function renderHandoffOverlay(rect) {
    const player = getPlayer();
    ctx.fillText(game.overlay.title, rect.x + rect.w / 2, rect.y + 24);
    const badgeText = `${getCurrentRound().name} | ${getPhaseLabel()}`;
    ctx.save();
    ctx.font = runtime.layout.mode === "mobile-portrait"
      ? "800 13px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
    const badgeWidth = Math.min(rect.w - 120, Math.max(250, ctx.measureText(badgeText).width + 48));
    ctx.restore();
    const badgeRect = { x: rect.x + (rect.w - badgeWidth) / 2, y: rect.y + 68, w: badgeWidth, h: 44 };
    Core.drawRoundedRect(ctx, badgeRect.x, badgeRect.y, badgeRect.w, badgeRect.h, 22, "rgba(222, 162, 102, 0.20)", "rgba(177, 111, 54, 0.34)", 1.4);
    ctx.fillStyle = "#6c4325";
    ctx.font = runtime.layout.mode === "mobile-portrait"
      ? "800 13px 'Avenir Next', 'Trebuchet MS', sans-serif"
      : "800 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badgeText, badgeRect.x + badgeRect.w / 2, badgeRect.y + badgeRect.h / 2 + 1);

    Core.drawWrappedText(ctx, game.overlay.lines.join("\n\n"), rect.x + rect.w / 2, rect.y + 132, rect.w - 72, 18, {
      font: "600 14px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      align: "center",
      maxLines: 6
    });

    const buttonWidth = Math.min(rect.w - 172, runtime.layout.mode === "mobile-portrait" ? 220 : 280);
    drawButton({ x: rect.x + (rect.w - buttonWidth) / 2, y: rect.y + rect.h - 74, w: buttonWidth, h: 42 }, "Ready", closeOverlay, {
      id: "overlay-ready",
      scope: "overlay",
      variant: "primary"
    });
  }

  function renderPauseMenuOverlay(rect) {
    ctx.fillText("Pause Menu", rect.x + rect.w / 2, rect.y + 20);
    Core.drawWrappedText(ctx, "Open roster tools, read about the prototype, or restart the current session.", rect.x + rect.w / 2, rect.y + 62, rect.w - 72, 18, {
      font: "600 14px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      align: "center",
      maxLines: 3
    });

    const buttonWidth = Math.min(rect.w - 112, 280);
    const startY = rect.y + 118;
    const gap = 12;
    [
      { label: "Resume", onClick: closeOverlay, variant: "primary", id: "overlay-resume" },
      { label: "Rename Players", onClick: openRenamePlayersOverlay, id: "overlay-rename" },
      { label: "About", onClick: openAboutOverlay, id: "overlay-about" },
      { label: "Restart", onClick: openRestartConfirmOverlay, variant: "danger", id: "overlay-restart-confirm" }
    ].forEach((button, index) => {
      drawButton({
        x: rect.x + (rect.w - buttonWidth) / 2,
        y: startY + index * (42 + gap),
        w: buttonWidth,
        h: 42
      }, button.label, button.onClick, {
        id: button.id,
        scope: "overlay",
        variant: button.variant
      });
    });
  }

  function renderRestartConfirmOverlay(rect) {
    const isPortrait = runtime.layout.mode === "mobile-portrait";
    ctx.fillText("Restart game?", rect.x + rect.w / 2, rect.y + 24);
    Core.drawWrappedText(ctx, "Are you sure? This will clear the current campground boards and return to the start screen.", rect.x + rect.w / 2, rect.y + 78, rect.w - 72, 20, {
      font: "600 15px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      align: "center",
      maxLines: 4
    });
    if (isPortrait) {
      drawButton({ x: rect.x + 24, y: rect.y + rect.h - 118, w: rect.w - 48, h: 42 }, "Cancel", openPauseMenu, {
        id: "overlay-restart-cancel",
        scope: "overlay"
      });
      drawButton({ x: rect.x + 24, y: rect.y + rect.h - 66, w: rect.w - 48, h: 42 }, "Restart", restartToStartScreen, {
        id: "overlay-restart-accept",
        scope: "overlay",
        variant: "danger"
      });
      return;
    }
    const buttonWidth = Math.min(170, (rect.w - 92) / 2);
    const y = rect.y + rect.h - 74;
    drawButton({ x: rect.x + 32, y, w: buttonWidth, h: 42 }, "Cancel", openPauseMenu, {
      id: "overlay-restart-cancel",
      scope: "overlay"
    });
    drawButton({ x: rect.x + rect.w - buttonWidth - 32, y, w: buttonWidth, h: 42 }, "Restart", restartToStartScreen, {
      id: "overlay-restart-accept",
      scope: "overlay",
      variant: "danger"
    });
  }

  function renderAboutOverlay(rect) {
    ctx.fillText("About", rect.x + rect.w / 2, rect.y + 22);
    Core.drawWrappedText(ctx, "This game was made by EOP and his wife with the help of Codex to test out a board game idea in the browser. Hope you enjoy testing it with them ;)", rect.x + rect.w / 2, rect.y + 78, rect.w - 72, 22, {
      font: "600 15px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      align: "center",
      maxLines: 7
    });
    drawButton({ x: rect.x + (runtime.layout.mode === "mobile-portrait" ? 24 : rect.w / 2 - 110), y: rect.y + rect.h - 70, w: runtime.layout.mode === "mobile-portrait" ? rect.w - 48 : 220, h: 42 }, "Back", openPauseMenu, {
      id: "overlay-about-back",
      scope: "overlay",
      variant: "primary"
    });
  }

  function renderRoundSummaryOverlay(rect) {
    ctx.fillText(game.overlay.title, rect.x + rect.w / 2, rect.y + 20);
    Core.drawWrappedText(ctx, game.overlay.lines.join("\n"), rect.x + rect.w / 2, rect.y + 60, rect.w - 64, 18, {
      font: "600 14px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      align: "center",
      maxLines: 3
    });

    const rowsY = rect.y + 122;
    const rowHeight = 54;
    game.overlay.rows.forEach((row, index) => {
      const rowRect = { x: rect.x + 26, y: rowsY + index * (rowHeight + 8), w: rect.w - 52, h: rowHeight };
      Core.drawRoundedRect(ctx, rowRect.x, rowRect.y, rowRect.w, rowRect.h, 16, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1);
      Core.drawRoundedRect(ctx, rowRect.x + 8, rowRect.y + 8, 36, rowRect.h - 16, 12, row.player.color.fill);
      ctx.fillStyle = row.player.color.text;
      ctx.font = "800 13px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), rowRect.x + 26, rowRect.y + rowRect.h / 2);
      ctx.fillStyle = "#432e1e";
      ctx.font = "700 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(fitText(row.left, rowRect.w - 150, ctx.font), rowRect.x + 56, rowRect.y + 10);
      ctx.font = "600 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "rgba(82, 61, 44, 0.78)";
      ctx.fillText(row.detail, rowRect.x + 56, rowRect.y + 30);
      ctx.fillStyle = "#432e1e";
      ctx.font = "800 15px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(row.right, rowRect.x + rowRect.w - 14, rowRect.y + 17);
    });

    drawButton({ x: rect.x + (runtime.layout.mode === "mobile-portrait" ? 24 : 90), y: rect.y + rect.h - 68, w: runtime.layout.mode === "mobile-portrait" ? rect.w - 48 : rect.w - 180, h: 42 }, `Start ${ROUND_DEFS[game.roundIndex + 1].name}`, startNextRound, {
      id: "overlay-next-round",
      scope: "overlay",
      variant: "primary"
    });
  }

  function renderFinalOverlay(rect) {
    ctx.fillText(game.overlay.title, rect.x + rect.w / 2, rect.y + 18);
    Core.drawWrappedText(ctx, game.overlay.lines.join("\n"), rect.x + rect.w / 2, rect.y + 56, rect.w - 60, 18, {
      font: "600 14px 'Avenir Next', 'Trebuchet MS', sans-serif",
      color: "rgba(82, 61, 44, 0.84)",
      align: "center",
      maxLines: 3
    });

    const rowsY = rect.y + 116;
    const rowHeight = 52;
    game.overlay.rows.forEach((row, index) => {
      const rowRect = { x: rect.x + 26, y: rowsY + index * (rowHeight + 8), w: rect.w - 52, h: rowHeight };
      Core.drawRoundedRect(ctx, rowRect.x, rowRect.y, rowRect.w, rowRect.h, 16, "rgba(247, 239, 227, 0.98)", "rgba(108,80,54,0.14)", 1);
      Core.drawRoundedRect(ctx, rowRect.x + 8, rowRect.y + 8, 36, rowRect.h - 16, 12, row.player.color.fill);
      ctx.fillStyle = row.player.color.text;
      ctx.font = "800 13px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(index + 1), rowRect.x + 26, rowRect.y + rowRect.h / 2);
      ctx.fillStyle = "#432e1e";
      ctx.font = "700 14px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(fitText(row.left, rowRect.w - 150, ctx.font), rowRect.x + 56, rowRect.y + 10);
      ctx.font = "600 11px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.fillStyle = "rgba(82, 61, 44, 0.78)";
      ctx.fillText(row.detail, rowRect.x + 56, rowRect.y + 29);
      ctx.fillStyle = "#432e1e";
      ctx.font = "800 15px 'Avenir Next', 'Trebuchet MS', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(row.right, rowRect.x + rowRect.w - 14, rowRect.y + 16);
    });

    drawButton({ x: rect.x + (runtime.layout.mode === "mobile-portrait" ? 24 : 90), y: rect.y + rect.h - 66, w: runtime.layout.mode === "mobile-portrait" ? rect.w - 48 : rect.w - 180, h: 42 }, "Back to Start", restartToStartScreen, {
      id: "overlay-restart",
      scope: "overlay",
      variant: "primary"
    });
  }

  function renderFrame(now) {
    runtime.now = now;
    runtime.layout = computeLayout(controller.state.width, controller.state.height);
    runtime.targets = [];
    cleanupTransientState();
    if (!game.directorRevealed && game.ui.objectiveTab === "director") game.ui.objectiveTab = "shared";

    renderBackground();
    renderTopBar(runtime.layout.topBar);

    if (runtime.layout.mode === "desktop") {
      renderBoardPanel(runtime.layout.boardPanel);
      renderDesktopOrLandscapeSide();
      renderMarketPanel(runtime.layout.marketPanel);
      renderBottomBar(runtime.layout.bottomBar);
    } else if (runtime.layout.mode === "mobile-landscape") {
      renderBoardPanel(runtime.layout.boardPanel);
      renderInfoPanel(runtime.layout.infoPanel);
      renderSegmentTabs(runtime.layout.sideTabs, [
        { id: "objectives", label: "Goals" },
        { id: "score", label: "Score" },
        { id: "market", label: "Market" }
      ], game.ui.sideTab, (value) => {
        game.ui.sideTab = value;
      }, "landscape-side-tab");
      if (game.ui.sideTab === "market") renderMarketPanel(runtime.layout.sideBody);
      else if (game.ui.sideTab === "score") renderScorePanel(runtime.layout.sideBody);
      else renderObjectivesPanel(runtime.layout.sideBody);
      renderBottomBar(runtime.layout.bottomBar);
    } else {
      renderPortraitTabBar(runtime.layout.tabBar);
      if (game.ui.mobileTab === "board") renderBoardPanel(runtime.layout.mainPanel);
      else if (game.ui.mobileTab === "market") renderMarketPanel(runtime.layout.mainPanel);
      else if (game.ui.mobileTab === "score") renderScorePanel(runtime.layout.mainPanel);
      else renderObjectivesPanel(runtime.layout.mainPanel);
      renderBottomBar(runtime.layout.bottomBar);
    }

    renderOverlay();
    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);
})();
