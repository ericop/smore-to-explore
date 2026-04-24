# Smore to Explore

## Printable Rulebook

Smore to Explore is a pass-and-play campground-building board game for 2 to 5 players. Each player builds a separate campground on an 8 x 5 board, but everyone shares the same contractor market and the same public seasonal goals.

This rulebook follows the current coded rules in the digital prototype. When the physical version needs a decision the code does not fully define, that item appears at the end in `Rules Needing Confirmation`.

---

## 1. Components Included

### Shared Components

- 1 contractor market display with 6 columns and 8 visible spaces in each column
- 20 Early Summer goal cards
- 20 Mid Summer goal cards
- 22 Late Summer goal cards
- 10 Camp Director goal cards
- Money tokens or paper money: `TODO: verify denominations and quantity`
- Score pad or score track with markers: `TODO: verify physical format`
- First-player marker: optional but helpful

### Per Player

- 1 campground board with an 8 columns by 5 rows grid
- 1 player aid or Camp Director reminder card: optional
- 1 score marker if you are using a shared score track
- 1 money reserve
- 10 starting landscape tiles:
  - 1 Entrance to Camp
  - 1 Camp Office
  - 4 Straight Road
  - 2 Road Turn
  - 1 Four-Way Cross
  - 1 Three-Way Split

### Expansion Landscape Tiles

Each player receives 8 new landscape tiles at the start of Mid Summer and 8 more at the start of Late Summer. The code draws those from weighted pools instead of a fixed physical stack, so the physical pool count is not fully locked.

- Road-heavy expansion pool: `TODO: verify physical count`
- Water-edge expansion pool: `TODO: verify physical count`
- Scenic and forest expansion pool: `TODO: verify physical count`

### Market Tiles

The digital game refills the market from weighted tile pools instead of depleting a fixed supply. The weights below are useful for a first physical print run, but they are not yet confirmed as final finite counts.

#### Camp market weights in code

- Rustic Tent Forest x5 `TODO: verify physical supply`
- Tent Site with Electric Hookup x5 `TODO: verify physical supply`
- RV Site with Full Hookups x5 `TODO: verify physical supply`
- Group Site x5 `TODO: verify physical supply`
- Cabin x5 `TODO: verify physical supply`
- Waterfront Site x5 `TODO: verify physical supply`
- Horse Riding x2 `TODO: verify physical supply`

#### Amenity market weights in code

- Firewood x2 `TODO: verify physical supply`
- Pool x2 `TODO: verify physical supply`
- Bike Rental x2 `TODO: verify physical supply`
- Canoe Rental x2 `TODO: verify physical supply`
- Event Pavilion x2 `TODO: verify physical supply`
- Hiking Trail x2 `TODO: verify physical supply`
- Ice Cream Vending x2 `TODO: verify physical supply`
- Playground x2 `TODO: verify physical supply`
- Bathrooms x4 `TODO: verify physical supply`

> [!IMPORTANT]
> The digital market behaves like a public display that refills from weighted pools. A printed edition will need a final decision on whether the supply is finite, bag-drawn, or deck-based.

---

## 2. Game Overview

You are building the most successful campground over three summers:

1. Expand your board with landscape tiles.
2. Hire contractors from the shared market.
3. Place campsites, lodging, and amenities onto legal parcels.
4. Score seasonal goals at the end of each summer.
5. Score Camp Director goals after Late Summer.

The winner is the player with the most total points after final scoring.

The game supports 2 to 5 players. The code uses the same starting resources and board size for every supported player count.

---

## 3. Setup

### Standard Setup For 2 To 5 Players

1. Give each player a campground board.
2. Give each player $100,000.
3. Give each player the same 10 starting landscape tiles.
4. Shuffle the Early Summer, Mid Summer, Late Summer, and Camp Director goal decks separately.
5. Reveal 4 Early Summer goals.
6. Keep the Camp Director deck face down for now.
7. Fill the shared contractor market:
   - 2 amenity columns
   - 4 camp columns
   - 8 visible spaces in each column
8. Decide player order.
9. The first player begins the Landscape Tile Phase of Early Summer.

### Player Count Scaling

The current code does not change money, board size, starting tiles, or goal count based on player count.

- 2 players: same setup, faster market cycling
- 3 players: same setup, recommended for learning
- 4 players: same setup, tighter market pressure
- 5 players: same setup, most crowded market race

### Example Setup For 3 Players

Use this example throughout the rulebook:

- Eric is first player.
- Chris is second player.
- Eliana is third player.

All three players begin with:

- $100,000
- an empty 8 x 5 campground board
- the same 10 starting landscape tiles

The table also has:

- 4 revealed Early Summer goals
- a full 6-column contractor market
- facedown Mid Summer, Late Summer, and Camp Director goal decks

