(() => {
  "use strict";

  const Core = window.SmoreCore;
  const ObjectiveFactory = window.SmoreObjectiveFactory;

  if (!Core || !ObjectiveFactory) {
    throw new Error("Smore to Explore needs smore-core.js and smore-objectives.js.");
  }

  // =========================
  // CONSTANTS + DOM
  // =========================

  const BOARD_COLS = 8;
  const BOARD_ROWS = 5;
  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 620;
  const CELL_SIZE = 96;
  const CELL_GAP = 8;
  const BOARD_WIDTH = BOARD_COLS * CELL_SIZE + (BOARD_COLS - 1) * CELL_GAP;
  const BOARD_HEIGHT = BOARD_ROWS * CELL_SIZE + (BOARD_ROWS - 1) * CELL_GAP;
  const BOARD_ORIGIN_X = Math.floor((CANVAS_WIDTH - BOARD_WIDTH) / 2);
  const BOARD_ORIGIN_Y = 78;

  const STARTING_BUDGET = 100000;
  const SEASON_BUDGET_GRANT = 50000;
  const CAMP_TILE_COST = 10000;
  const ACTIVE_SHARED_OBJECTIVE_COUNT = 4;
  const ACTIVE_DIRECTOR_OBJECTIVE_COUNT = 3;

  const SIDES = ["north", "east", "south", "west"];
  const OPPOSITE = {
    north: "south",
    east: "west",
    south: "north",
    west: "east"
  };

  const ROUND_DEFS = [
    { id: "early", name: "Early Summer", description: "Opening groups, scout trips, and the first campground push." },
    { id: "mid", name: "Mid Summer", description: "Busy family season with more amenities and activity demand." },
    { id: "late", name: "Late Summer", description: "Premium guests, polished layouts, and final scoring." }
  ];

  const MARKET_COLUMNS = [
    { id: "amenity-1", label: "Amenity Crew", category: "amenity" },
    { id: "amenity-2", label: "Activity Crew", category: "amenity" },
    { id: "camp-1", label: "Camping Sites", category: "camp" },
    { id: "camp-2", label: "Comfort Sites", category: "camp" },
    { id: "camp-3", label: "Premium Sites", category: "camp" },
    { id: "camp-4", label: "Specialty Sites", category: "camp" }
  ];

  const elements = {
    appShell: document.getElementById("appShell"),
    roundStat: document.getElementById("roundStat"),
    phaseStat: document.getElementById("phaseStat"),
    moneyStat: document.getElementById("moneyStat"),
    scoreStat: document.getElementById("scoreStat"),
    roundBuildStat: document.getElementById("roundBuildStat"),
    selectionIntro: document.getElementById("selectionIntro"),
    selectionPanel: document.getElementById("selectionPanel"),
    messagePanel: document.getElementById("messagePanel"),
    objectivesSubtitle: document.getElementById("objectivesSubtitle"),
    sharedObjectives: document.getElementById("sharedObjectives"),
    directorObjectives: document.getElementById("directorObjectives"),
    historyPanel: document.getElementById("historyPanel"),
    boardCanvas: document.getElementById("boardCanvas"),
    boardHint: document.getElementById("boardHint"),
    landscapeRackTitle: document.getElementById("landscapeRackTitle"),
    landscapeRackSubtitle: document.getElementById("landscapeRackSubtitle"),
    landscapeHand: document.getElementById("landscapeHand"),
    marketSubtitle: document.getElementById("marketSubtitle"),
    marketColumns: document.getElementById("marketColumns"),
    rotateLeftButton: document.getElementById("rotateLeftButton"),
    rotateRightButton: document.getElementById("rotateRightButton"),
    clearSelectionButton: document.getElementById("clearSelectionButton"),
    endRoundButton: document.getElementById("endRoundButton"),
    restartButton: document.getElementById("restartButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayBody: document.getElementById("overlayBody"),
    overlayActions: document.getElementById("overlayActions")
  };

  const canvasController = Core.createCanvasController({
    canvas: elements.boardCanvas,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    onPointerMove: handleBoardPointerMove,
    onPointerDown: handleBoardPointerDown,
    onPointerLeave: handleBoardPointerLeave
  });

  const ctx = canvasController.context;

  Core.setupFullscreen({
    button: elements.fullscreenButton,
    target: elements.appShell
  });

  // =========================
  // TILE DEFINITIONS
  // =========================

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

  // =========================
  // STATE
  // =========================

  function createBoard() {
    return Array.from({ length: BOARD_ROWS }, (_, row) =>
      Array.from({ length: BOARD_COLS }, (_, col) => ({ row, col, landscapeTile: null, campTile: null }))
    );
  }

  function createSelection() {
    return { source: null, typeId: null, rotation: 0, columnIndex: null, slotIndex: null };
  }

  function createPlayerState(name) {
    return {
      id: "player-1",
      name,
      board: createBoard(),
      money: STARTING_BUDGET,
      score: 0,
      roundCampPlacements: [0, 0, 0],
      selection: createSelection(),
      landscapeInventory: cloneInventory(STARTING_LANDSCAPE_HAND),
      scoreLog: [],
      inspectedCell: null
    };
  }

  function createGameState() {
    const state = {
      players: [createPlayerState("Camp Director")],
      activePlayerIndex: 0,
      roundIndex: 0,
      phase: "setup",
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
        title: "Starting Setup",
        body: "Select the Entrance, rotate it so the gate faces the board edge, and begin your connected road network."
      },
      history: [],
      overlay: null,
      pointerCell: null,
      lastAttempt: null,
      finalScoringApplied: false
    };

    setActiveRoundObjectives(state, 0);
    pushHistory(state, "info", "Campground setup", "The 10 starting landscape tiles are ready. Place every one legally before contractor hiring opens.");
    return state;
  }

  let game = createGameState();

  // =========================
  // BASIC HELPERS
  // =========================

  function getPlayer() {
    return game.players[game.activePlayerIndex];
  }

  function getCurrentRound() {
    return ROUND_DEFS[game.roundIndex];
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

  function getCellRect(row, col) {
    return {
      x: BOARD_ORIGIN_X + col * (CELL_SIZE + CELL_GAP),
      y: BOARD_ORIGIN_Y + row * (CELL_SIZE + CELL_GAP),
      w: CELL_SIZE,
      h: CELL_SIZE
    };
  }

  function getBoardCellFromPoint(point) {
    const stride = CELL_SIZE + CELL_GAP;
    const col = Math.floor((point.x - BOARD_ORIGIN_X) / stride);
    const row = Math.floor((point.y - BOARD_ORIGIN_Y) / stride);
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return null;
    const localX = point.x - (BOARD_ORIGIN_X + col * stride);
    const localY = point.y - (BOARD_ORIGIN_Y + row * stride);
    if (localX > CELL_SIZE || localY > CELL_SIZE) return null;
    return { row, col };
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

  function clearSelection(player) {
    player.selection = createSelection();
  }

  function sameCell(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.row === b.row && a.col === b.col;
  }

  // =========================
  // INVENTORY + MARKET
  // =========================

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
    pushHistory(gameState, "info", "Camp Director objectives revealed", "Long-range management goals are now active and will score at the end of Late Summer.");
  }

  function pushHistory(gameState, tone, title, body) {
    gameState.history.unshift({ tone, title, body });
    gameState.history = gameState.history.slice(0, 8);
  }

  function setMessage(gameState, tone, title, body) {
    gameState.message = { tone, title, body };
  }

  // =========================
  // ROAD + BOARD ANALYSIS
  // =========================

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

  // =========================
  // VALIDATION + SCORING CONTEXT
  // =========================

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

    if (gameState.phase === "setup" && placedCount === 0 && typeId !== "entrance") {
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

    if (typeId === "entrance" && !entranceFacesBorder) {
      reasons.push("The Entrance tile must place its gate on the outer border.");
    }

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

  function scoreAdjacencyBonuses(board, row, col, typeId) {
    const context = createEvaluationContext(game, getPlayer());
    const cell = getCell(board, row, col);
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

    let developedQuadrants = new Set();
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

  // =========================
  // GAME ACTIONS
  // =========================

  function selectLandscapeTile(typeId) {
    const player = getPlayer();
    const same = player.selection.source === "landscape" && player.selection.typeId === typeId;
    player.selection = {
      source: "landscape",
      typeId,
      rotation: same ? player.selection.rotation : 0,
      columnIndex: null,
      slotIndex: null
    };
    player.inspectedCell = null;
    game.lastAttempt = null;
    setMessage(game, "info", "Landscape selected", `${getLandscapeDef(typeId).name} is ready. Rotate it, then tap a board parcel to place it.`);
    renderApp();
  }

  function selectMarketTile(columnIndex, slotIndex) {
    if (game.phase !== "build") {
      setMessage(game, "info", "Contractors closed", "Finish the landscape phase before hiring from the contractor market.");
      renderApp();
      return;
    }

    const player = getPlayer();
    const same = player.selection.source === "market" && player.selection.columnIndex === columnIndex && player.selection.slotIndex === slotIndex;
    player.selection = same
      ? createSelection()
      : { source: "market", typeId: game.market.columns[columnIndex].slots[slotIndex].typeId, rotation: 0, columnIndex, slotIndex };
    player.inspectedCell = null;
    game.lastAttempt = null;
    setMessage(game, "info", same ? "Selection cleared" : "Contractor selected", same ? "Choose another contractor or inspect the board." : `${getCampDef(player.selection.typeId).name} costs ${Core.formatMoney(CAMP_TILE_COST)}. Tap a valid parcel to buy and place it.`);
    renderApp();
  }

  function rotateSelectedLandscape(delta) {
    const player = getPlayer();
    if (player.selection.source !== "landscape") {
      setMessage(game, "info", "Rotation unavailable", "Rotate applies only to landscape tiles in your current hand.");
      renderApp();
      return;
    }
    player.selection.rotation = (player.selection.rotation + delta + 4) % 4;
    renderApp();
  }

  function attemptLandscapePlacement(row, col) {
    const player = getPlayer();
    const selection = player.selection;
    if (selection.source !== "landscape") return;
    const reasons = getLandscapePlacementReasons(game, player, row, col, selection.typeId, selection.rotation);
    game.lastAttempt = { row, col, reasons };
    if (reasons.length) {
      setMessage(game, "error", "Invalid landscape placement", reasons[0]);
      renderApp();
      return;
    }

    getCell(player.board, row, col).landscapeTile = { typeId: selection.typeId, rotation: selection.rotation };
    decrementLandscapeInventory(player.landscapeInventory, selection.typeId);
    player.inspectedCell = { row, col };
    game.lastAttempt = null;
    if (!player.landscapeInventory.some((entry) => entry.typeId === selection.typeId)) clearSelection(player);
    setMessage(game, "success", "Landscape placed", `${getLandscapeDef(selection.typeId).name} added to the campground layout.`);

    if (countRemainingLandscapeTiles(player.landscapeInventory) === 0) {
      const errors = validateFinishedLandscapePhase(player);
      if (errors.length) {
        setMessage(game, "error", "Layout still needs work", errors[0]);
      } else if (game.phase === "setup") {
        game.phase = "build";
        refreshMarket(game);
        setMessage(game, "success", "Early Summer begins", "The starting campground skeleton is complete. Hire contractors from the market and start building.");
        pushHistory(game, "success", "Setup complete", "The starting landscape network is ready for Early Summer building.");
      } else if (game.phase === "expansion") {
        game.phase = "build";
        refreshMarket(game);
        setMessage(game, "success", `${getCurrentRound().name} building open`, "Expansion tiles are down. Contractor hiring is open again.");
        pushHistory(game, "success", `${getCurrentRound().name} expansion complete`, "The seasonal landscape expansion is placed and build actions are open.");
      }
    }

    renderApp();
  }

  function attemptCampPlacement(row, col) {
    const player = getPlayer();
    const selection = player.selection;
    if (selection.source !== "market") return;
    const reasons = getCampTilePlacementReasons(game, player, row, col, selection.typeId);
    game.lastAttempt = { row, col, reasons };
    if (reasons.length) {
      setMessage(game, "error", "Invalid camp placement", reasons[0]);
      renderApp();
      return;
    }

    const cell = getCell(player.board, row, col);
    const campDef = getCampDef(selection.typeId);
    cell.campTile = { typeId: selection.typeId };
    player.money -= campDef.cost;
    player.roundCampPlacements[game.roundIndex] += 1;
    player.inspectedCell = { row, col };

    const bonuses = scoreAdjacencyBonuses(player.board, row, col, selection.typeId);
    refillMarketSlot(game, selection.columnIndex, selection.slotIndex);
    clearSelection(player);
    game.lastAttempt = null;

    setMessage(game, "success", "Contractor placed", `${campDef.name} was built for ${Core.formatMoney(campDef.cost)}.${bonuses.lines.length ? ` ${bonuses.lines[0]}` : ""}`);
    renderApp();
  }

  function scoreCurrentRound() {
    if (game.phase !== "build") return;
    const player = getPlayer();
    const context = createEvaluationContext(game, player);
    const round = getCurrentRound();
    const results = game.activeRoundObjectives.map((objective) => ({ objective, result: objective.evaluate(context) }));
    const roundPoints = Core.sum(results, (entry) => entry.result.points);
    const completedCount = results.filter((entry) => entry.result.points > 0).length;

    player.score += roundPoints;
    player.scoreLog.push({ kind: "round", roundName: round.name, results, total: roundPoints });
    pushHistory(game, roundPoints > 0 ? "success" : "info", `${round.name} scored`, `${roundPoints} points from ${completedCount} completed shared objective${completedCount === 1 ? "" : "s"}.`);

    if (game.roundIndex === 0) revealDirectorObjectives(game);

    if (game.roundIndex === ROUND_DEFS.length - 1) {
      applyFinalScoring();
      return;
    }

    game.phase = "round-summary";
    clearSelection(player);
    game.overlay = {
      kind: "round-summary",
      title: `${round.name} Summary`,
      results,
      total: roundPoints,
      intro: [
        `You finished ${round.name} with ${roundPoints} point${roundPoints === 1 ? "" : "s"}.`,
        `Completed shared objectives: ${completedCount}/${results.length}.`,
        game.roundIndex === 0
          ? "Camp Director objectives are now active and will score at the end of the game."
          : `${ROUND_DEFS[game.roundIndex + 1].name} begins with a fresh 8-tile landscape hand and a $50,000 contractor grant.`
      ],
      actions: [{ id: "advance-round", label: `Start ${ROUND_DEFS[game.roundIndex + 1].name}`, variant: "warning" }]
    };
    renderApp();
  }

  function advanceRound() {
    const player = getPlayer();
    game.roundIndex += 1;
    game.phase = "expansion";
    game.pointerCell = null;
    game.lastAttempt = null;
    player.landscapeInventory = drawExpansionLandscapeInventory(game.roundIndex);
    player.money += SEASON_BUDGET_GRANT;
    player.inspectedCell = null;
    clearSelection(player);
    setActiveRoundObjectives(game, game.roundIndex);
    refreshMarket(game);
    setMessage(game, "info", `${getCurrentRound().name} expansion`, `You received ${Core.formatMoney(SEASON_BUDGET_GRANT)} and 8 new landscape tiles. Place every expansion tile before the contractor market reopens.`);
    pushHistory(game, "info", `${getCurrentRound().name} grant`, `Received ${Core.formatMoney(SEASON_BUDGET_GRANT)} for seasonal expansion and refreshed contractor crews.`);
    game.overlay = null;
    renderApp();
  }

  function applyFinalScoring() {
    if (game.finalScoringApplied) return;
    const player = getPlayer();
    const context = createEvaluationContext(game, player);
    const directorResults = game.activeDirectorObjectives.map((objective) => ({ objective, result: objective.evaluate(context) }));
    const directorPoints = Core.sum(directorResults, (entry) => entry.result.points);
    player.score += directorPoints;
    player.scoreLog.push({ kind: "director", roundName: "Camp Director Objectives", results: directorResults, total: directorPoints });
    pushHistory(game, "success", "Final scoring", `${directorPoints} points were added from Camp Director objectives.`);
    game.finalScoringApplied = true;
    game.phase = "final";
    game.overlay = {
      kind: "final",
      title: "Final Scoring",
      results: player.scoreLog.flatMap((entry) => entry.results.map((resultEntry) => ({ objective: resultEntry.objective, result: resultEntry.result, section: entry.roundName }))),
      total: player.score,
      intro: [
        "Late Summer is complete and the campground is ready for its final review.",
        `Final score: ${player.score} points.`,
        `Money remaining: ${Core.formatMoney(player.money)}.`
      ],
      actions: [{ id: "restart-game", label: "Start New Game", variant: "danger" }]
    };
    renderApp();
  }

  function restartGame() {
    game = createGameState();
    renderApp();
  }

  function handleBoardPointerMove(point) {
    const nextCell = getBoardCellFromPoint(point);
    if (sameCell(game.pointerCell, nextCell)) return;
    game.pointerCell = nextCell;
    renderBoard();
    renderBoardHint();
  }

  function handleBoardPointerLeave() {
    game.pointerCell = null;
    renderBoard();
    renderBoardHint();
  }

  function handleBoardPointerDown(point) {
    const boardCell = getBoardCellFromPoint(point);
    if (!boardCell) return;
    const player = getPlayer();
    player.inspectedCell = boardCell;
    if (player.selection.source === "landscape") {
      attemptLandscapePlacement(boardCell.row, boardCell.col);
      return;
    }
    if (player.selection.source === "market") {
      attemptCampPlacement(boardCell.row, boardCell.col);
      return;
    }
    const cell = getCell(player.board, boardCell.row, boardCell.col);
    if (!cell.landscapeTile) setMessage(game, "info", "Empty parcel", "No landscape tile has been placed here yet.");
    else if (cell.campTile) setMessage(game, "info", "Developed parcel", `${getLandscapeDef(cell.landscapeTile.typeId).name} supports ${getCampDef(cell.campTile.typeId).name}.`);
    else setMessage(game, "info", "Open parcel", `${getLandscapeDef(cell.landscapeTile.typeId).name} is open for camp development.`);
    renderApp();
  }

  function bindEvents() {
    elements.rotateLeftButton.addEventListener("click", () => rotateSelectedLandscape(-1));
    elements.rotateRightButton.addEventListener("click", () => rotateSelectedLandscape(1));
    elements.clearSelectionButton.addEventListener("click", () => {
      clearSelection(getPlayer());
      game.lastAttempt = null;
      setMessage(game, "info", "Selection cleared", "Choose a landscape tile, a contractor, or inspect the board.");
      renderApp();
    });
    elements.endRoundButton.addEventListener("click", scoreCurrentRound);
    elements.restartButton.addEventListener("click", restartGame);
    elements.landscapeHand.addEventListener("click", (event) => {
      const button = event.target.closest("[data-landscape-type]");
      if (button) selectLandscapeTile(button.dataset.landscapeType);
    });
    elements.marketColumns.addEventListener("click", (event) => {
      const button = event.target.closest("[data-market-column]");
      if (button) selectMarketTile(Number(button.dataset.marketColumn), Number(button.dataset.marketSlot));
    });
    elements.overlayActions.addEventListener("click", (event) => {
      const button = event.target.closest("[data-overlay-action]");
      if (!button) return;
      if (button.dataset.overlayAction === "advance-round") advanceRound();
      if (button.dataset.overlayAction === "restart-game") restartGame();
    });
  }

  // =========================
  // RENDERING
  // =========================

  function getPhaseLabel() {
    if (game.phase === "setup") return "Starting Layout";
    if (game.phase === "expansion") return "Season Expansion";
    if (game.phase === "build") return "Buy + Place";
    if (game.phase === "round-summary") return "Round Summary";
    return "Final Scoring";
  }

  function renderApp() {
    renderStats();
    renderSelectionPanel();
    renderMessagePanel();
    renderObjectives();
    renderHistory();
    renderLandscapeHand();
    renderMarket();
    renderButtons();
    renderBoard();
    renderBoardHint();
    renderOverlay();
  }

  function renderStats() {
    const player = getPlayer();
    elements.roundStat.textContent = getCurrentRound().name;
    elements.phaseStat.textContent = getPhaseLabel();
    elements.moneyStat.textContent = Core.formatMoney(player.money);
    elements.scoreStat.textContent = `${player.score} pts`;
    elements.roundBuildStat.textContent = `${player.roundCampPlacements[game.roundIndex]} tile${player.roundCampPlacements[game.roundIndex] === 1 ? "" : "s"}`;
    elements.objectivesSubtitle.textContent = game.directorRevealed
      ? `${getCurrentRound().name} shared goals are active now. Camp Director goals will score at the end of the game.`
      : `${getCurrentRound().name} shared goals are active now. Camp Director goals arrive after the first scoring phase.`;
    if (game.phase === "build") elements.marketSubtitle.textContent = "Two amenity columns and four campsite columns stay face-up all game. Each hired contractor costs $10,000.";
    else if (game.phase === "setup" || game.phase === "expansion") elements.marketSubtitle.textContent = "Contractors stay visible, but hiring is paused until every landscape tile in the current hand has been placed.";
    else if (game.phase === "final") elements.marketSubtitle.textContent = "The season is over. Review the final score breakdown or start a new campground.";
    else elements.marketSubtitle.textContent = "Round scoring is in progress. Continue when you're ready for the next season.";
  }

  function renderSelectionPanel() {
    const player = getPlayer();
    const selection = player.selection;
    let html = "";
    if (selection.source === "landscape") {
      const def = getLandscapeDef(selection.typeId);
      const remaining = player.landscapeInventory.find((entry) => entry.typeId === selection.typeId)?.count || 0;
      elements.selectionIntro.textContent = "Landscape tiles rotate. Use the rotate buttons, then tap the board.";
      html = `<span class="tile-pill">Landscape</span><div class="tile-title-row"><div class="tile-name">${def.name}</div><div class="tile-pill">${selection.rotation * 90}&deg;</div></div><div class="tile-subtext">${def.description}</div><div class="tile-subtext"><strong>Remaining:</strong> ${remaining}</div>`;
    } else if (selection.source === "market") {
      const def = getCampDef(selection.typeId);
      elements.selectionIntro.textContent = "Camp tiles do not rotate. Tap a valid landscape parcel to buy and place the selected contractor.";
      html = `<span class="tile-pill">${def.marketGroup === "amenity" ? "Amenity Contractor" : "Camp Contractor"}</span><div class="tile-title-row"><div class="tile-name">${def.name}</div><div class="tile-pill">${Core.formatMoney(def.cost)}</div></div><div class="tile-subtext">${def.description}</div><div class="tile-subtext"><strong>Placement:</strong> ${def.rulesText}</div>`;
    } else if (player.inspectedCell) {
      const cell = getCell(player.board, player.inspectedCell.row, player.inspectedCell.col);
      elements.selectionIntro.textContent = "Tap any parcel to inspect what is already built there.";
      if (!cell.landscapeTile) html = `<span class="tile-pill">Open Ground</span><div class="tile-title-row"><div class="tile-name">Empty Parcel</div></div><div class="tile-subtext">No landscape tile has been placed on this cell yet.</div>`;
      else html = `<span class="tile-pill">Parcel Details</span><div class="tile-title-row"><div class="tile-name">${getLandscapeDef(cell.landscapeTile.typeId).name}</div></div><div class="tile-subtext"><strong>Landscape:</strong> ${getLandscapeDef(cell.landscapeTile.typeId).description}</div><div class="tile-subtext"><strong>Camp layer:</strong> ${cell.campTile ? getCampDef(cell.campTile.typeId).name : "No camp tile yet"}</div>`;
    } else {
      elements.selectionIntro.textContent = "Choose a landscape tile during setup, or a contractor during the build phase.";
      html = `<span class="tile-pill">Ready</span><div class="tile-title-row"><div class="tile-name">No Tile Selected</div></div><div class="tile-subtext">The board supports two layers: landscape first, then one camp tile on top.</div><div class="tile-subtext">Large tap targets and explicit placement messages keep the prototype mobile-friendly from the start.</div>`;
    }
    elements.selectionPanel.innerHTML = html;
  }

  function renderMessagePanel() {
    elements.messagePanel.dataset.tone = game.message.tone;
    elements.messagePanel.innerHTML = `<div class="message-title">${game.message.title}</div><div class="message-body">${game.message.body}</div>`;
  }

  function renderObjectiveCard(objective, result, variant) {
    return `<div class="objective-card ${variant}"><div class="tile-title-row"><div class="objective-name">${objective.name}</div><div class="tile-pill">${objective.points} pts</div></div><div class="objective-description">${objective.description}</div><div class="objective-progress"><strong>Currently ${result.points}/${objective.points} pts</strong></div><div class="objective-progress">${result.detail}</div></div>`;
  }

  function renderObjectives() {
    const context = createEvaluationContext(game, getPlayer());
    elements.sharedObjectives.innerHTML = game.activeRoundObjectives.map((objective) => renderObjectiveCard(objective, objective.evaluate(context), "current")).join("");
    elements.directorObjectives.innerHTML = game.directorRevealed
      ? game.activeDirectorObjectives.map((objective) => renderObjectiveCard(objective, objective.evaluate(context), "director")).join("")
      : '<div class="objective-card director"><div class="objective-name">Camp Director objectives are still hidden.</div><div class="objective-description">They reveal after the first round scoring summary.</div></div>';
  }

  function renderHistory() {
    if (!game.history.length) {
      elements.historyPanel.innerHTML = '<div class="history-card"><p>No scoring yet. Build the campground and end the round when you are ready.</p></div>';
      return;
    }
    elements.historyPanel.innerHTML = game.history.map((entry) => `<div class="history-card"><div class="tile-title-row"><div class="tile-name">${entry.title}</div><div class="tile-pill">${entry.tone}</div></div><p>${entry.body}</p></div>`).join("");
  }

  function renderLandscapeHand() {
    const player = getPlayer();
    const canUseHand = game.phase === "setup" || game.phase === "expansion";
    const remaining = countRemainingLandscapeTiles(player.landscapeInventory);
    if (game.phase === "setup") {
      elements.landscapeRackTitle.textContent = "Starting Landscape Tiles";
      elements.landscapeRackSubtitle.textContent = "Place all 10 starting landscape tiles legally to begin Early Summer.";
    } else if (game.phase === "expansion") {
      elements.landscapeRackTitle.textContent = `${getCurrentRound().name} Expansion Tiles`;
      elements.landscapeRackSubtitle.textContent = `Place all ${remaining} expansion landscape tiles before the contractor market reopens.`;
    } else {
      elements.landscapeRackTitle.textContent = "Landscape Hand";
      elements.landscapeRackSubtitle.textContent = "No landscape placements are pending right now. Future rounds will grant 8 more landscape tiles.";
    }
    if (!player.landscapeInventory.length) {
      elements.landscapeHand.innerHTML = '<div class="landscape-tile"><div class="tile-name">No landscape tiles in hand</div><div class="tile-subtext">The current round is ready for contractor drafting and camp placement.</div></div>';
      return;
    }
    elements.landscapeHand.innerHTML = player.landscapeInventory.map((entry) => {
      const def = getLandscapeDef(entry.typeId);
      const selected = player.selection.source === "landscape" && player.selection.typeId === entry.typeId;
      return `<button class="landscape-tile ${selected ? "selected" : ""}" type="button" data-landscape-type="${entry.typeId}" ${canUseHand ? "" : "disabled"}><div class="tile-title-row"><div class="tile-name">${def.name}</div><div class="tile-pill">x${entry.count}</div></div><div class="tile-subtext">${def.description}</div></button>`;
    }).join("");
  }

  function renderMarket() {
    const player = getPlayer();
    const canHire = game.phase === "build";
    elements.marketColumns.innerHTML = game.market.columns.map((column, columnIndex) => {
      const headerClass = column.category === "amenity" ? "amenity" : "";
      const slots = column.slots.map((slot, slotIndex) => {
        const def = getCampDef(slot.typeId);
        const selected = player.selection.source === "market" && player.selection.columnIndex === columnIndex && player.selection.slotIndex === slotIndex;
        return `<button class="market-tile ${selected ? "selected" : ""}" type="button" data-market-column="${columnIndex}" data-market-slot="${slotIndex}" ${canHire ? "" : "disabled"}><div class="tile-title-row"><div class="tile-name">${def.name}</div><div class="market-badge">${column.category === "amenity" ? "Amenity" : "Camp"}</div></div><div class="tile-subtext">${def.rulesText}</div><div class="tile-subtext"><strong>Cost:</strong> ${Core.formatMoney(def.cost)}</div></button>`;
      }).join("");
      return `<div class="market-column"><div class="column-header ${headerClass}">${column.label}</div>${slots}</div>`;
    }).join("");
  }

  function renderButtons() {
    const player = getPlayer();
    elements.rotateLeftButton.disabled = player.selection.source !== "landscape";
    elements.rotateRightButton.disabled = player.selection.source !== "landscape";
    elements.clearSelectionButton.disabled = !player.selection.source;
    elements.endRoundButton.disabled = game.phase !== "build";
    elements.endRoundButton.textContent = game.phase === "build" ? `Score ${getCurrentRound().name}` : "Score This Round";
  }

  function drawBoardLabels() {
    ctx.fillStyle = "rgba(47, 38, 31, 0.7)";
    ctx.font = "700 16px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let col = 0; col < BOARD_COLS; col += 1) {
      const rect = getCellRect(0, col);
      ctx.fillText(String.fromCharCode(65 + col), rect.x + rect.w / 2, BOARD_ORIGIN_Y - 14);
    }
    ctx.textAlign = "right";
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const rect = getCellRect(row, 0);
      ctx.fillText(String(row + 1), BOARD_ORIGIN_X - 12, rect.y + rect.h / 2);
    }
  }

  function drawCornerLabel(rect, label) {
    Core.drawRoundedRect(ctx, rect.x + 10, rect.y + 10, 54, 22, 11, "rgba(255, 255, 255, 0.72)", "rgba(95, 70, 51, 0.12)", 1);
    ctx.fillStyle = "#5a4430";
    ctx.font = "700 11px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, rect.x + 37, rect.y + 21);
  }

  function drawBuildingBadge(rect, label, fill, text, stroke) {
    Core.drawRoundedRect(ctx, rect.x + 18, rect.y + rect.h - 36, rect.w - 36, 24, 12, fill, stroke, 1.5);
    ctx.fillStyle = text;
    ctx.font = "700 13px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h - 24);
  }

  function drawWaterEdges(rect, info) {
    const fill = "rgba(103, 167, 200, 0.92)";
    const thickness = 14;
    for (const side of SIDES) {
      if (info.edges[side] !== "water") continue;
      if (side === "north") Core.drawRoundedRect(ctx, rect.x + 10, rect.y + 8, rect.w - 20, thickness, 8, fill);
      if (side === "east") Core.drawRoundedRect(ctx, rect.x + rect.w - thickness - 8, rect.y + 10, thickness, rect.h - 20, 8, fill);
      if (side === "south") Core.drawRoundedRect(ctx, rect.x + 10, rect.y + rect.h - thickness - 8, rect.w - 20, thickness, 8, fill);
      if (side === "west") Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 10, thickness, rect.h - 20, 8, fill);
    }
  }

  function drawRoadEdges(rect, info) {
    const centerX = rect.x + rect.w / 2;
    const centerY = rect.y + rect.h / 2;
    ctx.strokeStyle = "#d6b07a";
    ctx.lineWidth = 16;
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
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const side of SIDES) {
      if (info.edges[side] !== "entrance") continue;
      ctx.strokeStyle = "#874721";
      ctx.lineWidth = 6;
      ctx.beginPath();
      if (side === "north") {
        ctx.moveTo(centerX - 16, rect.y + 14); ctx.lineTo(centerX - 16, rect.y + 30);
        ctx.moveTo(centerX + 16, rect.y + 14); ctx.lineTo(centerX + 16, rect.y + 30);
      }
      if (side === "east") {
        ctx.moveTo(rect.x + rect.w - 14, centerY - 16); ctx.lineTo(rect.x + rect.w - 30, centerY - 16);
        ctx.moveTo(rect.x + rect.w - 14, centerY + 16); ctx.lineTo(rect.x + rect.w - 30, centerY + 16);
      }
      if (side === "south") {
        ctx.moveTo(centerX - 16, rect.y + rect.h - 14); ctx.lineTo(centerX - 16, rect.y + rect.h - 30);
        ctx.moveTo(centerX + 16, rect.y + rect.h - 14); ctx.lineTo(centerX + 16, rect.y + rect.h - 30);
      }
      if (side === "west") {
        ctx.moveTo(rect.x + 14, centerY - 16); ctx.lineTo(rect.x + 30, centerY - 16);
        ctx.moveTo(rect.x + 14, centerY + 16); ctx.lineTo(rect.x + 30, centerY + 16);
      }
      ctx.stroke();
    }
  }

  function drawLandscapeTile(rect, tile) {
    const info = getLandscapeInfoFromTile(tile);
    const fill = info.hasForestTag ? "#9fba7d" : info.hasWaterEdge ? "#c4dee2" : "#c8dca3";
    Core.drawRoundedRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, 18, fill, "rgba(64, 58, 38, 0.12)", 1.5);
    drawWaterEdges(rect, info);
    drawRoadEdges(rect, info);
    if (info.isOffice) drawBuildingBadge(rect, "Office", "#fff0bf", "#7e5f2f", "#a8874e");
    else if (info.isEntrance) drawBuildingBadge(rect, "Gate", "#ffe2be", "#8d5227", "#b96d3f");
    else if (info.hasForestTag) drawCornerLabel(rect, "Forest");
    else if (info.hasWaterEdge) drawCornerLabel(rect, "Lakeside");
  }

  function drawCampTile(rect, campTile) {
    const def = getCampDef(campTile.typeId);
    const stroke = def.tags.includes("premium") ? "rgba(255, 236, 175, 0.9)" : "rgba(64, 45, 31, 0.16)";
    Core.drawRoundedRect(ctx, rect.x + 18, rect.y + 18, rect.w - 36, rect.h - 36, 18, def.color, stroke, 2.5);
    Core.drawWrappedText(ctx, def.shortLabel, rect.x + rect.w / 2, rect.y + 28, rect.w - 56, 14, { font: "700 14px 'Trebuchet MS', sans-serif", align: "center", color: "#fffdf8" });
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "700 10px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(def.marketGroup === "amenity" ? "Amenity" : "Camp", rect.x + rect.w / 2, rect.y + rect.h - 26);
  }

  function drawBoardCell(board, row, col) {
    const rect = getCellRect(row, col);
    const cell = getCell(board, row, col);
    const hover = game.pointerCell && game.pointerCell.row === row && game.pointerCell.col === col;
    const inspected = getPlayer().inspectedCell && getPlayer().inspectedCell.row === row && getPlayer().inspectedCell.col === col;
    const lastAttempt = game.lastAttempt && game.lastAttempt.row === row && game.lastAttempt.col === col;
    Core.drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 20, "rgba(251, 246, 236, 0.9)", "rgba(95, 70, 51, 0.12)", 1.5);
    if (!cell.landscapeTile) {
      ctx.strokeStyle = "rgba(95, 70, 51, 0.2)";
      ctx.setLineDash([8, 6]);
      ctx.strokeRect(rect.x + 12, rect.y + 12, rect.w - 24, rect.h - 24);
      ctx.setLineDash([]);
      if (hover) Core.drawRoundedRect(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, 18, "rgba(241, 214, 170, 0.28)", "rgba(214, 111, 66, 0.28)", 2);
      return;
    }
    drawLandscapeTile(rect, cell.landscapeTile);
    if (cell.campTile) drawCampTile(rect, cell.campTile);
    if (hover) Core.drawRoundedRect(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, 18, "rgba(255,255,255,0.06)", "rgba(214, 111, 66, 0.42)", 2.5);
    if (inspected) Core.drawRoundedRect(ctx, rect.x + 6, rect.y + 6, rect.w - 12, rect.h - 12, 16, null, "rgba(53, 86, 63, 0.42)", 2);
    if (lastAttempt) Core.drawRoundedRect(ctx, rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 20, 16, game.lastAttempt.reasons.length ? "rgba(214,111,66,0.18)" : "rgba(53,134,82,0.18)", game.lastAttempt.reasons.length ? "rgba(214,111,66,0.45)" : "rgba(53,134,82,0.45)", 2);
  }

  function drawPreviewOverlay(player) {
    if (!player.selection.source || !game.pointerCell) return;
    const rect = getCellRect(game.pointerCell.row, game.pointerCell.col);
    if (player.selection.source === "landscape") {
      const reasons = getLandscapePlacementReasons(game, player, game.pointerCell.row, game.pointerCell.col, player.selection.typeId, player.selection.rotation);
      ctx.save();
      ctx.globalAlpha = reasons.length ? 0.55 : 0.78;
      drawLandscapeTile(rect, { typeId: player.selection.typeId, rotation: player.selection.rotation });
      ctx.restore();
      Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, 16, null, reasons.length ? "rgba(214,111,66,0.6)" : "rgba(53,134,82,0.55)", 2.5);
      return;
    }
    const reasons = getCampTilePlacementReasons(game, player, game.pointerCell.row, game.pointerCell.col, player.selection.typeId);
    if (getCell(player.board, game.pointerCell.row, game.pointerCell.col)?.landscapeTile) {
      ctx.save();
      ctx.globalAlpha = reasons.length ? 0.5 : 0.8;
      drawCampTile(rect, { typeId: player.selection.typeId });
      ctx.restore();
    }
    Core.drawRoundedRect(ctx, rect.x + 8, rect.y + 8, rect.w - 16, rect.h - 16, 16, null, reasons.length ? "rgba(214,111,66,0.6)" : "rgba(53,134,82,0.55)", 2.5);
  }

  function renderBoard() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#f5eddc";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    Core.drawRoundedRect(ctx, BOARD_ORIGIN_X - 22, BOARD_ORIGIN_Y - 28, BOARD_WIDTH + 44, BOARD_HEIGHT + 56, 28, "rgba(255,249,239,0.88)", "rgba(95,70,51,0.16)", 2);
    drawBoardLabels();
    const player = getPlayer();
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let col = 0; col < BOARD_COLS; col += 1) drawBoardCell(player.board, row, col);
    }
    drawPreviewOverlay(player);
  }

  function renderBoardHint() {
    const player = getPlayer();
    if (player.selection.source === "landscape" && game.pointerCell) {
      const reasons = getLandscapePlacementReasons(game, player, game.pointerCell.row, game.pointerCell.col, player.selection.typeId, player.selection.rotation);
      elements.boardHint.innerHTML = reasons.length ? `<strong>${formatBoardCellLabel(game.pointerCell.row, game.pointerCell.col)}</strong>: ${reasons[0]}` : `<strong>${formatBoardCellLabel(game.pointerCell.row, game.pointerCell.col)}</strong>: Valid placement for ${getLandscapeDef(player.selection.typeId).name}.`;
      return;
    }
    if (player.selection.source === "market" && game.pointerCell) {
      const reasons = getCampTilePlacementReasons(game, player, game.pointerCell.row, game.pointerCell.col, player.selection.typeId);
      const bonuses = scoreAdjacencyBonuses(player.board, game.pointerCell.row, game.pointerCell.col, player.selection.typeId);
      elements.boardHint.innerHTML = reasons.length ? `<strong>${formatBoardCellLabel(game.pointerCell.row, game.pointerCell.col)}</strong>: ${reasons[0]}` : `<strong>${formatBoardCellLabel(game.pointerCell.row, game.pointerCell.col)}</strong>: Valid placement for ${getCampDef(player.selection.typeId).name}.${bonuses.lines.length ? ` ${bonuses.lines[0]}` : ""}`;
      return;
    }
    if (player.inspectedCell) {
      const cell = getCell(player.board, player.inspectedCell.row, player.inspectedCell.col);
      if (!cell.landscapeTile) elements.boardHint.innerHTML = `<strong>${formatBoardCellLabel(player.inspectedCell.row, player.inspectedCell.col)}</strong>: Empty parcel. Add a landscape tile here during setup or seasonal expansion.`;
      else if (cell.campTile) elements.boardHint.innerHTML = `<strong>${formatBoardCellLabel(player.inspectedCell.row, player.inspectedCell.col)}</strong>: ${getLandscapeDef(cell.landscapeTile.typeId).name} with ${getCampDef(cell.campTile.typeId).name} on top.`;
      else elements.boardHint.innerHTML = `<strong>${formatBoardCellLabel(player.inspectedCell.row, player.inspectedCell.col)}</strong>: ${getLandscapeDef(cell.landscapeTile.typeId).name} is open for camp development.`;
      return;
    }
    if (game.phase === "setup") elements.boardHint.innerHTML = "<strong>Setup tip:</strong> Start with the Entrance on the border, then grow one connected road network that folds in the Camp Office.";
    else if (game.phase === "expansion") elements.boardHint.innerHTML = `<strong>${getCurrentRound().name} expansion:</strong> Place every landscape tile in your current hand before contractor hiring reopens.`;
    else if (game.phase === "build") elements.boardHint.innerHTML = "<strong>Build tip:</strong> Select a contractor from the market, then tap a valid landscape parcel to buy and place it.";
    else if (game.phase === "round-summary") elements.boardHint.innerHTML = "<strong>Round scored:</strong> Check the summary overlay, then continue to the next season when you are ready.";
    else elements.boardHint.innerHTML = "<strong>Final scoring:</strong> Review the completed campground and start a fresh game whenever you want another run.";
  }

  function renderOverlay() {
    if (!game.overlay) {
      elements.overlay.classList.remove("open");
      return;
    }
    elements.overlay.classList.add("open");
    elements.overlayTitle.textContent = game.overlay.title;
    const intro = game.overlay.intro.map((line) => `<div>${line}</div>`).join("");
    const scoreItems = game.overlay.results.map((entry) => `<div class="overlay-score-item"><div><strong>${entry.objective.name}</strong><div>${game.overlay.kind === "final" ? `${entry.section}: ` : ""}${entry.result.detail}</div></div><div>${entry.result.points}/${entry.objective.points}</div></div>`).join("");
    elements.overlayBody.innerHTML = `${intro}<div class="overlay-score-list">${scoreItems}</div><div class="overlay-total">${game.overlay.kind === "final" ? `Final total: ${game.overlay.total} points` : `Round total: ${game.overlay.total} points`}</div>`;
    elements.overlayActions.innerHTML = game.overlay.actions.map((action) => `<button class="ui-button ${action.variant || ""}" type="button" data-overlay-action="${action.id}">${action.label}</button>`).join("");
  }

  bindEvents();
  renderApp();
})();
