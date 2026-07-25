/**
 * End-to-end tests over the real update step. These drive `updateGame` with a
 * scripted input source, so they exercise the same code path the browser does
 * — including the parts (holding a key down) that are impractical to drive
 * through browser automation.
 */

import { describe, expect, it } from 'vitest';
import type { Action, InputSource } from '../engine/input.ts';
import { CAT, CAT_BREED_ORDER, DESK, OWNER } from './config.ts';
import { createItem } from './entities/item.ts';
import { updateGame } from './game.ts';
import { createGameState } from './state.ts';
import type { GameState } from './types.ts';

const STEP = 1 / 60;

/** An input source a test can hold down and tap, exactly like a player. */
class FakeInput implements InputSource {
  private down = new Set<Action>();
  private pressed = new Set<Action>();

  hold(action: Action): void {
    if (!this.down.has(action)) this.pressed.add(action);
    this.down.add(action);
  }

  release(action: Action): void {
    this.down.delete(action);
  }

  tap(action: Action): void {
    this.pressed.add(action);
  }

  isDown(action: Action): boolean {
    return this.down.has(action);
  }

  wasPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  endFrame(): void {
    this.pressed.clear();
  }
}

function run(state: GameState, input: FakeInput, seconds: number, onFrame?: (frame: number) => void): void {
  const frames = Math.round(seconds / STEP);
  for (let f = 0; f < frames; f++) {
    onFrame?.(f);
    updateGame(state, input, STEP);
  }
}

/** A run in progress with the owner disabled, so tests are deterministic. */
function startedGame(): { state: GameState; input: FakeInput } {
  const state = createGameState();
  const input = new FakeInput();
  input.tap('swipe');
  updateGame(state, input, STEP);
  expect(state.phase).toBe('playing');

  // Push the owner's next threat far into the future; threat behavior has its
  // own tests, and here it would just randomly stun the cat mid-assertion.
  state.owner.nextThreatIn = 1e6;
  return { state, input };
}

/** Walks the cat toward targetX using real input, giving up after maxSeconds. */
function approach(state: GameState, input: FakeInput, targetX: number, maxSeconds: number): void {
  const frames = Math.round(maxSeconds / STEP);
  for (let f = 0; f < frames; f++) {
    const delta = targetX - state.cat.x;
    if (Math.abs(delta) < 6) break;
    input.release(delta < 0 ? 'right' : 'left');
    input.hold(delta < 0 ? 'left' : 'right');
    updateGame(state, input, STEP);
  }
  input.release('left');
  input.release('right');
}

/** Replaces the spawned desk contents with exactly one item. */
function onlyItem(state: GameState, kind: Parameters<typeof createItem>[1], x: number) {
  const item = createItem(state.nextId++, kind, x);
  state.items = [item];
  return item;
}

describe('phase transitions', () => {
  it('starts on the title screen and begins a run on swipe', () => {
    const state = createGameState();
    const input = new FakeInput();
    expect(state.phase).toBe('title');

    input.tap('swipe');
    updateGame(state, input, STEP);
    expect(state.phase).toBe('playing');
  });

  it('pauses and resumes without ending the run', () => {
    const { state, input } = startedGame();
    input.tap('pause');
    updateGame(state, input, STEP);
    expect(state.phase).toBe('paused');

    const scoreWhilePaused = state.score;
    run(state, input, 1);
    expect(state.phase).toBe('paused');
    expect(state.score).toBe(scoreWhilePaused);

    input.tap('pause');
    updateGame(state, input, STEP);
    expect(state.phase).toBe('playing');
  });

  it('ends the run after the maximum strikes and restarts on swipe', () => {
    const { state, input } = startedGame();
    state.strikes = OWNER.maxStrikes;
    updateGame(state, input, STEP);
    expect(state.phase).toBe('gameover');

    input.tap('swipe');
    updateGame(state, input, STEP);
    expect(state.phase).toBe('playing');
    expect(state.strikes).toBe(0);
    expect(state.score).toBe(0);
  });
});

describe('cat selection', () => {
  it('cycles breeds on the title screen with left/right, wrapping at the ends', () => {
    const state = createGameState();
    const input = new FakeInput();
    expect(state.selectedBreed).toBe(CAT_BREED_ORDER[0]);

    input.tap('right');
    updateGame(state, input, STEP);
    expect(state.selectedBreed).toBe(CAT_BREED_ORDER[1]);

    input.tap('left');
    updateGame(state, input, STEP);
    expect(state.selectedBreed).toBe(CAT_BREED_ORDER[0]);

    // Wraps to the last breed going left from the first.
    input.tap('left');
    updateGame(state, input, STEP);
    expect(state.selectedBreed).toBe(CAT_BREED_ORDER[CAT_BREED_ORDER.length - 1]);
  });

  it('starts a run with the breed selected on the title screen', () => {
    const state = createGameState();
    const input = new FakeInput();

    input.tap('right');
    updateGame(state, input, STEP);
    input.tap('right');
    updateGame(state, input, STEP);
    expect(state.selectedBreed).toBe(CAT_BREED_ORDER[2]);

    input.tap('swipe');
    updateGame(state, input, STEP);
    expect(state.phase).toBe('playing');
    expect(state.cat.breed).toBe(CAT_BREED_ORDER[2]);
  });

  it('lets the player switch breeds again from the game-over screen', () => {
    const state = createGameState();
    const input = new FakeInput();
    input.tap('swipe');
    updateGame(state, input, STEP);
    state.strikes = OWNER.maxStrikes;
    updateGame(state, input, STEP);
    expect(state.phase).toBe('gameover');
    const initialBreed = state.selectedBreed;

    input.tap('right');
    updateGame(state, input, STEP);
    const newBreed = CAT_BREED_ORDER[(CAT_BREED_ORDER.indexOf(initialBreed) + 1) % CAT_BREED_ORDER.length];
    expect(state.selectedBreed).toBe(newBreed);
    expect(state.phase).toBe('gameover');

    input.tap('swipe');
    updateGame(state, input, STEP);
    expect(state.phase).toBe('playing');
    expect(state.cat.breed).toBe(newBreed);
  });
});

