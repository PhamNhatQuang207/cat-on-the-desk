/**
 * Owner threats. Both share a telegraph -> active -> recover lifecycle so the
 * rule "every threat is dodgeable if you react during its telegraph" holds.
 */

import { sfx } from '../../engine/audio.ts';
import { CAT, DESK, THREAT } from '../config.ts';
import { clampToDesk, riskLevel } from '../systems/physics.ts';
import type { GameState, Item, Threat, ThreatKind } from '../types.ts';
import { stun } from './cat.ts';
import { findItemById } from './item.ts';

export function createThreat(
  id: number,
  kind: ThreatKind,
  x: number,
  telegraphScale: number,
  targetItemId: number | null = null,
): Threat {
  const base = kind === 'spray' ? THREAT.spray.trackTime : THREAT.hand.telegraphTime;
  const duration = base * telegraphScale;
  return {
    id,
    kind,
    phase: 'telegraph',
    timer: duration,
    phaseDuration: duration,
    x,
    tracking: kind === 'spray',
    targetItemId,
    resolved: false,
  };
}

function enter(threat: Threat, phase: Threat['phase'], duration: number): void {
  threat.phase = phase;
  threat.timer = duration;
  threat.phaseDuration = duration;
}

/** Radius within which a threat connects with the cat. */
function hitRadius(threat: Threat): number {
  return threat.kind === 'spray' ? THREAT.spray.radius : THREAT.hand.radius;
}

/** Advances all threats; removes the ones that have finished recovering. */
export function updateThreats(state: GameState, telegraphScale: number, dt: number): void {
  for (const threat of state.threats) {
    threat.timer -= dt;

    if (threat.kind === 'spray') updateSpray(state, threat, telegraphScale, dt);
    else updateHand(state, threat, telegraphScale, dt);
  }

  state.threats = state.threats.filter((t) => !(t.phase === 'recover' && t.timer <= 0));
}

function updateSpray(state: GameState, threat: Threat, scale: number, _dt: number): void {
  if (threat.phase === 'telegraph') {
    // Reticle follows the cat until lock-on, then commits to a fixed spot.
    if (threat.tracking) threat.x = state.cat.x;
    if (threat.timer <= 0) {
      if (threat.tracking) {
        threat.tracking = false;
        enter(threat, 'telegraph', THREAT.spray.lockTime * scale);
      } else {
        enter(threat, 'active', THREAT.spray.activeTime);
        sfx.spray();
      }
    }
    return;
  }

  if (threat.phase === 'active') {
    if (!threat.resolved && Math.abs(state.cat.x - threat.x) < hitRadius(threat)) {
      threat.resolved = true;
      hitCat(state, 'spray');
    }
    if (threat.timer <= 0) enter(threat, 'recover', THREAT.spray.recoverTime);
  }
}

function updateHand(state: GameState, threat: Threat, _scale: number, dt: number): void {
  if (threat.phase === 'telegraph') {
    if (threat.timer <= 0) {
      enter(threat, 'active', THREAT.hand.activeTime);
      sfx.grab();
    }
    return;
  }

  if (threat.phase === 'active') {
    const rescue = findItemById(state.items, threat.targetItemId);
    if (rescue && rescue.phase === 'resting') {
      // Dragging an item back to safety.
      rescue.rescuedBy = threat.id;
      rescue.vx = 0;
      rescue.x = clampToDesk(rescue.x + THREAT.hand.rescueSpeed * dt, rescue.width / 2);
      threat.x = rescue.x;
    } else if (!threat.resolved && Math.abs(state.cat.x - threat.x) < hitRadius(threat)) {
      threat.resolved = true;
      hitCat(state, 'hand');
    }

    if (threat.timer <= 0) {
      if (rescue) rescue.rescuedBy = null;
      enter(threat, 'recover', THREAT.hand.recoverTime);
    }
  }
}

function hitCat(state: GameState, kind: ThreatKind): void {
  // A cat already reeling from one hit doesn't take a second.
  if (state.cat.stunTimer > 0) return;

  stun(state);
  state.strikes += 1;
  state.combo = 0;
  state.comboTimer = 0;
  state.shake = Math.min(14, state.shake + 12);
  state.floaters.push({
    x: state.cat.x,
    y: DESK.surfaceY - CAT.height - 30,
    text: kind === 'spray' ? 'SPRAYED!' : 'CAUGHT!',
    color: '#ff5a6e',
    life: 1,
    scale: 1.25,
  });
  sfx.hiss();
}

/** Picks the item most in need of rescue, or undefined if nothing is at risk. */
export function mostEndangeredItem(state: GameState): Item | undefined {
  let best: Item | undefined;
  let bestRisk = 0.15;
  for (const item of state.items) {
    if (item.phase !== 'resting' || item.rescuedBy !== null) continue;
    const risk = riskLevel(item);
    if (risk > bestRisk) {
      bestRisk = risk;
      best = item;
    }
  }
  return best;
}

/** Where the hand should reach to catch the cat, accounting for its dodge range. */
export function predictCatX(state: GameState, leadTime: number): number {
  return clampToDesk(state.cat.x + state.cat.facing * CAT.speed * leadTime * 0.35);
}
