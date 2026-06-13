# Phase 3 Playtest Findings

How this was tested: the headless harness played hundreds of seeded 2 to 5 player games (the statistical "can you get stuck or uncompetitive" question), and a targeted probe captured the exact player-facing "why blocked" text and placement difficulty for every camp tile across 60 seeded games (the "is it confusing" question). The probe strings are verbatim what the UI shows in the bottom tray (the renderer prints `reasons[0]`). A real-UI fast-forward confirmed the in-game presentation. This complements, and is more decisive than, ten manual click-throughs.

## No soft-locks (the "unplayable spot" worry is clear)

- Across 125+ full games (2p and 4p, every seed) the AI completed the landscape phase with **zero retries** and **no game failed to finish**. The placement rules never produce a state where a player cannot make a legal move. Landscape is always completable, scoring always runs, the game always ends.
- The remaining "can I get uncompetitive" worry is a **balance/comeback** question, not a soft-lock. The mirror-matchup batch shows even seats (50.7/49.3 after the rotating-starter fix) and a working economy. Comeback feel is best judged with human Phase 3 sessions and tuned in the deferred 500-game pass; it is not a correctness defect.

## Ranked hard-to-play tiles (mean legal cells when offered, lower = harder)

| Tile | Big? | Mean legal cells | Zero-legal rate | Verdict |
|---|---|---|---|---|
| **Canoe Rental** | no | **0.7** | **30%** | **Simplify** |
| **Waterfront Site** | yes (2 sq) | 1.4 | 31% | Keep + make legible |
| **Horse Riding** | yes (2 sq) | 1.6 | **44%** | Keep (intentional specialty) + teach |
| **Hiking Trail** | no | 2.7 | 13% | Keep, minor |
| Everything else (RV, Group, Pavilion, Cabin, tents, Pool, etc.) | mixed | 5.9 to 7.2 | 9 to 16% | Fine |

"Zero-legal rate" = how often a player who wants that tile has **no legal parcel at all** on their current board. Canoe and Waterfront hit zero ~30% of the time; Horse Riding 44%.

## The signature feel-bad moment (matches the human tester report)

The exact text players see, and why it stings:

- **Canoe Rental** -> "Canoe Rental must sit on a water-edge landscape tile." A canoe averages **under one** legal parcel on a typical board and has **none** 30% of the time. You can hire a $10k contractor you then cannot place at all, and only find out by tapping parcels one at a time. This is the clearest "I had a plan, then a technicality I did not understand blocked it, fun to stupid" trap.
- **Water-edge vs. waterfront confusion:** the reasons say "water-edge landscape tile," but the player sees their lakeside tiles labeled "Lakeside," not "water-edge." The link between the Lakeside terrain they placed and the "water-edge" a canoe/waterfront needs is never made explicit.
- **Big 2-square items** ("needs at least one half on a water-edge landscape tile", "needs strong road access from at least two sides on each parcel"): which half lands where, and which orientation is legal, is invisible until you probe with the preview. The new two-tap preview helps once you commit to a parcel, but you still cannot see the full set of legal anchors at a glance.
- **Camp Office placement:** "The Entrance and Camp Office tiles stay reserved for road services" appears whenever a player tries to build on those parcels. The deeper trap (placing the Office somewhere that strands later expansion) is a planning issue the game never warns about.

The root UX gap behind all of these: **there is no way to see which parcels a selected tile can legally occupy without tapping each one.** The reason text is individually clear; the discovery model is the problem.

## What this hands to Phase 4 (simplify vs. teach)

1. **Legal-cell highlighting (highest value, do first).** When a tile is selected or a market tile is being considered, tint every legal parcel green on the board. This single change converts all four hard tiles from "guess and get blocked" into "see your options," and makes the water-edge rule self-explanatory (the water parcels light up).
2. **Pre-purchase legality signal in the market.** Before buying, show whether you currently have any legal parcel for the tile, especially water-dependent ones. The market already flags blocked 2-square stacks; extend a lightweight "needs a lakeside parcel (you have N)" hint to single tiles like Canoe so you do not buy a dead card. (The harness shows the market already renders red "No legal..." labels on terrain-poor boards, so the data exists; surface it pre-purchase and in plainer words.)
3. **Simplify Canoe Rental (rule change, guarded by re-sim).** Canoe at 0.7 legal cells is a buy-and-cannot-place trap, not satisfying depth. Relax it to allow placement **adjacent to** a water-edge parcel (touching the lake), not only directly on one. Re-run the seeded batch to confirm balance holds. Keep Waterfront (premium, big, intentional) and Horse Riding (the Specialty column's signature risk) as-is but legible/taught.
4. **Complex-play tutorial** covering: water-edge vs. waterfront (with the Lakeside terrain called out as the water-edge), planning the Office/Entrance for expansion, and big-item orientation.
5. **Searchable rules reference** built from the (now finite-deck-accurate) rulebook, answering "where can a Canoe go" and "what counts as water-edge" in a couple of taps.

## Vocabulary fix threaded through all of the above

Pick one term and use it everywhere (board labels, tile rules text, tray messages, tutorial, rulebook): call the lakeside terrain **"waterfront"** parcels, and say water tiles **need a waterfront parcel**, instead of mixing "Lakeside," "water-edge," and "waterfront." The current split vocabulary is a large part of the confusion.
