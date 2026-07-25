/**
 * On-screen thumb controls for touch devices.
 *
 * These drive the same `Input` the keyboard does, so the game itself never
 * learns there is such a thing as a touchscreen — it still only ever reads
 * `InputSource` actions. A hybrid device can use keys and thumbs at once.
 */

import type { Action, Input } from './input.ts';

interface ButtonSpec {
  action: Action;
  label: string;
  className: string;
  /**
   * Hold buttons stay down until the finger lifts (walking). Tap buttons fire
   * once per press and release immediately, matching how `wasPressed` reads a
   * tapped key — holding one does not auto-repeat.
   */
  hold: boolean;
}

/** The thumb bar along the bottom of the screen, left to right. */
const PAD_BUTTONS: ButtonSpec[] = [
  { action: 'left', label: '◀', className: 'tc-left', hold: true },
  { action: 'right', label: '▶', className: 'tc-right', hold: true },
  { action: 'swipe', label: '🐾', className: 'tc-swipe', hold: false },
];

/**
 * Pause is meaningless outside a run, and the same button has to read as
 * "resume" once the game is actually paused.
 */
export type PauseButtonState = 'hidden' | 'pause' | 'resume';

export interface TouchControls {
  setPauseState(state: PauseButtonState): void;
}

/**
 * Builds the control overlay and wires it to `input`. Safe to call on desktop:
 * the overlay stays hidden until something proves the device has a touchscreen.
 */
export function mountTouchControls(input: Input, canvas: HTMLCanvasElement): TouchControls {
  const root = document.createElement('div');
  root.className = 'touch-controls';
  root.hidden = true;

  const pad = document.createElement('div');
  pad.className = 'tc-pad';
  for (const spec of PAD_BUTTONS) {
    pad.appendChild(createButton(spec, input));
  }
  root.appendChild(pad);

  // Pause sits top-centre: the one part of the HUD with nothing in it, and far
  // enough from where the thumbs rest that it is hard to hit by accident.
  const pause = createButton({ action: 'pause', label: '❚❚', className: 'tc-pause', hold: false }, input);
  pause.hidden = true;
  root.appendChild(pause);

  document.body.appendChild(root);

  // Tapping the play area swipes too, so the paw is reachable without hunting
  // for the button. A wasted swipe costs nothing, so a stray tap is harmless.
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.press('swipe');
    input.release('swipe');
  });

  const reveal = (): void => {
    root.hidden = false;
  };
  if (window.matchMedia?.('(pointer: coarse)').matches) reveal();
  // Hybrid laptops report a fine pointer until a finger actually lands.
  window.addEventListener('touchstart', reveal, { once: true, passive: true });

  let pauseState: PauseButtonState | null = null;
  return {
    setPauseState(next) {
      // Called every frame, so only touch the DOM when it actually changes.
      if (next === pauseState) return;
      pauseState = next;
      pause.hidden = next === 'hidden';
      pause.textContent = next === 'resume' ? '▶' : '❚❚';
      pause.setAttribute('aria-label', next === 'resume' ? 'resume' : 'pause');
    },
  };
}

function createButton(spec: ButtonSpec, input: Input): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `tc-button ${spec.className}`;
  button.textContent = spec.label;
  button.setAttribute('aria-label', spec.action);

  /** The finger currently on this button, so a second one cannot release it. */
  let heldPointer: number | null = null;

  const letGo = (): void => {
    if (heldPointer === null) return;
    heldPointer = null;
    button.classList.remove('is-held');
    if (spec.hold) input.release(spec.action);
  };

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    // The window-level listener turns any tap into `confirm`, which would start
    // a run the instant a player tapped the title screen's breed arrows.
    e.stopPropagation();
    if (heldPointer !== null) return;
    heldPointer = e.pointerId;
    button.classList.add('is-held');
    try {
      // Keeps the release event coming here even if the thumb slides off.
      button.setPointerCapture(e.pointerId);
    } catch {
      // Capture is an optimisation; the pointerup/blur fallbacks still hold.
    }

    input.press(spec.action);
    if (!spec.hold) input.release(spec.action);
  });

  for (const type of ['pointerup', 'pointercancel'] as const) {
    button.addEventListener(type, (e) => {
      if (e.pointerId !== heldPointer) return;
      letGo();
    });
  }

  // Pointer capture normally guarantees the up event, but a lost capture would
  // otherwise leave the cat sprinting into a wall forever.
  window.addEventListener('blur', letGo);

  return button;
}
