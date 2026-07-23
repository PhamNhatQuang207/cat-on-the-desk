/** Keeps the desk stocked with things worth destroying. */

import type { Rng } from '../../engine/rng.ts';
import { ITEM_SPECS, SPAWN, type ItemKind } from '../config.ts';
import { createItem } from '../entities/item.ts';
import type { GameState } from '../types.ts';
import type { Difficulty } from './difficulty.ts';

const KINDS = Object.keys(ITEM_SPECS) as ItemKind[];

/** Finds a spot on the owner's half that isn't already occupied. */
function findFreeX(state: GameState, rng: Rng, width: number): number | null {
  for (let attempt = 0; attempt < 12; attempt++) {
    const x = rng.range(SPAWN.minX, SPAWN.maxX);
    const clear = state.items.every((item) => {
      if (item.phase !== 'resting') return true;
      const gap = Math.max(SPAWN.minGap, (item.width + width) / 2 + 12);
      return Math.abs(item.x - x) >= gap;
    });
    if (clear) return x;
  }
  return null;
}

export function updateSpawner(state: GameState, rng: Rng, difficulty: Difficulty, dt: number): void {
  const alive = state.items.filter((i) => i.phase !== 'destroyed').length;
  if (alive >= SPAWN.maxItems) return;

  state.spawnTimer -= dt;
  // An empty desk is a boring desk — refill it immediately.
  const urgent = alive === 0;
  if (state.spawnTimer > 0 && !urgent) return;
  if (alive >= SPAWN.targetItems && !urgent) {
    state.spawnTimer = SPAWN.interval;
    return;
  }

  const kind = rng.weighted(
    KINDS,
    KINDS.map((k) => difficulty.itemWeights[k]),
  );
  const x = findFreeX(state, rng, ITEM_SPECS[kind].width);
  if (x === null) {
    state.spawnTimer = SPAWN.interval * 0.5;
    return;
  }

  state.items.push(createItem(state.nextId++, kind, x));
  state.spawnTimer = SPAWN.interval;
}

/** Drops destroyed items once their shards have been emitted. */
export function pruneItems(state: GameState): void {
  state.items = state.items.filter((i) => i.phase !== 'destroyed');
}