### Example Setup Diagram

```text
Shared Area
+----------------------+  +-----------------------+
| Early Summer Goals x4|  | Contractor Market 6x8|
+----------------------+  +-----------------------+

Players in Order
1. Eric    -> empty 8x5 board + $100,000 + 10 starting landscape tiles
2. Chris   -> empty 8x5 board + $100,000 + 10 starting landscape tiles
3. Eliana  -> empty 8x5 board + $100,000 + 10 starting landscape tiles
```

> [!IMPORTANT]
> The first player is not randomized by code. The physical game should choose a starting player before setup is finished.

---

## 4. How A Summer Works

Each Summer has 3 parts:

1. Landscape Tile Phase
2. Market Tile Phase
3. Goal Scoring Phase

### 1. Landscape Tile Phase

Players place every landscape tile currently in their hand before the market opens.

- Early Summer: each player places 10 starting landscape tiles
- Mid Summer: each player places 8 expansion landscape tiles and gains $50,000
- Late Summer: each player places 8 expansion landscape tiles and gains $50,000

### 2. Market Tile Phase

Players take turns buying from the shared contractor market, placing purchased tiles, or passing.

- Every market tile costs $10,000
- If you buy deeper in a column, you buy every tile above it too
- You must place the purchased stack from top to bottom
- If you have selected a stack and have not placed any of its tiles yet, you may cancel that purchase
- When every player has passed, the Summer ends

### 3. Goal Scoring Phase

- Every player scores the 4 currently active public seasonal goals
- After Early Summer only, reveal 3 Camp Director goals
- After Late Summer, score the 3 Camp Director goals and end the game

### Running Example

- Eric places a Road Turn to connect his Entrance to a future office lane.
- Chris buys from the shared market and places a Playground beside a road parcel.
- Eliana finishes the round with 3 Rustic Tent Forest tiles, so she scores `Tents in the Pines` if that goal is active.

---

## 5. Landscape Tile Phase

Landscape tiles form the ground layer of your campground. Campsites and amenities may only be built on top of already-placed landscape parcels.

### How Landscape Tiles Are Chosen

You do not draft landscape tiles during the phase. You already have them in hand.

- In Early Summer each player starts with 10 fixed tiles.
- In Mid Summer and Late Summer each player receives 8 new expansion tiles drawn from the code's weighted expansion pools.

### Rotation

Landscape tiles may be rotated before placement. Rotation matters because road edges, water edges, and the Entrance gate all care about direction.

### Legal Landscape Placement Rules

A landscape tile is legal only if all of the following are true:

1. The tile is fully inside your 8 x 5 board.
2. It does not overlap another landscape tile.
3. If it is your very first placement, it must be the Entrance tile.
4. The Entrance gate must face the outer border of the board.
5. After the first tile, every new landscape tile must touch your existing campground orthogonally.
6. Road edges must meet matching road edges.
7. An open edge cannot crash into an existing road edge.
8. If the tile has a road on it and it is not the Entrance, it should connect into your current road network as placed.

### End Of Landscape Phase Requirements

You cannot finish the phase unless:

- the Entrance is on the board
- the Camp Office is on the board
- all placed landscape tiles form one connected shape
- every road tile connects back to the Entrance road network
- the Camp Office connects to the Entrance by road

### Terrain Notes

- Forest Nook counts as forest and scenic terrain
- Scenic Meadow counts as scenic terrain
- Lakeside tiles provide water-edge terrain
- Road tiles can also carry water or scenic value depending on tile type

### Legal Placement Example

```text
Legal road match

[Gate south]
    |
[Road Straight]
```

The Entrance road meets the Straight Road road edge, so this is legal.

### Illegal Placement Example

```text
Illegal road crash

[Road Straight] [Scenic Meadow]
      road  ->     open
```

A road edge is pointing into an open edge, so the placement is illegal.

### Water Placement Example

```text
Water edge layout

[Road Turn] [Lakeside Meadow]
             ~~~~~~~~~~~~~~~
```

The Lakeside Meadow creates a legal water-edge parcel for later tiles like Canoe Rental or part of a Waterfront Site.

> [!IMPORTANT]
> Road edges may not run off the board. The only special edge that may face out of the campground is the Entrance gate.

---

## 6. Market Tile Phase

After every player finishes placing landscape tiles for the Summer, the contractor market opens.

### How Market Purchases Work

On your turn you may:

- buy from one market column
- place the purchased tile or stack
- or pass for the rest of the current Summer

If you select the top tile in a column, you buy 1 tile.

If you select a deeper tile, you buy that tile and every tile above it in the same column. You pay the full cost up front:

- 1 tile = $10,000
- 2 tiles = $20,000
- 3 tiles = $30,000
- and so on

You then place the stack in top-down order.

### Canceling A Purchase

