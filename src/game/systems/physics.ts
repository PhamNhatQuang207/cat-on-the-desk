/**
 * Pure item physics. No canvas, no globals — everything here is unit-testable.
 */

import { DESK, PHYSICS, VIEW } from '../config.ts';
import type { Item } from '../types.ts';

/** Applies one paw swipe. Heavier items move less for the same swipe. */
export function applySwipe(item: Item, direction: -1 | 1, strength = PHYSICS.swipeImpulse): void {
  item.vx += (direction * strength) / item.mass;
  item.wobble = 1;
}

/**
 * True once the item's center has cleared the desk edge — the moment gravity
 * takes over. Using the center (not the near corner) is what makes an item
 * teeter on the brink instead of dropping the instant it overhangs.
 */
export function hasTippedOver(item: Item, edgeX = DESK.edgeX): boolean {
  return item.x < edgeX;
}

/** True while the item overhangs the edge at all — used for "at risk" cues. */
export function isTeetering(item: Item, edgeX = DESK.edgeX): boolean {
  return item.phase === 'resting' && item.x - item.width / 2 < edgeX;
}

/** How close to doom, 0 (safe) .. 1 (about to go over). */
export function riskLevel(item: Item, edgeX = DESK.edgeX): number {
  const overhang = edgeX - (item.x - item.width / 2);
  if (overhang <= 0) return 0;
  return Math.min(1, overhang / item.width);
}

/**
 * Advances one item by dt. Returns 'smashed' on the frame it hits the floor,
 * 'tipped' on the frame it leaves the desk, otherwise null.
 */
export function stepItem(item: Item, dt: number): 'tipped' | 'smashed' | null {
  if (item.phase === 'destroyed') return null;

  item.wobble = Math.max(0, item.wobble - dt * 3);

  if (item.phase === 'resting') {
    item.x += item.vx * dt;

    // Friction opposes motion and never pushes the item backwards.
    const drag = PHYSICS.friction * dt;
    if (Math.abs(item.vx) <= drag) item.vx = 0;
    else item.vx -= Math.sign(item.vx) * drag;
    if (Math.abs(item.vx) < PHYSICS.restSpeed) item.vx = 0;

    // The far end of the desk is a wall (the owner's monitor stand, say).
    const maxX = DESK.rightX - item.width / 2;
    if (item.x > maxX) {
      item.x = maxX;
      item.vx = Math.min(0, item.vx);
    }

    if (hasTippedOver(item)) {
      item.phase = 'tipping';
      item.vy = 0;
      // Tip in the direction of travel so it pitches off the edge naturally.
      item.spin = (item.vx < 0 ? -1 : 1) * 3.2 - 1.6;
      return 'tipped';
    }
    return null;
  }

  // Airborne: 'tipping' is just the first stretch of the fall, kept as a
  // separate phase so the renderer can pitch it over the edge convincingly.
  item.vy += PHYSICS.gravity * dt;
  item.x += item.vx * dt;
  item.y += item.vy * dt;
  item.rotation += item.spin * dt;

  if (item.phase === 'tipping' && item.vy > 120) item.phase = 'falling';

  if (item.y >= PHYSICS.floorY) {
    item.phase = 'destroyed';
    return 'smashed';
  }
  return null;
}

/** Keeps a value inside the visible play area. */
export function clampToDesk(x: number, halfWidth = 0): number {
  return Math.max(DESK.edgeX + halfWidth, Math.min(DESK.rightX - halfWidth, x));
}

export function clampToView(x: number): number {
  return Math.max(0, Math.min(VIEW.width, x));
}