describe('movement', () => {
  it('walks left while the key is held and stops at the desk edge', () => {
    const { state, input } = startedGame();
    input.hold('left');
    run(state, input, 4);

    expect(state.cat.facing).toBe(-1);
    expect(state.cat.x).toBeCloseTo(CAT.minX, 0);
  });

  it('cannot walk off the right edge of the desk', () => {
    const { state, input } = startedGame();
    input.hold('right');
    run(state, input, 4);

    expect(state.cat.facing).toBe(1);
    expect(state.cat.x).toBeCloseTo(CAT.maxX, 0);
  });
});

describe('the core loop: swipe an item off the desk', () => {
  it('scores a mug knocked off by paw swipes', () => {
    const { state, input } = startedGame();
    const mug = onlyItem(state, 'mug', DESK.edgeX + 120);
    state.cat.x = mug.x + 70;

    input.hold('left');
    run(state, input, 0.2);
    input.release('left');

    // Swipe until it is gone, or give up after a generous number of tries.
    let swipes = 0;
    while (state.destroyed === 0 && swipes < 15) {
      input.tap('swipe');
      run(state, input, 0.5);
      swipes++;
    }

    expect(state.destroyed).toBe(1);
    expect(state.score).toBeGreaterThan(0);
    expect(state.items.some((i) => i.id === mug.id)).toBe(false);
  });

  it('scores a mug knocked off the right edge too', () => {
    const { state, input } = startedGame();
    const mug = onlyItem(state, 'mug', DESK.rightEdgeX - 200);
    state.cat.x = mug.x - 70;

    // Face right, standing just left of the mug, then swipe it toward the
    // right-hand drop — the mirror image of the left-edge case above.
    input.hold('right');
    run(state, input, 0.2);
    input.release('right');
    expect(state.cat.facing).toBe(1);

    let swipes = 0;
    while (state.destroyed === 0 && swipes < 15) {
      input.tap('swipe');
      run(state, input, 0.5);
      swipes++;
    }

    expect(state.destroyed).toBe(1);
    expect(state.score).toBeGreaterThan(0);
    expect(mug.x).toBeGreaterThan(DESK.rightEdgeX);
  });

  it('needs more swipes for a monitor than for a glass', () => {
    const swipesToDestroy = (kind: 'glass' | 'monitor'): number => {
      const { state, input } = startedGame();
      const item = onlyItem(state, kind, DESK.edgeX + 260);
      state.cat.x = item.x + 60;

      let swipes = 0;
      while (state.destroyed === 0 && swipes < 40) {
        // Follow the item the way a player would, then swipe again.
        approach(state, input, item.x + 55, 2);
        input.tap('swipe');
        run(state, input, 0.6);
        swipes++;
      }
      expect(state.destroyed).toBe(1);
      return swipes;
    };

    expect(swipesToDestroy('monitor')).toBeGreaterThan(swipesToDestroy('glass'));
  });

  it('builds a combo across consecutive knock-offs', () => {
    const { state, input } = startedGame();
    state.items = [
      createItem(state.nextId++, 'glass', DESK.edgeX + 2),
      createItem(state.nextId++, 'glass', DESK.edgeX + 3),
    ];
    for (const item of state.items) item.vx = -80;

    run(state, input, 1.5);
    expect(state.destroyed).toBe(2);
    expect(state.combo).toBe(2);
    // Second item is worth more than the first thanks to the combo.
    expect(state.score).toBeGreaterThan(2 * state.items.length);
  });
});

describe('the desk stays stocked', () => {
  it('spawns items so the desk is never left empty', () => {
    const { state, input } = startedGame();
    state.items = [];
    run(state, input, 12);

    expect(state.items.length).toBeGreaterThan(1);
    for (const item of state.items) {
      expect(item.x).toBeGreaterThan(DESK.edgeX);
      expect(item.x).toBeLessThan(DESK.rightEdgeX);
    }
  });

  it('never exceeds the maximum desk population', () => {
    const { state, input } = startedGame();
    run(state, input, 40, () => {
      expect(state.items.length).toBeLessThanOrEqual(7);
    });
  });
});

describe('a full unattended run', () => {
  it('reaches game over from owner threats alone without throwing', () => {
    const state = createGameState();
    const input = new FakeInput();
    input.tap('swipe');
    updateGame(state, input, STEP);

    // The cat just sits there; the owner should eventually run it off.
    run(state, input, 180);

    expect(state.phase).toBe('gameover');
    expect(state.strikes).toBeGreaterThanOrEqual(OWNER.maxStrikes);
    expect(state.elapsed).toBeGreaterThan(0);
  });
});
