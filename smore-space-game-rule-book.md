# Smore to Explore Rule Book

This document has been lightly updated to match the current prototype direction.
The playable browser version is now **Smore to Explore**, not the older polyomino RV park prototype.

## Game Overview

In Smore to Explore, the current prototype is a **single-player campground drafting and tile-placement game** played across **3 rounds**:

- Early Summer
- Mid Summer
- Late Summer

The player first lays out a connected starting road network on an **8 by 5** board. After that, they buy visible campsite and amenity tiles from a contractor market, place them on valid landscape cells, and score seasonal objectives plus longer-range Camp Director goals.

## Prototype Snapshot

The current browser prototype includes:

- a setup phase with 10 starting landscape tiles
- edge-aware road placement with rotation
- a `6 x 8` visible contractor market
- campsite and amenity placement rules
- 3 seasonal rounds with scoring summaries
- Camp Director objectives that unlock after the first scoring phase

## Campground Board Geography

The personal campground has environmental edges shown in the UI:

- **top edge**: Water
- **left edge**: Woods
- **right edge**: Field
- **bottom edge**: Road

The current code uses very simple geography checks:

- a space has **lake access** only if it is on the **top row**
- a space is **forest-adjacent** only if it is on the **leftmost column**
- a space is considered **scenic** if it is either lake-access or forest-adjacent

## Tile and Piece System

### Market Structure

The shared market has two trays:

- **6 domino slots**
- **4 complex piece slots**

Each piece has:

- a randomly chosen **square type**
- a shape made of 1 to 5 cells
- a cost equal to its number of cells

### Square Types in the Current File

Base square types:

- test
- tent
- rv
- rustic
- cabin
- bathroom
- shower
- camp_store

Advanced square types:

- tent_electric
- playground
- water_station
- septic_dump
- ice_cream_addon
- firewood_addon
- boat_ramp_dock
- parking
- education_pavilion
- activities_pavilion
- covered_common_area
- vending
- bait_gear
- rentals
- recreation_field
- beach
- forest_path
- field_sports

## Setup

1. Open the player setup screen.
2. Enter at least **2 player names** and at most **5**.
3. Start the game.
4. Each player begins with **$10**.
5. The first player begins the off-season building phase.

There is also a **Play test** button that starts a 2-player game immediately with the names **Eop** and **Chris**.

## Core Game Structure

Each year has two major parts:

1. **Off-season building**
2. **Camping season**

After camping season finishes, the game returns to the next year's off-season until year 5 is complete.

## Off-Season Building Phase

### On Your Turn

During the off-season, the active player:

1. chooses one piece from the shared market
2. previews that piece on their board
3. optionally moves, rotates, or flips the preview
4. confirms the placement and pays for it

After confirming placement, the turn advances to the next player who has not yet passed.

### Piece Costs

A piece costs exactly its number of cells.

Examples:

- 1-cell piece costs $1
- 2-cell piece costs $2
- 5-cell piece costs $5

If a player cannot afford a selected piece placement, the placement is rejected.

### Placement Rules

A piece may be placed only if:

- every cell stays inside the 8 x 16 board
- no cell overlaps an already occupied space
- the player can still afford the piece when it is confirmed

### Preview Controls Implemented in the UI

When a placement is pending, the game shows buttons for:

- move up
- move left
- move down
- move right
- rotate left
- rotate right
- flip horizontally
- confirm
- cancel

### Canceling a Placement

If you cancel a pending placement, the current file keeps the piece selected and clears the preview.
The status text says the piece was returned to the draw pile, but the piece actually remains in the market until a placement is confirmed.

### Passing

A player may choose **Pass** instead of placing more pieces.

When a player confirms passing:

- `passedThisRound` becomes true for that player
- that player is skipped for the rest of the round

When **all players have passed**, off-season ends and camping season begins.

### Market Refill

The shared market refills after enough pieces have been taken.

The current code checks how many market slots are empty and refills when **5 or more** slots are empty.

## Camping Season