If you selected a stack by mistake, you may cancel it only if you have not placed any tile from that stack yet.

This lets a player back out of an accidental tap or an impossible choice before any part of the purchase has been committed.

### Market Placement Rules For All Market Tiles

A market tile must:

1. be placed on an existing landscape parcel
2. stay inside the board
3. avoid the Entrance parcel
4. avoid the Camp Office parcel
5. avoid overlap with any already placed camp tile
6. satisfy its own tile-specific placement rule

### Single-Square Market Items

Most market items occupy exactly 1 square.

Examples:

- Rustic Tent Forest
- Tent Site with Electric Hookup
- Cabin
- Firewood
- Pool
- Bike Rental
- Canoe Rental
- Hiking Trail
- Ice Cream Vending
- Playground
- Bathrooms

### Big Market Items

The following market items are `big market items` in code and always occupy exactly 2 campground squares:

- RV Site with Full Hookups
- Group Site
- Waterfront Site
- Horse Riding
- Event Pavilion

### Big Market Item Preview And Rotation

When you select a big market item and click a square, the game previews a two-square placement automatically.

#### Horizontal preview

- default: clicked square plus the square to its left
- if left is off-board or invalid because you clicked the left edge, the preview uses the square to the right instead
- if you click the right edge, the preview uses the square to the left

#### Vertical preview

- default: clicked square plus the square above it
- if above is off-board or invalid because you clicked the top edge, the preview uses the square below instead
- if you click the bottom edge, the preview uses the square above

The Rotate button flips the selected big market item between horizontal and vertical. The preview updates immediately.

### Big Market Item Placement Rules

A big market item is legal only if both occupied squares:

- are inside the board
- already contain landscape tiles
- are open
- are not the Entrance or Camp Office
- meet that tile's specific terrain and road requirements

### Waterfront Site Special Rule

Waterfront Site is a big market item with one extra check:

- at least 1 of its 2 occupied squares must be on a water-edge landscape parcel

The other half does not have to be on water, but it still has to be a legal open parcel.

### Market Examples

#### Horizontal big market item

```text
[ RV ][ RV ]
```

#### Vertical big market item

```text
[Group]
[Group]
```

#### Waterfront example

```text
[Waterfront][Waterfront]
~~~~~~~~~~~~
```

At least one half is on a water-edge parcel, so this can be legal if both squares also meet the normal placement rules.

#### Illegal overlap example

```text
[Cabin][Playground]
      [ RV ]
```

The RV Site would overlap an occupied parcel, so the placement is illegal.

> [!IMPORTANT]
> A big market item is not legally placed unless both squares are valid.

### Tile-Specific Placement Summary

#### Needs at least 1 road edge on every occupied square

- Tent Site with Electric Hookup
- Group Site
- Cabin
- Pool
- Bike Rental
- Event Pavilion
- Ice Cream Vending
- Playground

#### Needs at least 2 road edges on every occupied square

- RV Site with Full Hookups
- Bathrooms

#### Needs water-edge support

- Canoe Rental: the tile itself must be on a water-edge parcel
- Waterfront Site: at least 1 of its 2 squares must be on a water-edge parcel

#### Needs scenic, forest, or board-edge support

- Hiking Trail
- Horse Riding, on both halves

#### Flexible but still restricted

- Firewood: must have practical road access or scenic support
- Rustic Tent Forest: may use almost any normal landscape parcel

### Market Phase Example

Chris taps the third tile down in a camp column. He buys 3 tiles for $30,000. The top tile is a Group Site, so he must place that first. Because Group Site is a big market item, he uses the preview and Rotate button to find two legal road-served parcels. He places it, then continues with the rest of the stack.

---

## 7. Goal Scoring Phase

### How Seasonal Scoring Works

At the end of each Summer:

- every player checks the 4 active public goals for that Summer
- every player may score every active goal they satisfy
- points are added immediately to the running total

After Early Summer only:

- reveal 3 Camp Director goals

After Late Summer:

- score the 4 active Late Summer goals
- then score the 3 revealed Camp Director goals
- highest total score wins

### Important Scoring Terms

- `Adjacent` means orthogonally adjacent only: up, down, left, or right.
- `Within 2 spaces` uses Manhattan distance.
- `Connected to the main road` means on or next to the Entrance road network, depending on the goal check.
- `Campsite or lodging` means Rustic Tent Forest, Tent Site with Electric Hookup, RV Site with Full Hookups, Group Site, Cabin, or Waterfront Site.
- `Premium` means any tile with the premium tag in code. That includes RV Site with Full Hookups, Cabin, Waterfront Site, Horse Riding, Pool, and Ice Cream Vending.
- Big market items count as one placed market item for type-counting goals, but both occupied squares matter for distance and adjacency checks.

