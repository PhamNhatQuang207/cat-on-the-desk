# Cat on a Desk (Don't Touch Anything!)

You are a cat. There is a desk. On the desk are expensive, fragile things.
Your owner would very much like them to stay there.

An endless arcade browser game. Push everything off the edge, hold eye contact
with your owner while you do it, and dodge the spray bottle for as long as you
can manage.

## Play

```bash
npm install
npm run dev      # http://localhost:5173
```

## Controls

| Key | Action |
| --- | --- |
| `←` `→` / `A` `D` | Prowl along the desk |
| `Space` | Paw swipe — heavy things need several |
| `Shift` (hold) | Hold eye contact: builds up to a **x3** multiplier, but you cannot move |
| `P` / `Esc` | Pause |

## How it works

- **Mass is the difficulty.** A water glass skitters off with one swipe; a
  monitor has to be walked to the edge over many. Heavy items are worth far
  more, so the greedy play is also the slow, exposed one.
- **Eye contact is the gamble.** Staring roots you in place and fills the
  owner's anger faster — but anything that hits the floor while you're staring
  scores at up to triple. The intended play is to get something teetering, then
  turn and stare while it goes over.
- **Combos** chain knock-offs within ~4 seconds for an extra multiplier.
- **The owner escalates.** A spray bottle locks onto where you are and fires
  after a beat; a hand sweeps in to grab you — or to rescue whatever you have
  nudged closest to the brink. Both are telegraphed, and both are always
  dodgeable if you move during the telegraph. Three hits and you're off the desk.
- **It never stops getting harder.** Threats come faster, telegraphs get
  shorter, and the item mix shifts toward the heavy expensive stuff, driven by
  both elapsed time and score.

High score is kept in `localStorage`.

## Development

```bash
npm test         # Vitest: physics, scoring, difficulty, and full-run integration
npm run typecheck
npm run build && npm run preview
```

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
and every sound is synthesized with WebAudio at runtime.

Gameplay tuning lives entirely in `src/game/config.ts`. The systems under
`src/game/systems/` are pure functions, which is why the test suite can drive a
complete 3-minute run headlessly.
