## Goal

Replace the current "click arrow → random math picks a target" flow with a skill-based throw inspired by darts.frvr.com:

- Desktop: mouse press → drag up → release to throw. Drag vector = aim + power.
- Mobile/touch: finger press → swipe up → release. Same vector model.
- The dart is the input handle itself — no separate Launch button anywhere in the throw loop.
- Where the dart lands is determined by the player's swipe (≥90% skill), with only a tiny micro-jitter for realism.

## Decisions locked

- **Out-of-board swipes are clamped** to the nearest valid ring/number — every dart scores.
- **CPU keeps the same animated swipe path** (synthetic swipe aimed at `computeCPUMove`'s pick) so visuals stay consistent for both players.
- **Game logic untouched**: `gameLogic.ts`, scoring, batch system, closing rules are not modified. We only change *how a target is chosen*, not what happens after.
- **Contract / Supabase / Switchboard untouched**: `onHitNumber` / `onHitRing` callbacks fire exactly as before, so on-chain submit, verified score, and realtime sync keep working unchanged.

## UX flow

1. At idle, a dart sits anchored at the bottom-center of the board area pointing up at the board.
2. Player presses (mouse or touch) on the dart. The dart sticks to the pointer and follows it as they drag — longer / straighter upward swipe = more power and higher aim.
3. While dragging, a faint aim guide (dotted arc + landing reticle) previews the predicted landing point on the board in real time.
4. On release:
   - If swipe was too short or downward (power < 0.1) → throw is canceled, dart snaps back, **no dart consumed**.
   - Otherwise the dart flies along the predicted arc to the computed landing point, sticks, and triggers the existing hit/ring resolution pipeline.
5. Repeat for the player's 3 darts. CPU's turn animates the exact same way.

## Skill model (≥90% player-controlled)

Landing point is computed deterministically from the release vector:

```text
swipe   = releasePoint - pressPoint           (screen px)
power   = clamp(|swipe.y_up| / H_ref, 0..1)   // upward component
aimX    = clamp(swipe.x / W_ref, -1..1)       // lateral aim
landing = boardCenter + (aimX * boardRadius, -power * boardRadius * verticalCurve)
jitter  = gaussian(σ ≈ 6px, capped)           // <5% noise
final   = landing + jitter
```

Then map `final` to the nearest board element using the existing `RING_RADII` / `BOARD_LAYOUT` geometry:
- If `final` is within ±tol of a ring-line radius → ring hit → existing `onHitRing(ringIdx, dartPos)`.
- Else find nearest gem dot by Euclidean distance → number hit → existing `onHitNumber(num, dartPos)`.
- If `final` falls outside the outer ring → **clamp** the radius to the outer ring and re-resolve (so every dart still scores). The dart visually sticks at the clamped point.

`resolveDartLanding`'s `Math.random()` branch is removed entirely from the human path.

## Code changes

### `src/components/Dartboard.tsx` (main rewrite)
- Remove the random `resolveDartLanding`.
- Add `computeLanding(swipeVec, boardRectPx)` deterministic helper.
- Add Pointer Events handlers (`onPointerDown` / `Move` / `Up` / `Cancel`) on a transparent full-area `<div>` wrapping the SVG, with `setPointerCapture` so drags continue outside the SVG.
- Track `aimState: { pressX, pressY, curX, curY } | null`.
- Render the dart at `(pressX, pressY)` while dragging; rotate based on `atan2` of the swipe so it tilts as the player aims.
- Render an SVG aim guide (dotted polyline + reticle) while aiming.
- On release, reuse the second half of the existing `handleDartArrowClick` pipeline (flight animation, `DART_HIT_IMPACT` dispatch, `setStuckDarts`, `onHitNumber` / `onHitRing` calls) — that is the part that talks to game logic and must stay byte-identical in behavior.
- Disable input when `disabled || gameState.gameOver || boardPhase === 'throwing'`.
- Add `synthesizeSwipeFor(target)` — used by CPU turn: builds the swipe vector that would land on `computeCPUMove`'s pick, then runs the same release pipeline so the animation looks identical to a human throw. CPU pick logic (in `gameLogic.ts`) is unchanged.
- Keep `REMOTE_HIT_ANIMATION` listener untouched (multiplayer spectator path).
- Keep dispatching `THROW_DART` event on release so `Index.tsx`'s `isDartFlying` state and any audio listeners keep firing.

### `src/pages/Index.tsx`
- Remove the standalone `<DartArrow>` JSX (the launch-button area).
- Remove its `THROW_DART` click wiring; Dartboard owns the gesture now.
- The `DART_HIT_IMPACT` / `THROW_DART` window-event listeners stay (still used for `isDartFlying`).
- Layout collapses the freed space; board grows slightly to fill.

### `DartArrow` export
- Grep for other consumers. If unused outside `Index.tsx`, delete the export. If used elsewhere, leave it intact.

## Safety: what stays the same

- `gameLogic.ts` — zero changes.
- `hitNumber` / `hitRing` callback shape — zero changes.
- `latestDart` payload shape (`{x, y, angle, tilt, playerIdx}`) — zero changes, so Supabase realtime broadcast and `Dartboard`'s spectator sync keep working.
- Contract submit flow (`submitVerifiedResult`, Switchboard fetch, `match_hits` writes) — zero changes; it reads from the same game state.

## Tech details

- Pointer Events unify mouse + touch in one handler set.
- `preventDefault` on touch/pointermove during aim to stop page scroll.
- `W_ref` / `H_ref` derived from the SVG's bounding rect so aim scales across the responsive 280 / 380 / 450 board sizes.
- Cancel threshold: power < 0.1 → snap-back, no dart consumed.
- Flight animation timing (560 ms) preserved.

## Files touched

- `src/components/Dartboard.tsx` — rewrite throw mechanic (largest change)
- `src/pages/Index.tsx` — remove DartArrow / launch button usage in the throw area

No other files modified.