> [!IMPORTANT]
> A goal only scores if it is one of the 4 revealed goals for the current Summer, or one of the 3 revealed Camp Director goals at the end of the game.

### Early Summer Goals

These score only at the end of Early Summer. The game contains 20 Early Summer goals, but only 4 are revealed in a given play.

| Goal | Points | Plain-English Rule | Tiles That Matter | Clarification |
| --- | --- | --- | --- | --- |
| Scout Arrival | 5 | Have 2 Group Sites connected to the main road network. | Group Site | The sites do not need to touch each other. |
| Glamor Guests | 4 | Have at least 1 premium guest stay tile. | Cabin, RV Site, Waterfront Site | Pool and Ice Cream are premium, but this goal only checks those 3 stay tiles. |
| Organized Check-In | 4 | Connect the Camp Office to the Entrance in 5 road steps or fewer. | Camp Office, Entrance, road tiles | Disconnected or longer than 5 fails. |
| Fire Circle Friends | 4 | Put Firewood orthogonally next to at least 2 campsite or lodging tiles. | Firewood plus any campsites/lodging | Diagonals do not count. |
| Tents in the Pines | 4 | Have at least 3 Rustic Tent Forest tiles. | Rustic Tent Forest | They can be anywhere. Forest placement is not required by the goal. |
| Beginner's Loop | 5 | Build any closed road loop. | road tiles | One loop anywhere is enough. |
| Easy Access | 5 | Finish with 0 dead-end road tiles. | road tiles | Entrance and Office are ignored for this check. |
| Family Meet-Up | 4 | Have at least 1 Group Site and 1 Playground. | Group Site, Playground | No adjacency needed. |
| Camp Basics | 4 | Have at least 2 different amenity types. | amenities | Horse Riding does not count because it is not coded as an amenity. |
| Trailhead Start | 4 | Put Hiking Trail within 1 space of the Entrance or Camp Office. | Hiking Trail, Entrance, Office | In practice that means orthogonally adjacent. |
| Tent Row | 5 | Create a straight row or column of 3 campsite or lodging tiles with real road continuity under them. | campsite and lodging tiles | The camps do not need to match. |
| Busy Office | 4 | Give the Camp Office at least 2 connected road sides. | Camp Office and road tiles | Printed edges alone do not count if they do not connect. |
| Branching Out | 4 | Place at least 2 intersection landscape tiles. | Four-Way Cross, Three-Way Split | Location does not matter. |
| Welcome Row | 4 | Have at least 2 campsite or lodging tiles connected to the Entrance road network. | campsite and lodging tiles | Each one is checked separately. |
| Wooded Retreat | 4 | Build a Rustic Tent Forest cluster of size 2 or more. | Rustic Tent Forest | Orthogonal touching only. |
| Community Spot | 4 | Put Event Pavilion next to a Group Site or next to at least 2 campsite/lodging tiles. | Event Pavilion, Group Site, campsites/lodging | One legal Pavilion is enough. |
| Opening Weekend | 5 | Place at least 3 market tiles during Early Summer. | any market tiles | This is a round placement count, not a board total. |
| Kid Camp | 6 | Have Group Site, Playground, and Firewood. | Group Site, Playground, Firewood | No adjacency needed. |
| Practical Camping | 5 | Have 1 Tent Site with Electric Hookup and 2 Rustic Tent Forest tiles. | Tent Electric, Rustic Tent Forest | The 3 tiles can be anywhere. |
| Well Planned Grounds | 6 | End with one connected landscape, all road cells tied to the Entrance, and the Camp Office connected. | landscape and road network | Fails if any road island or disconnected office exists. |

#### Example

Eric has 3 Rustic Tent Forest tiles and 1 Tent Site with Electric Hookup. If `Tents in the Pines` and `Practical Camping` are both active, he scores both goals even if the tents are not near one another.

### Mid Summer Goals

These score only at the end of Mid Summer. The game contains 20 Mid Summer goals, but only 4 are revealed in a given play.

