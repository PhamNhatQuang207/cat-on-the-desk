import { createCat } from './entities/cat.ts';
import { createOwner } from './entities/owner.ts';
import { loadHighScore } from './systems/scoring.ts';
import type { GameState } from './types.ts';

export function createGameState(): GameState {
  return {
    phase: 'title',
    elapsed: 0,
    score: 0,
    highScore: loadHighScore(),
    strikes: 0,

    cat: createCat(),
    owner: createOwner(),
    items: [],
    threats: [],
    floaters: [],
    shards: [],

    combo: 0,
    comboTimer: 0,

    spawnTimer: 0,
    shake: 0,
    destroyed: 0,
    nextId: 1,
    flash: 0,
  };
}

/** Resets everything except the persisted high score, and starts a run. */
export function startRun(state: GameState): void {
  const highScore = state.highScore;
  Object.assign(state, createGameState());
  state.highScore = highScore;
  state.phase = 'playing';
}
