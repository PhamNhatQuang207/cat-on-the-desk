/** The update step: ties every system together for one simulation tick. */

import { sfx } from '../engine/audio.ts';
import type { InputSource } from '../engine/input.ts';
import { Rng } from '../engine/rng.ts';
import { CAT_BREED_ORDER, COLORS, DESK, FX, ITEM_SPECS, OWNER, PHYSICS, VIEW } from './config.ts';
import { updateCat } from './entities/cat.ts';
import { addAggro, updateOwner } from './entities/owner.ts';
import { updateThreats } from './entities/threats.ts';
import { saveSelectedBreed } from './systems/breeds.ts';
import { difficultyAt } from './systems/difficulty.ts';
import { stepItem } from './systems/physics.ts';
import { comboMultiplier, decayCombo, extendCombo, saveHighScore, scoreForItem, stareMultiplier } from './systems/scoring.ts';
import { pruneItems, updateSpawner } from './systems/spawn.ts';
import { startRun } from './state.ts';
import type { GameState, Item } from './types.ts';

const rng = new Rng();

export function updateGame(state: GameState, input: InputSource, dt: number): void {
  updateFx(state, dt);

  switch (state.phase) {
    case 'title':
      if (input.wasPressed('left')) cycleBreed(state, -1);
      else if (input.wasPressed('right')) cycleBreed(state, 1);
      if (input.wasPressed('swipe') || input.wasPressed('confirm')) {
        startRun(state);
        sfx.meow();
      }
      break;

    case 'gameover':
      if (input.wasPressed('swipe') || input.wasPressed('confirm')) {
        startRun(state);
        sfx.meow();
      }
      break;

    case 'paused':
      if (input.wasPressed('pause') || input.wasPressed('confirm')) state.phase = 'playing';
      break;

    case 'playing':
      if (input.wasPressed('pause')) {
        state.phase = 'paused';
        break;
      }
      updatePlaying(state, input, dt);
      break;
  }

  input.endFrame();
}

function cycleBreed(state: GameState, dir: -1 | 1): void {
  const order = CAT_BREED_ORDER;
  const index = order.indexOf(state.selectedBreed);
  const next = order[(index + dir + order.length) % order.length]!;
  state.selectedBreed = next;
  saveSelectedBreed(next);
  sfx.nudge();
}

function updatePlaying(state: GameState, input: InputSource, dt: number): void {
  state.elapsed += dt;
  const difficulty = difficultyAt(state.elapsed, state.score);

  updateCat(state, input, dt);
  updateOwner(state, rng, difficulty, dt);
  updateThreats(state, difficulty.telegraphScale, dt);
  updateItems(state, dt);
  updateSpawner(state, rng, difficulty, dt);
  pruneItems(state);

  const decayed = decayCombo(state.combo, state.comboTimer, dt);
  state.combo = decayed.combo;
  state.comboTimer = decayed.comboTimer;

  if (state.strikes >= OWNER.maxStrikes) endRun(state);
}

function updateItems(state: GameState, dt: number): void {
  for (const item of state.items) {
    // A rescued item is under the owner's control, not physics'.
    if (item.rescuedBy !== null && item.phase === 'resting') continue;

    const event = stepItem(item, dt);
    if (event === 'tipped') onTipped(state, item);
    else if (event === 'smashed') onSmashed(state, item);
  }
}

function onTipped(state: GameState, item: Item): void {
  state.shake = Math.min(FX.maxShake, state.shake + 3);
  state.floaters.push({
    x: item.x,
    y: DESK.surfaceY - item.height - 16,
    text: 'timber…',
    color: COLORS.dim,
    life: 0.6,
    scale: 0.85,
  });
}

function onSmashed(state: GameState, item: Item): void {
  const stareMult = stareMultiplier(state.cat.stareTime, state.cat.staring);
  const combo = extendCombo(state.combo);
  state.combo = combo.combo;
  state.comboTimer = combo.comboTimer;

  const points = scoreForItem(item.points, state.combo, stareMult);
  state.score += points;
  state.destroyed += 1;
  state.flash = 1;
  state.shake = Math.min(FX.maxShake, state.shake + (item.fragile ? 7 : 11));

  addAggro(state.owner, OWNER.aggroPerSmash);

  if (item.fragile) sfx.smash(item.points);
  else sfx.thud();
  if (state.combo > 1) sfx.combo(Math.min(6, state.combo - 1));

  const label = ITEM_SPECS[item.kind].label;
  const multText =
    stareMult > 1.05 ? `  👁️ x${stareMult.toFixed(1)}` : state.combo > 1 ? `  x${comboMultiplier(state.combo)}` : '';

  // Show the payoff where the item actually went over, clamped on-screen.
  const fx = Math.max(60, Math.min(VIEW.width - 60, item.x));
  state.floaters.push({
    x: fx,
    y: DESK.surfaceY + 70,
    text: `${label} +${points}${multText}`,
    color: stareMult > 1.05 ? COLORS.warn : COLORS.good,
    life: 1,
    scale: 1 + Math.min(0.6, points / 900),
  });

  emitShards(state, fx, item.fragile);
}

function emitShards(state: GameState, atX: number, fragile: boolean): void {
  const count = fragile ? 14 : 8;
  const color = fragile ? '#cfe8ff' : '#8a7f9c';
  for (let i = 0; i < count; i++) {
    state.shards.push({
      x: atX + rng.range(-30, 40),
      y: PHYSICS.floorY - 6,
      vx: rng.range(-220, 260),
      vy: rng.range(-420, -120),
      rotation: rng.range(0, Math.PI * 2),
      spin: rng.range(-9, 9),
      size: rng.range(3, 8),
      color,
      life: 1,
    });
  }
}

function updateFx(state: GameState, dt: number): void {
  state.shake = Math.max(0, state.shake - FX.shakeDecay * dt * (1 + state.shake * 0.1));
  state.flash = Math.max(0, state.flash - dt * 3);

  for (const floater of state.floaters) {
    floater.life -= dt / FX.floaterLife;
    floater.y -= FX.floaterRise * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);

  for (const shard of state.shards) {
    shard.life -= dt * 0.8;
    shard.vy += PHYSICS.gravity * 0.55 * dt;
    shard.x += shard.vx * dt;
    shard.y += shard.vy * dt;
    shard.rotation += shard.spin * dt;

    // Skitter along the floor instead of sinking through it.
    if (shard.y > PHYSICS.floorY) {
      shard.y = PHYSICS.floorY;
      shard.vy *= -0.4;
      shard.vx *= 0.7;
      shard.spin *= 0.6;
    }
  }
  state.shards = state.shards.filter((s) => s.life > 0);
}

function endRun(state: GameState): void {
  state.phase = 'gameover';
  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveHighScore(state.score);
  }
  sfx.gameOver();
}