| Goal | Points | Plain-English Rule | Tiles That Matter | Clarification |
| --- | --- | --- | --- | --- |
| Beat the Heat | 5 | Put a Pool orthogonally next to at least 2 campsite or lodging tiles. | Pool plus campsite/lodging | Diagonals do not count. |
| Sweet Summer Stop | 5 | Place Ice Cream Vending in the center zone or on a road hub. | Ice Cream Vending | The code treats a central traffic cell as center-zone or a 3-way road hub. |
| Wheels Ready | 5 | Put Bike Rental on or next to a connected road component of size 6 or more. | Bike Rental and roads | The road may be under the tile or beside it. |
| Paddle Out | 6 | Put Canoe Rental within 2 spaces of a Waterfront Site. | Canoe Rental, Waterfront Site | Manhattan distance only. |
| Packed Season | 5 | Have at least 8 campsite or lodging tiles. | campsite/lodging | Amenities do not count. |
| RV Weekend | 6 | Have at least 2 legal RV Sites. | RV Site with Full Hookups | The occupied parcels must each have at least 2 road edges. |
| Hookup Demand | 5 | Have at least 2 Tent Site with Electric Hookup tiles. | Tent Electric | Anywhere on the board. |
| Summer Activity Hub | 5 | Have at least 3 different amenity types. | amenities | Copies do not help. |
| Campers Everywhere | 6 | Have developed camp tiles in all 4 board quadrants. | any market tiles | Any occupied camp tile counts. |
| Main Road Traffic | 6 | Have a longest connected road of at least 8 and at least 4 road-served developed camp tiles. | roads plus camp tiles | Practical road access can be on the parcel or next to it. |
| Splash and Stay | 6 | Put a Pool within 2 spaces of another premium tile. | Pool plus premium tile | Premium amenities count too. |
| Family Favorite | 6 | Put a Playground within 2 spaces of both a Group Site and a tent-based campsite. | Playground, Group Site, Rustic Tent Forest, Tent Electric | The group site and tent do not have to touch each other. |
| Popular Pavilion | 5 | Put Event Pavilion orthogonally next to at least 2 developed camp tiles. | Event Pavilion and any market tiles | It checks developed camp tiles, not empty parcels. |
| Active Campground | 5 | Have Bike Rental and Hiking Trail. | Bike Rental, Hiking Trail | No distance check. |
| Full Swing | 6 | Place at least 7 market tiles during Mid Summer. | any market tiles | Round count only. |
| Busy Utility Loop | 5 | Have at least 2 road hubs. | road tiles | A hub has 3 or more connected road neighbors. |
| Adventure Weekend | 7 | Have Canoe Rental, Bike Rental, and Hiking Trail. | Canoe Rental, Bike Rental, Hiking Trail | No adjacency needed. |
| Big Rig Friendly | 6 | Have at least 2 RV Sites on strong road-access parcels. | RV Site with Full Hookups | Same legal RV test as RV Weekend. |
| Cooling Off | 5 | Have any 2 of these 3: Pool, Ice Cream Vending, Waterfront Site. | Pool, Ice Cream Vending, Waterfront Site | Any 2 are enough. |
| Peak Season Layout | 7 | Have at least 4 developed camp tiles in the center zone and at least 3 of them road-served. | any market tiles plus roads | Road-served means on or next to practical road access. |

#### Example

Chris places a Pool next to a Cabin and an RV Site, then later adds Ice Cream Vending in the center. If `Beat the Heat`, `Splash and Stay`, and `Cooling Off` are active, that cluster can help all three goals.

### Late Summer Goals

These score only at the end of Late Summer. The game contains 22 Late Summer goals, but only 4 are revealed in a given play.

