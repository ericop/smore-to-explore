## Project Overview

This is a browser-based **tile-placement and management game** built with:
- Plain JavaScript (no frameworks)
- HTML Canvas
- Single-file architecture

Game Title: **Smore to Explore**

**Core Loop:** Players place landscape road tiles to build a connected campground skeleton, then draft campsite and amenity contractors from a visible market while chasing seasonal objective cards across three summer rounds.

This project is intentionally:
- Simple and rapid-prototype focused.
- Educational (built with a 4th grade student).
- Easy to modify and extend.

## Architecture Rules (VERY IMPORTANT)

- **DO NOT** introduce frameworks (no Phaser, React, etc.).
- Keep everything compatible with a **single HTML/JS file**.
- Prefer small, simple functions over abstractions.
- **Entity Pattern:** Each tile or UI element should follow:
  - `update(dt)`: Handle logic (income, cleaning timers).
  - `draw(ctx)`: Handle rendering.

---

## Game Logic Specifics

- **The Grid:** An `8 x 5` campground board made of landscape cells.
- **Landscape Layer:** Rotatable road and scenic tiles define access and placement rules.
- **Camp Layer:** One campsite or amenity can sit on top of a placed landscape tile.
- **The "State" Machine:**
  - `SETUP` / `EXPANSION`: placing landscape tiles
  - `BUILD`: drafting and placing camp tiles
  - `ROUND_SUMMARY` / `FINAL`: scoring phases
- **Objectives:** Data-driven seasonal cards plus Camp Director goals.

---

## Coding Style

- Use plain JavaScript.
- Prefer `const` over `let`.
- **No Magic Numbers:** Define `TILE_SIZE`, `COIN_START`, and `CLEANING_COST` at the top.
- Avoid deeply nested logic (use early returns).

---

## Working With This Codebase

### 1. Make Small Changes Only
- Do NOT rewrite large sections.
- Focus on one "System" at a time (e.g., "Add a restroom tile").

### 2. Explain Before Changing
Always:
1. Describe planned changes (e.g., "We are adding a function to check if a tile is touching a road").
2. Provide the code.

### 3. Perform a Compile Check
Always verify:
- No syntax errors.
- Variables exist and functions are defined before use.

---

## Performance & UX Rules

- **Visual Feedback:** Always show a "ghost" preview of the Tetris piece under the mouse. Red tint if placement is invalid, Green if valid.
- **Simple Inputs:** Must support `mousedown` and `touchstart` for placement and rotation (e.g., Spacebar or a UI button to rotate).
- **No Heavy Lifting:** Since the grid is small, use simple loops for adjacency checks rather than complex pathfinding libraries.

---

## Known Pitfalls (Avoid These)

- **The "Floating" Tile:** Do not allow tiles to be placed without a connection to the existing road/park network.
- **Over-complicating Hookups:** Start with a simple "Is this tile adjacent to a utility line?" check.
- **Hidden State:** Keep the player's "Wallet" and "Park Rating" visible and updated in real-time.

---

## AI Behavior Rules

You are a **patient senior developer** helping a beginner and a 4th grader.
- **Teach as you go:** Explain *why* we use a 2D array for the grid.
- **Stay Modular:** If we add "Programs" (like the movie night), keep that logic separate from the "Tile Placement" logic.
- **Encourage Progress:** Celebrate when a new tile type works!
