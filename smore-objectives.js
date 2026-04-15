(function () {
  "use strict";

  function passed(points, detail) {
    return {
      passed: points > 0,
      points,
      detail
    };
  }

  function failed(detail) {
    return {
      passed: false,
      points: 0,
      detail
    };
  }

  function makeObjective(config) {
    return config;
  }

  function getTypeCount(context, typeId) {
    return context.campTypeCounts[typeId] || 0;
  }

  function getCellsByType(context, typeId) {
    return context.campCellsByType[typeId] || [];
  }

  function isPremiumCampCell(cell) {
    return cell.campDef.tags.includes("premium");
  }

  function isAmenityCell(cell) {
    return cell.campDef.kind === "amenity";
  }

  function isTentLikeCell(cell) {
    return cell.campDef.tags.includes("tent");
  }

  function isCampsiteCell(cell) {
    return cell.campDef.kind === "campsite" || cell.campDef.kind === "lodging";
  }

  function isAnyDevelopedCampCell(cell) {
    return Boolean(cell.campTile);
  }

  function countNearbyCells(context, sourceCell, predicate, maxDistance) {
    let total = 0;
    for (const other of context.campCells) {
      if (other.row === sourceCell.row && other.col === sourceCell.col) {
        continue;
      }
      const distance = Math.abs(other.row - sourceCell.row) + Math.abs(other.col - sourceCell.col);
      if (distance <= maxDistance && predicate(other)) {
        total += 1;
      }
    }
    return total;
  }

  function findCellByTypeWithNearby(context, typeId, predicate, maxDistance, minimumCount) {
    return getCellsByType(context, typeId).find((cell) => countNearbyCells(context, cell, predicate, maxDistance) >= minimumCount);
  }

  function isCellConnectedToMainRoad(context, row, col) {
    const key = `${row},${col}`;
    if (context.reachableRoadKeys.has(key)) {
      return true;
    }

    return context.getOrthogonalNeighbors(row, col).some((neighbor) => context.reachableRoadKeys.has(`${neighbor.row},${neighbor.col}`));
  }

  function isNearImportantBuilding(context, cell, maxDistance) {
    const anchors = [];
    if (context.entrance) anchors.push(context.entrance);
    if (context.office) anchors.push(context.office);

    return anchors.some((anchor) => {
      const distance = Math.abs(cell.row - anchor.row) + Math.abs(cell.col - anchor.col);
      return distance <= maxDistance;
    });
  }

  function createEarlySummerObjectives() {
    return [
      makeObjective({
        id: "early-01",
        round: "early",
        name: "Scout Arrival",
        description: "Score for having 2 Group Sites connected to the main road network.",
        points: 5,
        evaluate: (context) => {
          const connectedGroups = getCellsByType(context, "group_site").filter((cell) => isCellConnectedToMainRoad(context, cell.row, cell.col)).length;
          return connectedGroups >= 2
            ? passed(5, "Two Group Sites are tied into the main arrival road.")
            : failed(`${connectedGroups}/2 Group Sites currently connect to the main road.`);
        }
      }),
      makeObjective({
        id: "early-02",
        round: "early",
        name: "First Weekend Rush",
        description: "Score for having at least 5 total campsite tiles placed.",
        points: 4,
        evaluate: (context) => {
          return context.campsiteCount >= 5
            ? passed(4, "Five or more campsite or lodging tiles are ready for opening weekend.")
            : failed(`${context.campsiteCount}/5 campsite or lodging tiles placed.`);
        }
      }),
      makeObjective({
        id: "early-03",
        round: "early",
        name: "Organized Check-In",
        description: "Score for Camp Office connected efficiently to the Entrance by road.",
        points: 4,
        evaluate: (context) => {
          return context.officeDistance > 0 && context.officeDistance <= 5
            ? passed(4, `Entrance reaches the Camp Office in ${context.officeDistance} road steps.`)
            : failed("The Camp Office needs a short, direct road link from the Entrance.");
        }
      }),
      makeObjective({
        id: "early-04",
        round: "early",
        name: "Fire Circle Friends",
        description: "Score for placing Firewood adjacent to at least 2 campsite tiles.",
        points: 4,
        evaluate: (context) => {
          const firewoodCell = findCellByTypeWithNearby(context, "firewood", isCampsiteCell, 1, 2);
          return firewoodCell
            ? passed(4, "A Firewood stand is serving at least two nearby campsites.")
            : failed("Place Firewood orthogonally next to two campsites.");
        }
      }),
      makeObjective({
        id: "early-05",
        round: "early",
        name: "Tents in the Pines",
        description: "Score for placing 3 Rustic Tent Forest tiles.",
        points: 4,
        evaluate: (context) => {
          const rusticCount = getTypeCount(context, "rustic_tent_forest");
          return rusticCount >= 3
            ? passed(4, "Three Rustic Tent Forest sites are active.")
            : failed(`${rusticCount}/3 Rustic Tent Forest sites placed.`);
        }
      }),
      makeObjective({
        id: "early-06",
        round: "early",
        name: "Beginner’s Loop",
        description: "Score for completing a road loop.",
        points: 5,
        evaluate: (context) => {
          return context.hasRoadLoop
            ? passed(5, "A closed road loop exists in the campground network.")
            : failed("Complete at least one road loop.");
        }
      }),
      makeObjective({
        id: "early-07",
        round: "early",
        name: "Easy Access",
        description: "Score for having no dead-end roads in the main setup.",
        points: 5,
        evaluate: (context) => {
          return context.deadEndRoadCount === 0
            ? passed(5, "No dead-end road tiles remain in the main network.")
            : failed(`${context.deadEndRoadCount} dead-end road tiles still need cleanup.`);
        }
      }),
      makeObjective({
        id: "early-08",
        round: "early",
        name: "Family Meet-Up",
        description: "Score for 1 Group Site plus 1 Playground.",
        points: 4,
        evaluate: (context) => {
          return getTypeCount(context, "group_site") >= 1 && getTypeCount(context, "playground") >= 1
            ? passed(4, "A Group Site and Playground are both available.")
            : failed("You need both a Group Site and a Playground.");
        }
      }),
      makeObjective({
        id: "early-09",
        round: "early",
        name: "Camp Basics",
        description: "Score for placing at least 2 different amenities.",
        points: 4,
        evaluate: (context) => {
          return context.uniqueAmenityCount >= 2
            ? passed(4, `${context.uniqueAmenityCount} different amenities are already operating.`)
            : failed(`${context.uniqueAmenityCount}/2 different amenities placed.`);
        }
      }),
      makeObjective({
        id: "early-10",
        round: "early",
        name: "Trailhead Start",
        description: "Score for placing a Hiking Trail connected near the Entrance or Camp Office.",
        points: 4,
        evaluate: (context) => {
          const trail = getCellsByType(context, "hiking_trail").find((cell) => isNearImportantBuilding(context, cell, 1));
          return trail
            ? passed(4, "A Hiking Trail sits near the Entrance or Camp Office.")
            : failed("Place Hiking Trail within one space of the Entrance or Camp Office.");
        }
      }),
      makeObjective({
        id: "early-11",
        round: "early",
        name: "Tent Row",
        description: "Score for 3 campsite tiles aligned along the same continuous road.",
        points: 5,
        evaluate: (context) => {
          return context.longestAlignedCampRun >= 3
            ? passed(5, `A continuous roadside camp run of ${context.longestAlignedCampRun} tiles is active.`)
            : failed(`${context.longestAlignedCampRun}/3 campsite tiles aligned along the same road.`);
        }
      }),
      makeObjective({
        id: "early-12",
        round: "early",
        name: "Busy Office",
        description: "Score for Camp Office having road access on multiple sides.",
        points: 4,
        evaluate: (context) => {
          return context.officeConnectedRoadSides >= 2
            ? passed(4, "The Camp Office has multiple connected road faces.")
            : failed(`${context.officeConnectedRoadSides}/2 connected road sides on the Camp Office.`);
        }
      }),
      makeObjective({
        id: "early-13",
        round: "early",
        name: "Branching Out",
        description: "Score for using at least 2 intersection-type landscape tiles.",
        points: 4,
        evaluate: (context) => {
          return context.intersectionCount >= 2
            ? passed(4, `${context.intersectionCount} intersection-style landscape tiles are in play.`)
            : failed(`${context.intersectionCount}/2 intersection-style landscapes placed.`);
        }
      }),
      makeObjective({
        id: "early-14",
        round: "early",
        name: "Smooth Arrival",
        description: "Score for Entrance feeding into a clean connected road spine.",
        points: 4,
        evaluate: (context) => {
          return context.entranceSpineLength >= 4
            ? passed(4, `The entrance road stays clean for ${context.entranceSpineLength} tiles before branching.`)
            : failed(`${context.entranceSpineLength}/4 tiles in the current entrance road spine.`);
        }
      }),
      makeObjective({
        id: "early-15",
        round: "early",
        name: "Wooded Retreat",
        description: "Score for clustering Rustic Tent Forest tiles together.",
        points: 4,
        evaluate: (context) => {
          return context.rusticClusterSize >= 2
            ? passed(4, `Rustic tents form a cluster of ${context.rusticClusterSize}.`)
            : failed("Place at least two Rustic Tent Forest tiles adjacent to each other.");
        }
      }),
      makeObjective({
        id: "early-16",
        round: "early",
        name: "Community Spot",
        description: "Score for placing Event Pavilion near Group Site or multiple campsites.",
        points: 4,
        evaluate: (context) => {
          const pavilion = getCellsByType(context, "event_pavilion").find((cell) => {
            return countNearbyCells(context, cell, (other) => other.campTile.typeId === "group_site", 1) >= 1
              || countNearbyCells(context, cell, isCampsiteCell, 1) >= 2;
          });
          return pavilion
            ? passed(4, "The Event Pavilion is serving a strong nearby camp cluster.")
            : failed("Put Event Pavilion beside a Group Site or two nearby campsites.");
        }
      }),
      makeObjective({
        id: "early-17",
        round: "early",
        name: "Weekend Setup",
        description: "Score for placing at least 6 total camp tiles this round.",
        points: 5,
        evaluate: (context) => {
          return context.placementsThisRound >= 6
            ? passed(5, `${context.placementsThisRound} camp tiles were placed this round.`)
            : failed(`${context.placementsThisRound}/6 camp tiles placed this round.`);
        }
      }),
      makeObjective({
        id: "early-18",
        round: "early",
        name: "Kid Camp",
        description: "Score for Group Site plus Playground plus Firewood.",
        points: 6,
        evaluate: (context) => {
          const complete = ["group_site", "playground", "firewood"].every((typeId) => getTypeCount(context, typeId) >= 1);
          return complete
            ? passed(6, "Group Site, Playground, and Firewood are all online.")
            : failed("You need a Group Site, Playground, and Firewood.");
        }
      }),
      makeObjective({
        id: "early-19",
        round: "early",
        name: "Practical Camping",
        description: "Score for at least 1 Tent Site with Electric Hookup and 2 Rustic Tent Forest tiles.",
        points: 5,
        evaluate: (context) => {
          const electricCount = getTypeCount(context, "tent_electric");
          const rusticCount = getTypeCount(context, "rustic_tent_forest");
          return electricCount >= 1 && rusticCount >= 2
            ? passed(5, "Comfort tents and rustic tents are both represented.")
            : failed(`${electricCount}/1 electric tent and ${rusticCount}/2 rustic tents placed.`);
        }
      }),
      makeObjective({
        id: "early-20",
        round: "early",
        name: "Well Planned Grounds",
        description: "Score for a fully connected starting campground layout with no isolated tile sections.",
        points: 6,
        evaluate: (context) => {
          return context.allLandscapeConnected && context.allRoadCellsReachEntrance && context.officeDistance > 0
            ? passed(6, "The campground foundation is fully connected and organized.")
            : failed("Keep every landscape section connected and linked back to the Entrance.");
        }
      })
    ];
  }

  function createMidSummerObjectives() {
    return [
      makeObjective({
        id: "mid-01",
        round: "mid",
        name: "Beat the Heat",
        description: "Score for placing a Pool adjacent to at least 2 campsite tiles.",
        points: 5,
        evaluate: (context) => {
          const pool = findCellByTypeWithNearby(context, "pool", isCampsiteCell, 1, 2);
          return pool
            ? passed(5, "A Pool is serving at least two nearby campsite tiles.")
            : failed("Place a Pool next to at least two campsites.");
        }
      }),
      makeObjective({
        id: "mid-02",
        round: "mid",
        name: "Sweet Summer Stop",
        description: "Score for Ice Cream Vending near a central traffic area.",
        points: 5,
        evaluate: (context) => {
          const match = getCellsByType(context, "ice_cream_vending").find((cell) => context.isCentralTrafficCell(cell.row, cell.col));
          return match
            ? passed(5, "Ice Cream Vending is placed in a central traffic zone.")
            : failed("Place Ice Cream Vending in the center lane or beside a busy road hub.");
        }
      }),
      makeObjective({
        id: "mid-03",
        round: "mid",
        name: "Wheels Ready",
        description: "Score for Bike Rental connected to a long road.",
        points: 5,
        evaluate: (context) => {
          const match = getCellsByType(context, "bike_rental").find((cell) => context.getRoadComponentSizeForCell(cell.row, cell.col) >= 6);
          return match
            ? passed(5, "Bike Rental sits on a long connected road corridor.")
            : failed("Bike Rental needs to sit on a road component of at least 6 tiles.");
        }
      }),
      makeObjective({
        id: "mid-04",
        round: "mid",
        name: "Paddle Out",
        description: "Score for Canoe Rental paired with Waterfront Site.",
        points: 6,
        evaluate: (context) => {
          const match = getCellsByType(context, "canoe_rental").find((cell) =>
            countNearbyCells(context, cell, (other) => other.campTile.typeId === "waterfront_site", 2) >= 1
          );
          return match
            ? passed(6, "Canoe Rental is paired with a nearby Waterfront Site.")
            : failed("Place Canoe Rental within two spaces of a Waterfront Site.");
        }
      }),
      makeObjective({
        id: "mid-05",
        round: "mid",
        name: "Packed Season",
        description: "Score for reaching 8 total campsite tiles.",
        points: 5,
        evaluate: (context) => {
          return context.campsiteCount >= 8
            ? passed(5, "Eight or more campsite or lodging tiles are developed.")
            : failed(`${context.campsiteCount}/8 campsite or lodging tiles placed.`);
        }
      }),
      makeObjective({
        id: "mid-06",
        round: "mid",
        name: "RV Weekend",
        description: "Score for placing 2 RV Sites legally.",
        points: 6,
        evaluate: (context) => {
          const legalRvCount = getCellsByType(context, "rv_full_hookups").filter((cell) => cell.landscapeInfo.roadEdgeCount >= 2).length;
          return legalRvCount >= 2
            ? passed(6, "Two properly road-served RV sites are operating.")
            : failed(`${legalRvCount}/2 legal RV sites placed.`);
        }
      }),
      makeObjective({
        id: "mid-07",
        round: "mid",
        name: "Hookup Demand",
        description: "Score for having at least 2 Tent Sites with Electric Hookup.",
        points: 5,
        evaluate: (context) => {
          const count = getTypeCount(context, "tent_electric");
          return count >= 2
            ? passed(5, "Electric tent demand is being met.")
            : failed(`${count}/2 electric tent sites placed.`);
        }
      }),
      makeObjective({
        id: "mid-08",
        round: "mid",
        name: "Summer Activity Hub",
        description: "Score for placing 3 different amenities.",
        points: 5,
        evaluate: (context) => {
          return context.uniqueAmenityCount >= 3
            ? passed(5, `${context.uniqueAmenityCount} amenity types are active.`)
            : failed(`${context.uniqueAmenityCount}/3 different amenities placed.`);
        }
      }),
      makeObjective({
        id: "mid-09",
        round: "mid",
        name: "Campers Everywhere",
        description: "Score for using tiles in all major sections of the board.",
        points: 6,
        evaluate: (context) => {
          return context.developedQuadrantCount >= 4
            ? passed(6, "All four major board sections have developed camp tiles.")
            : failed(`${context.developedQuadrantCount}/4 major board sections are developed.`);
        }
      }),
      makeObjective({
        id: "mid-10",
        round: "mid",
        name: "Main Road Traffic",
        description: "Score for a long continuous road serving many camp tiles.",
        points: 6,
        evaluate: (context) => {
          return context.longestRoadLength >= 8 && context.roadServedCampCount >= 4
            ? passed(6, "A long road backbone is serving at least four camp tiles.")
            : failed(`Need a road length of 8 and at least 4 road-served camp tiles. Currently ${context.longestRoadLength} and ${context.roadServedCampCount}.`);
        }
      }),
      makeObjective({
        id: "mid-11",
        round: "mid",
        name: "Splash and Stay",
        description: "Score for Pool plus nearby Cabin or premium site.",
        points: 6,
        evaluate: (context) => {
          const pool = getCellsByType(context, "pool").find((cell) =>
            countNearbyCells(context, cell, (other) => isPremiumCampCell(other), 2) >= 1
          );
          return pool
            ? passed(6, "A Pool is paired with nearby premium lodging.")
            : failed("Pair a Pool with a nearby Cabin, Waterfront Site, RV site, or Horse Riding tile.");
        }
      }),
      makeObjective({
        id: "mid-12",
        round: "mid",
        name: "Family Favorite",
        description: "Score for Playground near Group Site and Tent Site.",
        points: 6,
        evaluate: (context) => {
          const playground = getCellsByType(context, "playground").find((cell) => {
            return countNearbyCells(context, cell, (other) => other.campTile.typeId === "group_site", 2) >= 1
              && countNearbyCells(context, cell, (other) => isTentLikeCell(other), 2) >= 1;
          });
          return playground
            ? passed(6, "A Playground is serving both a Group Site and nearby tent camping.")
            : failed("Place Playground within two spaces of both a Group Site and a tent-based campsite.");
        }
      }),
      makeObjective({
        id: "mid-13",
        round: "mid",
        name: "Popular Pavilion",
        description: "Score for Event Pavilion adjacent to multiple occupied camp areas.",
        points: 5,
        evaluate: (context) => {
          const pavilion = findCellByTypeWithNearby(context, "event_pavilion", isAnyDevelopedCampCell, 1, 2);
          return pavilion
            ? passed(5, "The Event Pavilion is next to multiple active camp tiles.")
            : failed("Place Event Pavilion orthogonally next to at least two developed camp tiles.");
        }
      }),
      makeObjective({
        id: "mid-14",
        round: "mid",
        name: "Active Campground",
        description: "Score for Bike Rental plus Hiking Trail.",
        points: 5,
        evaluate: (context) => {
          return getTypeCount(context, "bike_rental") >= 1 && getTypeCount(context, "hiking_trail") >= 1
            ? passed(5, "Bike Rental and Hiking Trail are both active.")
            : failed("You need both Bike Rental and Hiking Trail.");
        }
      }),
      makeObjective({
        id: "mid-15",
        round: "mid",
        name: "Full Swing",
        description: "Score for placing at least 7 camp tiles during Mid Summer.",
        points: 6,
        evaluate: (context) => {
          return context.placementsThisRound >= 7
            ? passed(6, `${context.placementsThisRound} camp tiles were placed this round.`)
            : failed(`${context.placementsThisRound}/7 camp tiles placed during Mid Summer.`);
        }
      }),
      makeObjective({
        id: "mid-16",
        round: "mid",
        name: "Busy Utility Loop",
        description: "Score for a road system with at least 2 branching hubs.",
        points: 5,
        evaluate: (context) => {
          return context.roadHubCount >= 2
            ? passed(5, `${context.roadHubCount} road hubs are creating a busy utility network.`)
            : failed(`${context.roadHubCount}/2 road hubs currently active.`);
        }
      }),
      makeObjective({
        id: "mid-17",
        round: "mid",
        name: "Adventure Weekend",
        description: "Score for Canoe Rental, Bike Rental, and Hiking Trail all present.",
        points: 7,
        evaluate: (context) => {
          const complete = ["canoe_rental", "bike_rental", "hiking_trail"].every((typeId) => getTypeCount(context, typeId) >= 1);
          return complete
            ? passed(7, "Canoe Rental, Bike Rental, and Hiking Trail are all operating.")
            : failed("You need Canoe Rental, Bike Rental, and Hiking Trail.");
        }
      }),
      makeObjective({
        id: "mid-18",
        round: "mid",
        name: "Big Rig Friendly",
        description: "Score for RV Sites connected to strong road access.",
        points: 6,
        evaluate: (context) => {
          const strongCount = getCellsByType(context, "rv_full_hookups").filter((cell) => cell.landscapeInfo.roadEdgeCount >= 2).length;
          return strongCount >= 2
            ? passed(6, "At least two RV sites sit on strong road access parcels.")
            : failed(`${strongCount}/2 RV sites with strong road access.`);
        }
      }),
      makeObjective({
        id: "mid-19",
        round: "mid",
        name: "Cooling Off",
        description: "Score for Pool, Ice Cream Vending, or Waterfront combinations.",
        points: 5,
        evaluate: (context) => {
          const present = [
            getTypeCount(context, "pool") >= 1,
            getTypeCount(context, "ice_cream_vending") >= 1,
            getTypeCount(context, "waterfront_site") >= 1
          ].filter(Boolean).length;
          return present >= 2
            ? passed(5, "At least two cooling attractions are active.")
            : failed(`${present}/2 cooling attractions currently present.`);
        }
      }),
      makeObjective({
        id: "mid-20",
        round: "mid",
        name: "Peak Season Layout",
        description: "Score for building a dense, highly connected campground in the center of the map.",
        points: 7,
        evaluate: (context) => {
          return context.centerCampCount >= 4 && context.centerRoadServedCampCount >= 3
            ? passed(7, "The center of camp is dense and well connected.")
            : failed(`Need 4 center camp tiles and 3 of them road-served. Currently ${context.centerCampCount} and ${context.centerRoadServedCampCount}.`);
        }
      })
    ];
  }

  function createLateSummerObjectives() {
    return [
      makeObjective({
        id: "late-01",
        round: "late",
        name: "Cabin Country",
        description: "Score for placing 3 Cabins.",
        points: 6,
        evaluate: (context) => {
          const count = getTypeCount(context, "cabin");
          return count >= 3
            ? passed(6, "Three or more Cabins are ready for guests.")
            : failed(`${count}/3 Cabins placed.`);
        }
      }),
      makeObjective({
        id: "late-02",
        round: "late",
        name: "Lakeside Premium",
        description: "Score for placing 2 Waterfront Sites.",
        points: 6,
        evaluate: (context) => {
          const count = getTypeCount(context, "waterfront_site");
          return count >= 2
            ? passed(6, "At least two Waterfront Sites are developed.")
            : failed(`${count}/2 Waterfront Sites placed.`);
        }
      }),
      makeObjective({
        id: "late-03",
        round: "late",
        name: "Deluxe Weekend",
        description: "Score for Cabin plus Waterfront plus amenity support.",
        points: 7,
        evaluate: (context) => {
          const hasCabin = getTypeCount(context, "cabin") >= 1;
          const hasWaterfront = getTypeCount(context, "waterfront_site") >= 1;
          const supported = context.campCells.some((cell) => {
            if (cell.campTile.typeId !== "cabin" && cell.campTile.typeId !== "waterfront_site") {
              return false;
            }
            return countNearbyCells(context, cell, (other) => isAmenityCell(other), 2) >= 1;
          });
          return hasCabin && hasWaterfront && supported
            ? passed(7, "Cabin and Waterfront lodging both have nearby amenity support.")
            : failed("You need at least one Cabin, one Waterfront Site, and nearby amenity support.");
        }
      }),
      makeObjective({
        id: "late-04",
        round: "late",
        name: "Luxury Lane",
        description: "Score for premium sites arranged along a strong road.",
        points: 7,
        evaluate: (context) => {
          return context.longestAlignedPremiumRun >= 3
            ? passed(7, `A premium roadside run of ${context.longestAlignedPremiumRun} tiles is active.`)
            : failed(`${context.longestAlignedPremiumRun}/3 premium camp tiles aligned along a strong road.`);
        }
      }),
      makeObjective({
        id: "late-05",
        round: "late",
        name: "End-of-Season Escape",
        description: "Score for having 10 or more total campsite / lodging tiles.",
        points: 7,
        evaluate: (context) => {
          return context.campsiteCount >= 10
            ? passed(7, "Ten or more campsite or lodging tiles are ready for guests.")
            : failed(`${context.campsiteCount}/10 campsite or lodging tiles placed.`);
        }
      }),
      makeObjective({
        id: "late-06",
        round: "late",
        name: "Polished Grounds",
        description: "Score for minimizing unused supported spaces in your developed campground.",
        points: 6,
        evaluate: (context) => {
          return context.unusedSupportedSpaces <= 3
            ? passed(6, `Only ${context.unusedSupportedSpaces} supported spaces remain unused.`)
            : failed(`${context.unusedSupportedSpaces} supported spaces are still empty.`);
        }
      }),
      makeObjective({
        id: "late-07",
        round: "late",
        name: "Scenic Ride",
        description: "Score for Horse Riding connected into the road network.",
        points: 6,
        evaluate: (context) => {
          const horse = getCellsByType(context, "horse_riding").find((cell) => isCellConnectedToMainRoad(context, cell.row, cell.col));
          return horse
            ? passed(6, "Horse Riding is connected into the main campground road network.")
            : failed("Place Horse Riding on a scenic parcel with road access.");
        }
      }),
      makeObjective({
        id: "late-08",
        round: "late",
        name: "Premium Cluster",
        description: "Score for 3 higher-value camp tiles grouped together.",
        points: 7,
        evaluate: (context) => {
          return context.premiumClusterSize >= 3
            ? passed(7, `Premium camp tiles form a cluster of ${context.premiumClusterSize}.`)
            : failed(`${context.premiumClusterSize}/3 premium camp tiles in one cluster.`);
        }
      }),
      makeObjective({
        id: "late-09",
        round: "late",
        name: "Camp for Everyone",
        description: "Score for having a good mix of rustic, electric, RV, group, and cabin offerings.",
        points: 7,
        evaluate: (context) => {
          const required = ["rustic_tent_forest", "tent_electric", "rv_full_hookups", "group_site", "cabin"];
          const present = required.filter((typeId) => getTypeCount(context, typeId) >= 1).length;
          return present === required.length
            ? passed(7, "Rustic, electric, RV, group, and cabin options are all available.")
            : failed(`${present}/5 required lodging styles currently represented.`);
        }
      }),
      makeObjective({
        id: "late-10",
        round: "late",
        name: "Longest Route In",
        description: "Score bonus for the longest connected road network.",
        points: 8,
        evaluate: (context) => {
          const score = Math.min(8, Math.floor(context.longestRoadLength / 2));
          return score > 0
            ? passed(score, `Current longest connected route scores ${score} points from a length of ${context.longestRoadLength}.`)
            : failed("Build a longer connected road route to score this card.");
        }
      }),
      makeObjective({
        id: "late-11",
        round: "late",
        name: "Lakeside Leisure",
        description: "Score for Waterfront paired with Canoe Rental or Ice Cream Vending.",
        points: 6,
        evaluate: (context) => {
          const waterfront = getCellsByType(context, "waterfront_site").find((cell) =>
            countNearbyCells(context, cell, (other) => other.campTile.typeId === "canoe_rental" || other.campTile.typeId === "ice_cream_vending", 2) >= 1
          );
          return waterfront
            ? passed(6, "A Waterfront Site is paired with a lakeside leisure amenity.")
            : failed("Put Canoe Rental or Ice Cream Vending within two spaces of a Waterfront Site.");
        }
      }),
      makeObjective({
        id: "late-12",
        round: "late",
        name: "Refined Retreat",
        description: "Score for Cabins near amenities without crowding basic tent areas.",
        points: 7,
        evaluate: (context) => {
          const cabin = getCellsByType(context, "cabin").find((cell) => {
            const amenityNearby = countNearbyCells(context, cell, isAmenityCell, 2) >= 1;
            const tentsTooClose = countNearbyCells(context, cell, (other) => isTentLikeCell(other), 1) >= 1;
            return amenityNearby && !tentsTooClose;
          });
          return cabin
            ? passed(7, "A Cabin has nearby amenities without being crowded by tent camping.")
            : failed("Place a Cabin near amenities and keep basic tent sites out of the immediate one-tile ring.");
        }
      }),
      makeObjective({
        id: "late-13",
        round: "late",
        name: "Premium Hospitality",
        description: "Score for Camp Office supporting a well-developed, higher-end campground.",
        points: 7,
        evaluate: (context) => {
          return context.officeDistance > 0 && context.premiumCount >= 3 && context.uniqueAmenityCount >= 2
            ? passed(7, "The Camp Office now supports a clearly premium campground.")
            : failed(`Need a connected office, 3 premium camp tiles, and 2 amenities. Currently ${context.premiumCount} premium tiles and ${context.uniqueAmenityCount} amenities.`);
        }
      }),
      makeObjective({
        id: "late-14",
        round: "late",
        name: "End of Summer Event",
        description: "Score for Event Pavilion serving a dense developed zone.",
        points: 6,
        evaluate: (context) => {
          const pavilion = getCellsByType(context, "event_pavilion").find((cell) => countNearbyCells(context, cell, isAnyDevelopedCampCell, 2) >= 4);
          return pavilion
            ? passed(6, "An Event Pavilion now anchors a dense developed zone.")
            : failed("Place Event Pavilion within two spaces of at least four developed camp tiles.");
        }
      }),
      makeObjective({
        id: "late-15",
        round: "late",
        name: "Horse Country Getaway",
        description: "Score for Horse Riding near scenic or premium spaces.",
        points: 6,
        evaluate: (context) => {
          const horse = getCellsByType(context, "horse_riding").find((cell) =>
            cell.landscapeInfo.hasScenicTag || countNearbyCells(context, cell, (other) => isPremiumCampCell(other), 2) >= 1
          );
          return horse
            ? passed(6, "Horse Riding is set in a scenic or premium part of camp.")
            : failed("Horse Riding wants scenic terrain or nearby premium camp tiles.");
        }
      }),
      makeObjective({
        id: "late-16",
        round: "late",
        name: "Waterfront Weekend",
        description: "Score for multiple premium waterfront-related placements.",
        points: 7,
        evaluate: (context) => {
          const waterCount = getTypeCount(context, "waterfront_site");
          const support = getTypeCount(context, "canoe_rental") + getTypeCount(context, "ice_cream_vending");
          return waterCount >= 2 && support >= 1
            ? passed(7, "Multiple waterfront placements are supported by leisure amenities.")
            : failed(`Need 2 Waterfront Sites and a supporting leisure amenity. Currently ${waterCount} and ${support}.`);
        }
      }),
      makeObjective({
        id: "late-17",
        round: "late",
        name: "Fully Connected Resort",
        description: "Score for all developed camp tiles having practical road access.",
        points: 8,
        evaluate: (context) => {
          return context.allDevelopedTilesPracticallyAccessible
            ? passed(8, "Every developed camp tile has practical access to the road system.")
            : failed("Make sure every developed camp tile touches a road or sits next to one.");
        }
      }),
      makeObjective({
        id: "late-18",
        round: "late",
        name: "Built Out Season",
        description: "Score for placing at least 7 camp tiles during Late Summer.",
        points: 6,
        evaluate: (context) => {
          return context.placementsThisRound >= 7
            ? passed(6, `${context.placementsThisRound} camp tiles were placed this round.`)
            : failed(`${context.placementsThisRound}/7 camp tiles placed during Late Summer.`);
        }
      }),
      makeObjective({
        id: "late-19",
        round: "late",
        name: "Destination Campground",
        description: "Score for a campground that has activities, lodging variety, and premium options.",
        points: 8,
        evaluate: (context) => {
          return context.uniqueAmenityCount >= 3 && context.uniqueCampsiteTypeCount >= 4 && context.premiumCount >= 3
            ? passed(8, "The campground now feels like a true destination.")
            : failed(`Need 3 amenities, 4 campsite styles, and 3 premium tiles. Currently ${context.uniqueAmenityCount}, ${context.uniqueCampsiteTypeCount}, and ${context.premiumCount}.`);
        }
      }),
      makeObjective({
        id: "late-20",
        round: "late",
        name: "Smore to Explore",
        description: "Signature objective. Score for creating the most balanced and feature-rich final campground with strong variety, amenities, road connectivity, and premium appeal.",
        points: 12,
        evaluate: (context) => {
          let score = 0;
          if (context.uniqueCampsiteTypeCount >= 5) score += 2;
          else if (context.uniqueCampsiteTypeCount >= 4) score += 1;

          if (context.uniqueAmenityCount >= 4) score += 2;
          else if (context.uniqueAmenityCount >= 3) score += 1;

          if (context.longestRoadLength >= 8) score += 2;
          else if (context.longestRoadLength >= 6) score += 1;

          if (context.premiumCount >= 4) score += 2;
          else if (context.premiumCount >= 2) score += 1;

          if (context.centerCampCount >= 4) score += 2;
          else if (context.centerCampCount >= 3) score += 1;

          if (context.uniqueAmenityCount >= 3 && context.uniqueCampsiteTypeCount >= 4 && context.premiumCount >= 3) {
            score += 2;
          } else if (context.uniqueAmenityCount >= 2 && context.uniqueCampsiteTypeCount >= 3) {
            score += 1;
          }

          return score > 0
            ? passed(score, `Balanced final campground score: ${score}/12.`)
            : failed("Build variety, amenities, premium appeal, and a strong connected road spine to score this signature card.");
        }
      })
    ];
  }

  function createDirectorObjectives() {
    return [
      makeObjective({
        id: "director-01",
        round: "director",
        name: "Happy Families",
        description: "Reward family-friendly combinations like Playground, Group Site, Ice Cream Vending, Pool.",
        points: 10,
        evaluate: (context) => {
          const present = ["playground", "group_site", "ice_cream_vending", "pool"].filter((typeId) => getTypeCount(context, typeId) >= 1).length;
          const score = Math.min(10, present * 2 + (present === 4 ? 2 : 0));
          return score > 0
            ? passed(score, `Family attractions currently score ${score}/10.`)
            : failed("Add family-friendly attractions like Playground, Group Site, Ice Cream Vending, and Pool.");
        }
      }),
      makeObjective({
        id: "director-02",
        round: "director",
        name: "Roughing It Right",
        description: "Reward Rustic Tent Forest plus Firewood plus Hiking Trail.",
        points: 9,
        evaluate: (context) => {
          const complete = getTypeCount(context, "rustic_tent_forest") >= 2
            && getTypeCount(context, "firewood") >= 1
            && getTypeCount(context, "hiking_trail") >= 1;
          if (!complete) {
            return failed("Build at least two Rustic Tent Forest sites plus Firewood and Hiking Trail.");
          }
          const bonus = context.rusticClusterSize >= 2 ? 1 : 0;
          return passed(8 + bonus, `Rustic camping support is scoring ${8 + bonus}/9.`);
        }
      }),
      makeObjective({
        id: "director-03",
        round: "director",
        name: "Full Hookup Favorite",
        description: "Reward multiple legal RV placements.",
        points: 9,
        evaluate: (context) => {
          const legalRvCount = getCellsByType(context, "rv_full_hookups").filter((cell) => cell.landscapeInfo.roadEdgeCount >= 2).length;
          const score = Math.min(9, legalRvCount * 3);
          return score > 0
            ? passed(score, `${legalRvCount} legal RV sites currently score ${score}/9.`)
            : failed("Place legal RV sites with strong road access.");
        }
      }),
      makeObjective({
        id: "director-04",
        round: "director",
        name: "The Waterfront Draw",
        description: "Reward Waterfront plus Canoe Rental.",
        points: 10,
        evaluate: (context) => {
          let score = 0;
          if (getTypeCount(context, "waterfront_site") >= 1) score += 5;
          if (getTypeCount(context, "canoe_rental") >= 1) score += 3;
          if (getTypeCount(context, "waterfront_site") >= 2) score += 2;
          return score > 0
            ? passed(score, `Waterfront attractions currently score ${score}/10.`)
            : failed("Develop Waterfront Sites and pair them with Canoe Rental.");
        }
      }),
      makeObjective({
        id: "director-05",
        round: "director",
        name: "Rain or Shine",
        description: "Reward a campground with both rustic and premium options.",
        points: 8,
        evaluate: (context) => {
          const hasRustic = getTypeCount(context, "rustic_tent_forest") >= 1;
          const hasPremium = context.premiumCount >= 1;
          const hasComfort = getTypeCount(context, "cabin") >= 1 || getTypeCount(context, "tent_electric") >= 1;
          if (!hasRustic || !hasPremium) {
            return failed("Mix rustic camping with premium or comfort-focused offerings.");
          }
          return passed(hasComfort ? 8 : 6, hasComfort ? "Rustic and premium comfort are both represented." : "Rustic and premium options are both present.");
        }
      }),
      makeObjective({
        id: "director-06",
        round: "director",
        name: "Smooth Traffic Flow",
        description: "Reward strong connected road layout and multiple road access points.",
        points: 9,
        evaluate: (context) => {
          let score = 0;
          if (context.longestRoadLength >= 7) score += 3;
          if (context.roadHubCount >= 2) score += 3;
          if (context.deadEndRoadCount <= 1) score += 3;
          return score > 0
            ? passed(score, `Road planning currently scores ${score}/9.`)
            : failed("Build a longer, cleaner road network with multiple hubs.");
        }
      }),
      makeObjective({
        id: "director-07",
        round: "director",
        name: "Summer Traditions",
        description: "Reward Event Pavilion, Firewood, and Group Site combinations.",
        points: 10,
        evaluate: (context) => {
          const complete = ["event_pavilion", "firewood", "group_site"].every((typeId) => getTypeCount(context, typeId) >= 1);
          if (!complete) {
            return failed("Build Event Pavilion, Firewood, and at least one Group Site.");
          }
          const combo = getCellsByType(context, "event_pavilion").some((cell) =>
            countNearbyCells(context, cell, (other) => other.campTile.typeId === "group_site", 2) >= 1
            && countNearbyCells(context, cell, (other) => other.campTile.typeId === "firewood", 2) >= 1
          );
          return passed(combo ? 10 : 8, combo ? "The campground's summer traditions all cluster together nicely." : "The full traditions package is present.");
        }
      }),
      makeObjective({
        id: "director-08",
        round: "director",
        name: "Something for Everyone",
        description: "Reward diversity of camp tile types.",
        points: 10,
        evaluate: (context) => {
          const score = Math.min(10, context.uniqueCampsiteTypeCount * 2);
          return score > 0
            ? passed(score, `Campsite variety currently scores ${score}/10.`)
            : failed("Develop a wider mix of campsite and lodging styles.");
        }
      }),
      makeObjective({
        id: "director-09",
        round: "director",
        name: "Comfort Upgrade",
        description: "Reward Cabins, electric tent sites, and premium amenities.",
        points: 10,
        evaluate: (context) => {
          let score = 0;
          if (getTypeCount(context, "cabin") >= 1) score += 3;
          if (getTypeCount(context, "tent_electric") >= 1) score += 3;
          if (getTypeCount(context, "pool") >= 1 || getTypeCount(context, "ice_cream_vending") >= 1 || getTypeCount(context, "bathrooms") >= 1) score += 4;
          return score > 0
            ? passed(score, `Comfort upgrades currently score ${score}/10.`)
            : failed("Build Cabins, electric tent sites, and a premium support amenity.");
        }
      }),
      makeObjective({
        id: "director-10",
        round: "director",
        name: "Destination Status",
        description: "Reward a mature final layout with strong variety, attractions, and connectivity.",
        points: 12,
        evaluate: (context) => {
          let score = 0;
          if (context.uniqueCampsiteTypeCount >= 4) score += 3;
          if (context.uniqueAmenityCount >= 3) score += 3;
          if (context.longestRoadLength >= 7) score += 3;
          if (context.premiumCount >= 3) score += 3;
          return score > 0
            ? passed(score, `Destination status currently scores ${score}/12.`)
            : failed("Grow the campground into a varied, connected, premium destination.");
        }
      })
    ];
  }

  window.SmoreObjectiveFactory = {
    createDirectorObjectives,
    createEarlySummerObjectives,
    createLateSummerObjectives,
    createMidSummerObjectives
  };
})();
