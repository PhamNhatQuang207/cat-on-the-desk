import { createCat } from './entities/cat.ts';
import { createOwner } from './entities/owner.ts';
import { loadSelectedBreed } from './systems/breeds.ts';
import { loadHighScore } from './systems/scoring.ts';
import type { GameState } from './types.ts';

export function createGameState(): GameState {
  const selectedBreed = loadSelectedBreed();
  return {
    phase: 'title',
    elapsed: 0,
    score: 0,
    highScore: loadHighScore(),
    strikes: 0,
    selectedBreed,

    cat: createCat(selectedBreed),
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

/** Resets everything except the persisted high score and chosen breed, and starts a run. */
export function startRun(state: GameState): void {
  const highScore = state.highScore;
  const selectedBreed = state.selectedBreed;
  Object.assign(state, createGameState());
  state.highScore = highScore;
  state.selectedBreed = selectedBreed;
  state.cat = createCat(selectedBreed);
  state.phase = 'playing';
}