When all players pass, camping season begins immediately.

### Season Phases

Camping season has 3 phases:

1. **Early Summer**
2. **Mid Summer**
3. **Late Summer**

At the start of camping season:

- the game automatically reveals **Early Summer**
- a **Memorial Day** overlay appears
- the game screen changes to the season screen

### Arrival Deck Structure

The file defines **27 unique arrival cards**:

- 9 early summer cards
- 9 mid summer cards
- 9 late summer cards

For each phase, the game:

- creates a deck with **2 copies of each card** in that phase
- shuffles the deck
- reveals **6 cards**
- checks every player against every revealed card
- pays every qualifying player

This is a **communal market**. Multiple players can qualify for the same revealed card.

### Advancing the Season

The season screen has a **Next Phase** button.

- Early Summer advances to Mid Summer
- Mid Summer advances to Late Summer
- Late Summer opens a **Labor Day** overlay

When Labor Day is confirmed, the next off-season begins unless round 5 has just ended.

## End of the Game

The game ends after the fifth year.

At that point:

- players are ranked by current cash
- the player with the highest cash is the winner
- the game over overlay shows final standings

## Arrival Card Rules

Below is the current arrival content implemented in the file.

## Early Summer Arrival Cards

### 1. Spring Test Campers
- Requirement: any 2 sites and 1 bathroom
- Base income: $4
- Bonus: +$2 if you have showers

### 2. Retired RV Pair
- Requirement: 1 RV site with hookups
- Base income: $5
- Bonus: +$3 if no tent sites are adjacent
- Penalty: -$2 if the chosen RV site is crowded

### 3. Scout Troop
- Requirement: 3 tent sites that are forest-adjacent
- Base income: $6
- Bonus: +$4 if you have event space

### 4. Early Bird Fishermen
- Requirement: 1 tent or RV site with lake access
- Base income: $5
- Bonus: +$3 if you have a boat ramp
- Bonus: +$1 if you have bait/gear

### 5. Cabin Weekend Couple
- Requirement: 1 cabin
- Base income: $5
- Bonus: +$2 if isolated
- Bonus: +$2 if scenic

### 6. Minimalist Backpackers
- Requirement: 2 forest-adjacent tent sites
- Base income: $5
- Bonus: +$3 if no amenities are nearby
- Penalty: -$2 if near RVs or vending

### 7. Campground Inspectors
- Requirement: 1 bathroom, 1 shower, and any site
- Income: $5 if qualified

### 8. Rainy Weekend Travelers
- Requirement: 1 cabin or RV
- Base income: $4
- Bonus: +$3 if you have covered/common area

### 9. Family Trial Trip
- Requirement: 1 tent and 1 bathroom
- Base income: $4
- Bonus: +$2 if you have a playground
- Bonus: +$1 if you have ice cream or vending

## Mid Summer Arrival Cards

### 10. Full Hookup RV Rally
- Requirement: 3 RV sites with hookups
- Base income: $8
- Bonus: +$6 if all 3 are adjacent
- Penalty: -$3 if near tents

### 11. Lake Day Families
- Requirement: 2 lake-access sites
- Base income: $6
- Bonus: +$4 if you have a playground
- Bonus: +$2 if you have ice cream

### 12. Summer Camp Program
- Requirement: 2 cabins, 2 tent sites, and event space
- Income: $10 if qualified

### 13. Kayak Crew
- Requirement: 2 lake-access tent or RV sites
- Base income: $6
- Bonus: +$3 if you have a boat ramp
- Bonus: +$2 if you have rentals

### 14. Road Trip Influencers
- Requirement: any 2 sites
- Base income: $4
- Bonus: +$5 if at least 2 sites are scenic

### 15. Youth Sports Team
- Requirement: 3 sites and a sports field
- Base income: $6
- Bonus: +$4 if bathrooms are near the sports tile
- Penalty: -$2 if they are not

### 16. Glamping Couple
- Requirement: 1 cabin
- Base income: $5
- Bonus: +$4 if near lake
- Bonus: +$2 if not adjacent to a tent

