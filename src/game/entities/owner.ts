/**
 * The owner: an aggro meter that fills as you misbehave, and a scheduler that
 * spends it on threats.
 */

import type { Rng } from '../../engine/rng.ts';
import { OWNER, STARE, THREAT } from '../config.ts';
import type { Difficulty } from '../systems/difficulty.ts';
import type { GameState, Owner } from '../types.ts';
import { createThreat, mostEndangeredItem, predictCatX } from './threats.ts';

export function createOwner(): Owner {
  return {
    aggro: 0,
    nextThreatIn: THREAT.intervalAtCalm,
    displayAnger: 0,
    lockedEyes: false,
  };
}

export function addAggro(owner: Owner, amount: number): void {
  owner.aggro = Math.max(0, Math.min(1, owner.aggro + amount));
}

export function updateOwner(state: GameState, rng: Rng, difficulty: Difficulty, dt: number): void {
  const owner = state.owner;
  const cat = state.cat;

  owner.lockedEyes = cat.staring;

  // Aggro creeps up on its own, faster while the cat is staring you down.
  addAggro(owner, OWNER.aggroPerSecondIdle * dt - OWNER.aggroDecayPerSecond * dt);
  if (cat.staring) addAggro(owner, STARE.aggroPerSecond * dt);

  // Ease the drawn expression toward the real value so the face doesn't snap.
  owner.displayAnger += (owner.aggro - owner.displayAnger) * Math.min(1, dt * 4);

  owner.nextThreatIn -= dt;
  if (owner.nextThreatIn > 0) return;

  const activeThreats = state.threats.filter((t) => t.phase !== 'recover').length;
  if (activeThreats >= difficulty.maxThreats) {
    owner.nextThreatIn = 0.35;
    return;
  }

  launchThreat(state, rng, difficulty);

  // Higher aggro = shorter fuse, on top of the time-based difficulty ramp.
  const interval = difficulty.threatInterval * (1 - 0.45 * owner.aggro);
  owner.nextThreatIn = Math.max(0.6, interval * rng.range(0.8, 1.2));
  addAggro(owner, -OWNER.aggroPerThreat);
}

function launchThreat(state: GameState, rng: Rng, difficulty: Difficulty): void {
  const endangered = mostEndangeredItem(state);
  const wantsRescue = endangered !== undefined && rng.next() < THREAT.hand.rescueChance;

  if (wantsRescue && endangered) {
    state.threats.push(
      createThreat(state.nextId++, 'hand', endangered.x, difficulty.telegraphScale, endangered.id),
    );
    return;
  }

  // Otherwise go after the cat. The hand is slower to arrive but covers more
  // ground; the spray is quicker but has to commit to a spot early.
  const useHand = rng.next() < 0.4;
  if (useHand) {
    const lead = THREAT.hand.telegraphTime * difficulty.telegraphScale + THREAT.hand.activeTime;
    state.threats.push(createThreat(state.nextId++, 'hand', predictCatX(state, lead), difficulty.telegraphScale));
  } else {
    state.threats.push(createThreat(state.nextId++, 'spray', state.cat.x, difficulty.telegraphScale));
  }
}
