import { initAudio } from './engine/audio.ts';
import { Input } from './engine/input.ts';
import { startLoop } from './engine/loop.ts';
import { mountTouchControls } from './engine/touch.ts';
import { updateGame } from './game/game.ts';
import { createGameState } from './game/state.ts';
import { render } from './render/renderer.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('#game canvas not found');

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D canvas context unavailable');

/**
 * Fills the window. The renderer still fits the whole 16:9 play area on screen
 * and centres it, so nothing is cropped — it just paints room into whatever
 * the display's shape leaves over, rather than letterboxing.
 */
function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;

  canvas!.style.width = `${cssWidth}px`;
  canvas!.style.height = `${cssHeight}px`;
  canvas!.width = Math.floor(cssWidth * dpr);
  canvas!.height = Math.floor(cssHeight * dpr);
}

resize();
window.addEventListener('resize', resize);

const state = createGameState();
const input = new Input();
// Browsers block audio until the player interacts, so start it on first input.
input.onFirstGesture = () => initAudio();
const touchControls = mountTouchControls(input, canvas);

startLoop({
  update: (dt) => {
    // A sideways phone cannot show the desk, so freeze the run rather than let
    // the owner keep swinging at a player who cannot see or reach anything.
    // It stays paused after rotating back — landing straight into a spray you
    // never saw coming would be a worse surprise.
    if (touchControls.isBlocked() && state.phase === 'playing') state.phase = 'paused';
    updateGame(state, input, dt);
  },
  render: () => {
    // Keeping the phase mapping here leaves `engine/` free of game concepts.
    touchControls.setPhase(
      state.phase === 'playing' ? 'playing' : state.phase === 'paused' ? 'paused' : 'idle',
    );
    // On touch the pause menu *is* the paused screen, so the canvas one would
    // only show through behind it.
    render(ctx, state, canvas, { hidePausedOverlay: touchControls.isActive() });
  },
});