| Goal | Points | Plain-English Rule | Tiles That Matter | Clarification |
| --- | --- | --- | --- | --- |
| Cabin Country | 6 | Have at least 3 Cabins. | Cabin | Anywhere on the board. |
| Lakeside Premium | 6 | Have at least 2 Waterfront Sites. | Waterfront Site | The sites do not need to touch. |
| Deluxe Weekend | 7 | Have at least 1 Cabin, at least 1 Waterfront Site, and at least 1 of those tiles within 2 spaces of an amenity. | Cabin, Waterfront Site, any amenity | Only one of the two stay tiles needs amenity support. |
| Luxury Lane | 7 | Build a straight row or column of 3 premium tiles with real road continuity under them. | premium tiles | Premium amenities count. |
| End-of-Season Escape | 7 | Have at least 10 campsite or lodging tiles. | campsite/lodging | Amenities do not count. |
| Polished Grounds | 6 | Finish with 3 or fewer unused supported spaces. | empty landscape parcels | The code uses a broad empty-developed-space count. |
| Scenic Ride | 6 | Put Horse Riding into the main road network. | Horse Riding | Placement still must follow the tile's scenic/forest/edge rule. |
| Premium Cluster | 7 | Build a premium cluster of size 3 or more. | premium tiles | Orthogonal touching only. |
| Camp for Everyone | 7 | Have Rustic Tent Forest, Tent Electric, RV Site, Group Site, and Cabin. | those 5 types | Waterfront Site does not replace any required type. |
| Longest Route In | Up to 8 | Score floor(longest road length / 2), up to 8 points. | roads | A road length of 16 or more reaches the cap. |
| Lakeside Leisure | 6 | Put a Waterfront Site within 2 spaces of Canoe Rental or Ice Cream Vending. | Waterfront Site, Canoe Rental, Ice Cream Vending | One legal pairing is enough. |
| Refined Retreat | 7 | Put a Cabin within 2 spaces of an amenity and keep tent-based campsites out of its immediate orthogonal ring. | Cabin, amenities, Rustic Tent Forest, Tent Electric | The tent restriction is only distance 1. |
| Premium Hospitality | 7 | Connect the Camp Office, then have at least 3 premium tiles and 2 amenity types. | Camp Office, premium tiles, amenities | All three requirements must be true. |
| End of Summer Event | 6 | Put Event Pavilion within 2 spaces of at least 4 developed camp tiles. | Event Pavilion plus any market tiles | Any developed camp tile counts. |
| Horse Country Getaway | 6 | Put Horse Riding on scenic terrain or within 2 spaces of a premium tile. | Horse Riding, premium tiles | Forest-only placement does not satisfy this goal unless premium is nearby. |
| Waterfront Weekend | 7 | Have at least 2 Waterfront Sites and at least 1 Canoe Rental or Ice Cream Vending. | Waterfront Site, Canoe Rental, Ice Cream Vending | Support can be either leisure tile. |
| Fully Connected Resort | 8 | Give every developed camp tile practical road access. | all market tiles plus roads | The road can be on the tile or next to it. |
| Built Out Season | 6 | Place at least 7 market tiles during Late Summer. | any market tiles | Round count only. |
| Destination Campground | 8 | Have at least 3 amenity types, 4 campsite/lodging types, and 3 premium tiles. | amenities, stay types, premium tiles | All three thresholds are required. |
| Smore to Explore | Up to 12 | Score across campsite variety, amenity variety, road length, premium count, center presence, and final balance. | many tile categories | This is a partial-scoring card, not all-or-nothing. |
| Grand Arrival Drive | 6 | Keep the Entrance road as one unbranched path for at least 4 road tiles before the first split or dead end. | Entrance plus roads | The Entrance tile counts toward the length. |
| Season Finale Sprint | 6 | Place at least 6 market tiles during Late Summer. | any market tiles | This can score alongside Built Out Season if both are active. |

#### Example

Eliana ends Late Summer with 2 Waterfront Sites, 1 Canoe Rental, and 1 Ice Cream Vending. If `Lakeside Premium`, `Lakeside Leisure`, and `Waterfront Weekend` are active together, her waterfront section can satisfy all three.

### Camp Director Goals

These 10 goals exist in the deck, but only 3 are revealed after Early Summer. The revealed 3 score at the end of Late Summer.

| Goal | Points | Plain-English Rule | Tiles That Matter | Clarification |
| --- | --- | --- | --- | --- |
| Happy Families | Up to 10 | Score 2 points each for Playground, Group Site, Ice Cream Vending, and Pool. Score 2 extra if all 4 are present. | family tiles | 1, 2, 3, or 4 attractions score 2, 4, 6, or 10. |
| Roughing It Right | 8 or 9 | Have 2 Rustic Tent Forest, Firewood, and Hiking Trail. Score 1 extra if the Rustic Tent Forest cluster is size 2 or more. | Rustic Tent Forest, Firewood, Hiking Trail | Full score is 9. |
| Full Hookup Favorite | Up to 9 | Score 3 points for each legal RV Site, up to 9. | RV Site with Full Hookups | Legal means strong road access. |
| The Waterfront Draw | Up to 10 | Score 5 for at least 1 Waterfront Site, 3 for Canoe Rental, and 2 for having at least 2 Waterfront Sites. | Waterfront Site, Canoe Rental | These points stack. |
| Rain or Shine | 6 or 8 | Have Rustic Tent Forest plus any premium tile. Score 8 instead of 6 if you also have a Cabin or Tent Electric. | Rustic Tent Forest, premium tiles, Cabin, Tent Electric | Premium can be any premium-tagged tile. |
| Smooth Traffic Flow | Up to 9 | Score 3 for longest road 7+, 3 for 2 road hubs, and 3 for 1 or fewer dead ends. | roads | Each sub-check is separate. |
| Summer Traditions | 8 or 10 | Have Event Pavilion, Firewood, and Group Site. Score 10 if an Event Pavilion is within 2 spaces of both Group Site and Firewood. | Event Pavilion, Firewood, Group Site | Full score needs the close cluster. |
| Something for Everyone | Up to 10 | Score 2 points for each different campsite or lodging type, up to 10. | campsite and lodging types | Amenities do not count. |
| Comfort Upgrade | Up to 10 | Score 3 for Cabin, 3 for Tent Electric, and 4 for Pool, Ice Cream Vending, or Bathrooms. | Cabin, Tent Electric, Pool, Ice Cream Vending, Bathrooms | Each sub-check is separate. |
| Destination Status | Up to 12 | Score 3 each for 4 stay types, 3 amenities, longest road 7+, and 3 premium tiles. | stay types, amenities, roads, premium tiles | Each benchmark is all-or-nothing. |

