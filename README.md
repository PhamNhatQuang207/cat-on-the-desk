# Cat on a Desk (Don't Touch Anything!)

You are a cat. There is a desk. On the desk are expensive, fragile things.
Your owner would very much like them to stay there.

An endless arcade browser game. The desk drops away on **both** sides — shove
everything off whichever edge is closer, and dodge the spray bottle for as
long as you can manage.

▶ **Play it live:** https://phamnhatquang207.github.io/cat-on-the-desk/

## Play

```bash
npm install
npm run dev      # http://localhost:5173
```

## Controls

| Key | Action |
| --- | --- |
| `←` `→` / `A` `D` | Prowl along the desk (and pick which edge to push toward) |
| `Space` | Paw swipe — heavy things need several |
| `P` / `Esc` | Pause |
| `Enter` / `Space` | Start / restart from the title and game-over screens |

On a touchscreen, thumb controls fade in automatically: `◀` `▶` to prowl (and
to browse cats on the title screen), and the paw button — or a tap anywhere on
the desk — to swipe. The `☰` button at the top of the screen pauses and opens a
menu, where the thumb buttons can be resized (small/medium/large, remembered in
`localStorage`); the buttons stay visible behind the menu so the new size is
previewed on the real thing.

The desk needs the width, so a phone held upright gets a rotate prompt and the
run freezes until it is turned back — it stays paused afterwards rather than
dropping you back mid-spray. A tall *desktop* window is left alone; it only
applies to touch devices.

## How it works

- **Two doom edges.** The desk drops off on the left *and* the right. Items
  spawn in the middle; you pick which way to send them. Once an item's centre
  clears either edge it tips, falls, and smashes for its value.
- **Mass is the difficulty.** A water glass skitters off with one swipe; a
  monitor has to be walked to the edge over many. Heavy items are worth far
  more, so the greedy play is also the slow, exposed one.
- **Combos** chain knock-offs within ~4 seconds for an extra multiplier.
- **The owner escalates.** A spray bottle locks onto where you are and fires
  after a beat; a hand sweeps in to grab you — or to rescue whatever you have
  nudged closest to the brink. Both are telegraphed, and both are always
  dodgeable if you move during the telegraph. Three hits and you're off the desk.
- **It never stops getting harder.** Threats come faster, telegraphs get
  shorter, and the item mix shifts toward the heavy expensive stuff. The ramp is
  driven by **both elapsed time and score** (`elapsed / 150s + score / 12000`,
  clamped to 1), so a fast scorer is pushed as hard as a slow survivor.

High score is kept in `localStorage`.

## Development

```bash
npm test         # Vitest: physics, scoring, difficulty, and full-run integration
npm run typecheck
npm run build && npm run preview
```

All gameplay tuning lives in one place — `src/game/config.ts`. If something
feels wrong while playing, change it there; nothing else holds a magic number.

## Layout

```
src/
  engine/      Framework-agnostic bits: fixed-timestep loop, input, seeded RNG, WebAudio synth
  game/
    config.ts  Every tuning constant in the game — start here to change how it feels
    game.ts    The update step, tying all systems together
    entities/  Cat, items, owner, threats
    systems/   Pure, unit-tested logic: physics, scoring, difficulty, spawning
  render/      Canvas drawing — scene, procedural sprites, HUD, overlays
```

There are no image or audio assets: every sprite is drawn with Canvas 2D paths
and every sound is synthesized with WebAudio at runtime. The systems under
`src/game/systems/` are pure functions, which is why the test suite can drive a
complete 3-minute run headlessly.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which typechecks,
runs the tests, builds, and publishes `dist/` to GitHub Pages. A broken commit
never reaches the live site because the deploy is gated on those checks.