### 17. Weekend Overflow Crowd
- Requirement: capacity for 3 more sites
- Effective income in code: $6
- Penalty: -$3 if bathroom capacity is strained

### 18. Firewood Fanatics
- Requirement: any 2 sites
- Base income: $4
- Bonus: +$3 if you have firewood
- Bonus: up to +$3 from campfire-friendly adjacencies

## Late Summer Arrival Cards

### 19. Leaf Peepers (Early)
- Requirement: 1 tent or cabin on the forest edge
- Base income: $5
- Bonus: +$4 if the site has multiple forest adjacencies

### 20. Quiet Retreat Couple
- Requirement: 1 cabin
- Base income: $5
- Bonus: +$3 if isolated
- Bonus: +$2 if not near sports/playground

### 21. Discount RV Travelers
- Requirement: 1 RV site
- Base income: $4
- Bonus: +$2 if vacancy is available
- Penalty: -$2 if the campground is crowded

### 22. Late Season Scouts
- Requirement: 2 forest-adjacent tent sites
- Base income: $5
- Bonus: +$3 if you have event space
- Bonus: +$1 if bathrooms are nearby

### 23. Fishing Diehards
- Requirement: any lake-access site
- Base income: $5
- Bonus: +$4 if you have a boat ramp
- Bonus: +$1 if total site count is 3 or fewer

### 24. End-of-Summer Family Trip
- Requirement: 2 sites and a bathroom
- Base income: $5
- Bonus: +$3 if you have a playground
- Bonus: +$2 if you have ice cream

### 25. Camp Cleanup Volunteers
- Requirement: any 2 sites
- Income: $2
- Note in file: intended future hook for clearing negative effects

### 26. Off-Grid Adventurers
- Requirement: 2 forest-adjacent tent sites
- Base income: $5
- Bonus: +$4 if no amenities are nearby
- Penalty: -$3 if near vending or bathrooms

### 27. Romantic Anniversary Stay
- Requirement: 1 scenic cabin
- Base income: $6
- Bonus: +$5 if isolated
- Note in file: intended future luxury hook

## Implemented Definitions and Heuristics

The current file uses several specific definitions that matter for rules interpretation:

### Hookups
- RV sites count as having hookups
- `tent_electric` also counts as hookup-enabled, but also normalizes to `tent`

### Site Types
The code treats these as true campsite types:

- rustic
- tent
- rv
- cabin

### Scenic
A site is scenic if it is:

- on the top row, or
- on the leftmost column

### Isolated
A site is isolated if all 4 orthogonal neighboring spaces are empty.

### Crowded
A campground is considered crowded if it has more than **6** total site cells.

### Vacancy
The game estimates vacancy using a rough helper:

- potential capacity = current site count + an estimated amount of open grass
- vacancy is true when current site count is less than half the estimated capacity

### Campfire-Friendly Adjacency
The game counts orthogonal adjacency between site cells and divides by 2 to avoid double-counting pairs.

## Screens and Overlays

The file includes these screens:

- main menu
- player setup
- how to play
- credits
- game screen
- season screen

It also includes overlays for:

- pass and play handoff
- pass confirmation
- Memorial Day
- Labor Day
- exit confirmation
- game over

## Content in the JS game file that are not likely full or properly implemented

This section is intentionally blunt. Some things in the file look like placeholders, shortcuts, or partial implementations rather than finished rules.

### 1. The `test` square type is acting like a Swiss Army chainsaw
The square type `test` is not a clean game concept in the current file.
It is normalized to `recreation_field`, and through proxy logic it can also stand in for:

- sports field
- covered/common area
- vending
- bait/gear
- rentals
- event space
- education space

That is almost certainly placeholder logic, not finished rules.

### 2. Several advanced square types exist visually but have little or no dedicated gameplay logic
These square types are present in the market, labels, and colors, but are barely used or not used in meaningful standalone rules:

