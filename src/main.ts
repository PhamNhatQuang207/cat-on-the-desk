import { initAudio } from './engine/audio.ts';
import { Input } from './engine/input.ts';
import { startLoop } from './engine/loop.ts';
import { mountTouchControls } from './engine/touch.ts';
import { VIEW } from './game/config.ts';
import { updateGame } from './game/game.ts';
import { createGameState } from './game/state.ts';
import { render } from './render/renderer.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('#game canvas not found');

const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('2D canvas context unavailable');

/** Sizes the backing store to the window, keeping the 16:9 play area. */
function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const aspect = VIEW.width / VIEW.height;
  let cssWidth = window.innerWidth;
  let cssHeight = window.innerHeight;
  if (cssWidth / cssHeight > aspect) cssWidth = cssHeight * aspect;
  else cssHeight = cssWidth / aspect;

  canvas!.style.width = `${Math.floor(cssWidth)}px`;
  canvas!.style.height = `${Math.floor(cssHeight)}px`;
  canvas!.width = Math.floor(cssWidth * dpr);
  canvas!.height = Math.floor(cssHeight * dpr);
}

resize();
window.addEventListener('resize', resize);

const state = createGameState();
const input = new Input();
// Browsers block audio until the player interacts, so start it on first input.
input.onFirstGesture = () => initAudio();
mountTouchControls(input, canvas);

startLoop({
  update: (dt) => updateGame(state, input, dt),
  render: () => render(ctx, state, canvas),
});
