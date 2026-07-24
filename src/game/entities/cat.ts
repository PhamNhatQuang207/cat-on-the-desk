import { sfx } from '../../engine/audio.ts';
import type { InputSource } from '../../engine/input.ts';
import { CAT, DESK, type CatBreed } from '../config.ts';
import { applySwipe } from '../systems/physics.ts';
import type { Cat, GameState, Item } from '../types.ts';

export function createCat(breed: CatBreed = 'orange'): Cat {
  return {
    breed,
    x: CAT.startX,
    facing: -1,
    swipeTimer: 0,
    swipeCooldown: 0,
    swipeConnected: true,
    staring: false,
    stareTime: 0,
    stunTimer: 0,
    bob: 0,
  };
}

/** Center of the paw hitbox for the current swipe. */
export function pawPosition(cat: Cat): { x: number; y: number } {
  const progress = 1 - cat.swipeTimer / CAT.swipeDuration;
  // The paw arcs out and back over the swipe, peaking at full reach halfway.
  const extend = Math.sin(Math.min(1, Math.max(0, progress)) * Math.PI);
  return {
    x: cat.x + cat.facing * (CAT.width * 0.3 + CAT.pawReach * extend),
    y: DESK.surfaceY - 16,
  };
}

export function isSwiping(cat: Cat): boolean {
  return cat.swipeTimer > 0;
}

export function stun(state: GameState): void {
  state.cat.stunTimer = CAT.stunDuration;
  state.cat.staring = false;
  state.cat.stareTime = 0;
  state.cat.swipeTimer = 0;
}

export function updateCat(state: GameState, input: InputSource, dt: number): void {
  const cat = state.cat;

  if (cat.stunTimer > 0) {
    cat.stunTimer -= dt;
    cat.staring = false;
    cat.stareTime = 0;
    return;
  }

  cat.staring = input.isDown('stare');
  cat.stareTime = cat.staring ? cat.stareTime + dt : 0;
  if (cat.staring && cat.stareTime > 0 && cat.stareTime - dt <= 0) sfx.stare();

  // Staring commits the cat in place — that is what makes it a real gamble.
  if (!cat.staring) {
    let dir = 0;
    if (input.isDown('left')) dir -= 1;
    if (input.isDown('right')) dir += 1;
    if (dir !== 0) {
      cat.x += dir * CAT.speed * dt;
      cat.facing = dir < 0 ? -1 : 1;
      cat.bob += dt * 11;
    } else {
      cat.bob += dt * 1.5;
    }
    cat.x = Math.max(CAT.minX, Math.min(CAT.maxX, cat.x));
  } else {
    cat.bob += dt * 1.5;
  }

  cat.swipeCooldown = Math.max(0, cat.swipeCooldown - dt);

  if (cat.swipeTimer > 0) {
    const before = cat.swipeTimer;
    cat.swipeTimer -= dt;
    const contactAt = CAT.swipeDuration * (1 - CAT.swipeContactAt);
    if (!cat.swipeConnected && before > contactAt && cat.swipeTimer <= contactAt) {
      cat.swipeConnected = true;
      resolveSwipe(state);
    }
    if (cat.swipeTimer <= 0) cat.swipeCooldown = CAT.swipeCooldown;
  } else if (input.wasPressed('swipe') && cat.swipeCooldown <= 0) {
    cat.swipeTimer = CAT.swipeDuration;
    cat.swipeConnected = false;
    sfx.swipe();
  }
}

/**
 * Applies the swipe to every item the paw sweeps through.
 *
 * The paw is treated as the whole arc from the cat's chest out to full reach,
 * not a point at maximum extension — otherwise a swipe would sail straight
 * over anything standing right next to the cat, which is exactly the thing a
 * player aims at most often.
 */
function resolveSwipe(state: GameState): void {
  const cat = state.cat;
  const near = cat.x + cat.facing * CAT.width * 0.3;
  const far = cat.x + cat.facing * (CAT.width * 0.3 + CAT.pawReach);
  const lo = Math.min(near, far);
  const hi = Math.max(near, far);
  let hit = false;

  for (const item of state.items) {
    if (item.phase !== 'resting') continue;
    if (item.rescuedBy !== null) continue;
    if (sweepHits(item, lo, hi)) {
      applySwipe(item, cat.facing);
      hit = true;
    }
  }

  if (hit) sfx.nudge();
}

/** True when the item's footprint overlaps the swept paw span. */
function sweepHits(item: Item, lo: number, hi: number): boolean {
  const halfW = item.width / 2 + CAT.pawRadius * 0.5;
  return item.x + halfW > lo && item.x - halfW < hi;
}