- parking
- water_station
- septic_dump
- forest_path

Some of these may still matter indirectly through future design intent, but in the current file they do not appear to have robust implemented gameplay roles.

### 3. The how-to-play screen is extremely incomplete
The in-game how-to-play screen is only a one-sentence summary.
It does not explain:

- cash
- passing
- seasonal flow
- arrivals
- winning
- amenities
- board geography
- scoring details

### 4. Capacity is estimated, not truly modeled
`countPotentialSiteCapacity()` uses a rough estimate based on current site count and a hardcoded "12 open grass" style assumption.
That is not a true campsite-capacity model.

### 5. Some arrival cards contain explicit future hooks that do nothing yet
The file directly includes unfinished hooks such as:

- reputation hook ignored for now
- TODO future negative effects hook
- TODO hook into negative effect system later
- TODO luxury upgrade bonus hook

### 6. Some amenities are broader than their names suggest
For example, `camp_store` currently counts as multiple different amenity concepts for matching purposes, including:

- covered/common area
- vending
- ice cream
- bait/gear
- rentals

That may be a useful prototype shortcut, but it is not likely a final clean rules model.

### 7. The season screen only shows arrival income
The current file does not implement separate seasonal systems for:

- side hustle income
- adjacency bonuses
- reputation
- negative effects
- luxury upgrades

### 8. Keyboard efficiency work discussed later is not present in this file
This file does not include the broader keyboard-control improvements discussed later, such as space-to-confirm modal actions or arrow-key placement control.

---

# content that is in conflict with discussion with the game designer

This supplement compares the current JS implementation against the design direction discussed in conversation with the game designer.

## likely misses

These are areas where the file feels like an early prototype version of the discussed idea rather than a direct contradiction.

### 1. Campground identity is only partly expressed
The discussed design leaned toward players shaping a recognizable campground identity through site mix, attractions, and support systems.
The current file does some of this through arrival-card matching, but the board still feels more like "random useful polyominoes" than a fully intentional campground-tycoon identity engine.

### 2. Camper demand is mostly represented through arrivals only
The discussion emphasized campers showing up based on campground capacity, amenities, side businesses, and layout synergies.
The file currently models only the arrival-card part of that idea.

### 3. Amenity specialization is flattened by proxy logic
The designer discussion treated things like sports fields, education events, rentals, showers, vending, and boat ramps as meaningfully different reasons campers might choose a campground.
The current proxy logic blurs many of those distinctions.

### 4. Seasonal phase structure is present, but the broader summer-economy loop is thinner than discussed
Early, mid, and late summer are implemented, which matches the discussion well.
What is missing is the richer feeling of a full campground business simulation during those phases.

### 5. The current UI documentation undersells the game
The file's built-in how-to-play text makes the game sound much simpler than the actual discussed design.
That is not a mechanical contradiction, but it definitely undersells what the game is trying to become.

## blatant conflicts

These are the places where the current JS file is in direct conflict with the discussed design direction.

### 1. The side hustle engine is not implemented
A major discussion point was a seasonal side-income layer from things like:

- ice cream
- firewood
- vending
- bait/gear
- rentals
- boat access support

That system is not implemented in this file at all.

### 2. The adjacency bonus engine is not implemented
Another explicit design direction was making tile placement matter more through adjacency bonuses and penalties.
That reusable adjacency engine is also absent from this file.

### 3. The campground simulation is being patched through placeholder proxies instead of dedicated rules
Using `test` as a catch-all proxy for multiple unrelated amenities is in direct conflict with the more expressive, campground-specific design language discussed for the game.

### 4. Several future-facing mechanics are referenced but not functional
The file references future systems like:

- reputation
- negative effects
- luxury upgrades

Those are not merely hidden. They are explicitly mentioned but not implemented.

### 5. The current file does not include the keyboard-efficiency improvements that were requested later
The design direction later included faster keyboard interaction for:

- modal confirmations
- placement movement
- more efficient piece manipulation

That work is not present in this version of the file.