#### Example

Eric ends the game with Playground, Group Site, Pool, and Ice Cream Vending. If `Happy Families` is one of the revealed Camp Director goals, he scores the full 10 points.

---

## 8. Detailed Tile Placement Rules

This section is a placement and scoring reference. Use it when a tile looks simple but the code checks something stricter.

### Universal Placement Rules

Every market tile:

- must sit on a landscape tile
- cannot overlap another camp tile
- cannot use the Entrance parcel
- cannot use the Camp Office parcel

Every big market item:

- occupies exactly 2 squares
- may be horizontal or vertical
- must be legal on both squares
- uses the nearest occupied square when distance-based goals check it

> [!IMPORTANT]
> A two-square item is one placement for scoring categories such as "how many Group Sites do you have," but both occupied squares count when checking range, adjacency, and legal placement.

### Site Reference

#### Rustic Tent Forest

- Represents simple rustic tent camping.
- Place on any normal open landscape parcel.
- Cannot overlap another camp tile or a reserved Entrance or Office parcel.
- No road-edge requirement in placement code.
- Scoring interactions: Tents in the Pines, Wooded Retreat, Practical Camping, Camp for Everyone, Roughing It Right, Something for Everyone.
- Example: Eric can place Rustic Tent Forest on a Forest Nook with no road edge.

#### Tent Site with Electric Hookup

- Represents tent camping with added comfort.
- Must be placed on a parcel whose landscape tile has at least 1 road edge.
- Scoring interactions: Practical Camping, Hookup Demand, Family Favorite, Comfort Upgrade, Something for Everyone.
- Example: Chris may not place it on a pure Scenic Meadow with no road edge.

#### RV Site with Full Hookups

- Represents a premium RV stay.
- Big market item.
- Both squares must have landscape tiles and at least 2 road edges on their underlying parcels.
- Scoring interactions: Glamor Guests, RV Weekend, Big Rig Friendly, Full Hookup Favorite, Camp for Everyone, Rain or Shine, premium goals.
- Example: A horizontal RV across two strong road parcels is legal. One strong parcel and one weak parcel is not.

#### Group Site

- Represents a larger social campsite.
- Big market item.
- Both squares must have at least 1 road edge on their underlying parcels.
- Scoring interactions: Scout Arrival, Family Meet-Up, Community Spot, Kid Camp, Family Favorite, Summer Traditions, Happy Families.
- Example: Eliana can rotate it vertical if the horizontal preview would hit the board edge.

#### Cabin

- Represents premium lodging.
- Must be placed on a parcel whose landscape tile has at least 1 road edge.
- Scoring interactions: Glamor Guests, Cabin Country, Deluxe Weekend, Refined Retreat, Camp for Everyone, Comfort Upgrade, premium goals.

#### Waterfront Site

- Represents premium waterfront lodging.
- Big market item.
- At least 1 of the 2 squares must be on a water-edge landscape parcel.
- Both squares must still be otherwise legal, open parcels.
- Scoring interactions: Glamor Guests, Lakeside Premium, Deluxe Weekend, Lakeside Leisure, Waterfront Weekend, The Waterfront Draw, premium goals.
- Example: One half on Lakeside Meadow plus one half on adjacent Scenic Meadow can be legal. Two inland squares are never legal.

### Amenity And Attraction Reference

#### Horse Riding

- Represents a specialty attraction.
- Big market item.
- Both halves need at least 1 road edge.
- Both halves must also be scenic, forest, or on the board edge.
- Scoring interactions: Scenic Ride, Horse Country Getaway, Splash and Stay, Rain or Shine, premium goals.

#### Firewood

- Represents a support amenity.
- Must have practical road access or scenic support.
- Scoring interactions: Fire Circle Friends, Kid Camp, Roughing It Right, Summer Traditions, amenity variety goals.

#### Pool

- Represents a premium family amenity.
- Needs at least 1 road edge.
- Scoring interactions: Beat the Heat, Splash and Stay, Cooling Off, Happy Families, Comfort Upgrade, premium goals.

#### Bike Rental

- Represents an activity amenity.
- Needs at least 1 road edge.
- Scoring interactions: Wheels Ready, Active Campground, Adventure Weekend, amenity variety goals.

#### Canoe Rental

- Represents a lakeside activity amenity.
- Must be on a water-edge parcel.
- Scoring interactions: Paddle Out, Adventure Weekend, Lakeside Leisure, Waterfront Weekend, The Waterfront Draw.

#### Event Pavilion

- Represents a social gathering space.
- Big market item.
- Both halves need at least 1 road edge.
- Scoring interactions: Community Spot, Popular Pavilion, End of Summer Event, Summer Traditions.

#### Hiking Trail

