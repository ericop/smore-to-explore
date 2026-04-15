# Smore to Explore

Smore to Explore is a cozy browser prototype about building a campground across three summer rounds.

The current prototype focuses on:

- a manual landscape setup phase on an `8 x 5` board
- Carcassonne-style edge-aware road placement
- a visible `6 x 8` contractor market
- buying and placing campground campsites and amenities
- round objectives for Early Summer, Mid Summer, and Late Summer
- Camp Director objectives that unlock after the first scoring phase

## Core Flow

1. Place the 10 starting landscape tiles.
2. Enter the build phase and buy camp tiles from the visible market.
3. Score the current round's shared objectives.
4. Receive 8 new landscape tiles and a new contractor budget grant.
5. Repeat through all 3 summer rounds.
6. Score Camp Director objectives during final scoring.

## Prototype Notes

- The game is currently built as plain `HTML`, `CSS`, and `JavaScript`.
- The board uses a landscape layer and a camp layer per cell.
- Market refills are intentionally simple for the prototype.
- The Camp Director layer currently reveals a readable subset of the full objective pool so the UI stays manageable.
- The code is structured to keep state, placement validation, scoring, and rendering relatively separate for future iteration.

## Run Locally

Open [index.html](C:\src\smoreToExplore\index.html) in a browser.

There is no build step.