- Represents a scenic activity feature.
- Must be on scenic, forest, or board-edge terrain.
- Scoring interactions: Trailhead Start, Active Campground, Adventure Weekend, Roughing It Right.

#### Ice Cream Vending

- Represents a premium family amenity.
- Needs at least 1 road edge.
- Scoring interactions: Sweet Summer Stop, Cooling Off, Lakeside Leisure, Waterfront Weekend, Happy Families, Comfort Upgrade, premium goals.

#### Playground

- Represents a family amenity.
- Needs at least 1 road edge.
- Scoring interactions: Family Meet-Up, Kid Camp, Family Favorite, Happy Families.

#### Bathrooms

- Represents a service amenity.
- Needs at least 2 road edges, just like RV placement.
- Scoring interactions: Camp Basics, Summer Activity Hub, Comfort Upgrade, Destination Campground, Destination Status, Smore to Explore, Deluxe Weekend support, Refined Retreat support.

---

## 9. End Of Game And Final Scoring

The game ends after Late Summer scoring is complete.

### Final Scoring Order

1. Score the 4 active Late Summer goals for every player.
2. Score the 3 revealed Camp Director goals for every player.
3. Add those points to each player's running total.
4. Highest total score wins.

### What The Code Tracks In The Final Standings

The digital final screen shows:

- total score
- money left
- director points

The code sorts final standings by total score only.

### Tie Breakers

No tie breaker is coded. If players tie on total score, the current code does not break the tie further.

Suggested physical tie breaker:

1. most money left
2. then most Camp Director points
3. then shared victory

Because this is not coded, it also appears in `Rules Needing Confirmation`.

### Final Example

| Player | Seasonal Points | Director Points | Final Total |
| --- | --- | --- | --- |
| Eric | 32 | 8 | 40 |
| Chris | 29 | 10 | 39 |
| Eliana | 27 | 6 | 33 |

Eric wins with 40 points.

---

## 10. Quick Reference

### Setup Checklist

- choose 2 to 5 players
- give each player an 8 x 5 board
- give each player $100,000
- give each player 10 starting landscape tiles
- reveal 4 Early Summer goals
- fill the 6 x 8 contractor market
- decide player order

### Summer Structure

1. Landscape Tile Phase
2. Market Tile Phase
3. Goal Scoring Phase

### Landscape Placement Checklist

- inside the board
- does not overlap
- first tile is Entrance
- Entrance gate faces the outside edge
- touches your current campground
- road meets road
- open edge does not hit road
- office must connect to Entrance by the end of the phase

### Market Placement Checklist

- on top of a landscape tile
- not on Entrance or Office
- not overlapping another camp tile
- meets the tile's road and terrain rule
- if big market item: both squares must pass every check
- if Waterfront Site: at least 1 half must touch a water-edge parcel

### Scoring Reminder

- 4 public goals score each Summer
- 3 Camp Director goals reveal after Early Summer
- all revealed director goals score after Late Summer
- every player may score every active public goal they satisfy

### End-Game Checklist

- score the 4 active Late Summer goals
- score the 3 revealed Camp Director goals
- total all points
- highest score wins

---

## Rules Needing Confirmation

### 1. Finite physical supply counts

- Unclear rule: The digital game refills from weighted pools instead of depleting a fixed supply.
- Source of uncertainty: `createMarketSlot()` in `smore-to-explore.js` uses weighted random picks from `copies` values rather than removing tiles from a finite deck.
- Suggested final wording: "The physical market refills from shuffled finite stacks built using the listed weight counts as print counts, unless the publisher specifies a different finite mix."

### 2. Physical expansion landscape tile mix

- Unclear rule: The game clearly gives each player 8 expansion tiles in Mid Summer and 8 in Late Summer, but it does not define a fixed shared physical pool.
- Source of uncertainty: `drawExpansionLandscapeInventory()` in `smore-to-explore.js` draws by weight rather than from a shrinking stack.
- Suggested final wording: "Prepare a shared expansion landscape pool large enough to give every player 8 tiles at the start of Mid Summer and 8 at the start of Late Summer, using the code's road-heavy, water, and scenic mix as the default recipe."

### 3. Tie breaker

- Unclear rule: Final standings are sorted by total score only.
- Source of uncertainty: `applyFinalScoring()` in `smore-to-explore.js`.
- Suggested final wording: "If tied, the tied player with the most money left wins. If still tied, the tied player with the most Camp Director points wins. If still tied, share the victory."

### 4. Physical money and score-tracking components

- Unclear rule: The code tracks money and score digitally, but does not define paper denominations, chip values, or a printed score track.
- Source of uncertainty: player money and score are numeric fields in `createPlayerState()` without any physical component specification.
- Suggested final wording: "Use any combination of bills, chips, or a score pad, as long as each player can track money in $10,000 steps and total score across all rounds."
