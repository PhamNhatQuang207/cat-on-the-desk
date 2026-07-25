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

// ------------------------------------------------------------ control size

export type ControlSize = 'small' | 'medium' | 'large';

/** Multiplies every pad button's width, height, and glyph. */
const SIZE_SCALE: Record<ControlSize, number> = {
  small: 0.8,
  medium: 1,
  large: 1.3,
};

const SIZE_OPTIONS: Array<{ id: ControlSize; label: string }> = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const SIZE_KEY = 'cat-on-the-desk.control-size';

function loadControlSize(): ControlSize {
  try {
    const raw = localStorage.getItem(SIZE_KEY);
    return raw !== null && raw in SIZE_SCALE ? (raw as ControlSize) : 'medium';
  } catch {
    // Private browsing / disabled storage — a session-only size is fine.
    return 'medium';
  }
}

function saveControlSize(size: ControlSize): void {
  try {
    localStorage.setItem(SIZE_KEY, size);
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------------ mount

/** Only the states the controls care about; keeps game concepts out of here. */
export type TouchPhase = 'idle' | 'playing' | 'paused';

export interface TouchControls {
  setPhase(phase: TouchPhase): void;
  /** True once the overlay is showing, i.e. this is a touch device. */
  isActive(): boolean;
}

/**
 * Builds the control overlay and wires it to `input`. Safe to call on desktop:
 * the overlay stays hidden until something proves the device has a touchscreen.
 */
export function mountTouchControls(input: Input, canvas: HTMLCanvasElement): TouchControls {
  const root = document.createElement('div');
  root.className = 'touch-controls';
  root.hidden = true;

  const applySize = (size: ControlSize): void => {
    root.style.setProperty('--tc-scale', String(SIZE_SCALE[size]));
  };
  let size = loadControlSize();
  applySize(size);

  // Dims the game and swallows taps, so a tap meant for the menu can never
  // reach the window listener that treats any tap as "resume".
  const scrim = document.createElement('div');
  scrim.className = 'tc-scrim';
  scrim.hidden = true;
  scrim.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Tapping away from the card is the usual "close this" gesture.
    tap(input, 'pause');
  });
  root.appendChild(scrim);

  const pad = document.createElement('div');
  pad.className = 'tc-pad';
  for (const spec of PAD_BUTTONS) {
    pad.appendChild(createButton(spec, input));
  }
  root.appendChild(pad);

  // Top-centre: the one part of the HUD with nothing in it, and far enough
  // from where the thumbs rest that it is hard to hit mid-swipe.
  const menuButton = createButton({ action: 'pause', label: '☰', className: 'tc-menu-button', hold: false }, input);
  menuButton.setAttribute('aria-label', 'menu');
  menuButton.hidden = true;
  root.appendChild(menuButton);

  const card = buildMenuCard(input, () => size, (next) => {
    size = next;
    applySize(next);
    saveControlSize(next);
  });
  root.appendChild(card);

  document.body.appendChild(root);

  // Tapping the play area swipes too, so the paw is reachable without hunting
  // for the button. A wasted swipe costs nothing, so a stray tap is harmless.
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    input.press('swipe');
    input.release('swipe');
  });

  let active = false;
  const reveal = (): void => {
    active = true;
    root.hidden = false;
  };
  if (window.matchMedia?.('(pointer: coarse)').matches) reveal();
  // Hybrid laptops report a fine pointer until a finger actually lands.
  window.addEventListener('touchstart', reveal, { once: true, passive: true });

  let phase: TouchPhase | null = null;
  return {
    setPhase(next) {
      // Called every frame, so only touch the DOM when it actually changes.
      if (next === phase) return;
      phase = next;
      const open = next === 'paused';
      // The menu is simply what "paused" looks like on a touchscreen, so it
      // follows the phase however the player got there — button or keyboard.
      scrim.hidden = !open;
      card.hidden = !open;
      menuButton.hidden = next !== 'playing';
      root.classList.toggle('is-menu-open', open);
    },
    isActive() {
      return active;
    },
  };
}

/** Fires an action as a single press, the way tapping a key reads. */
function tap(input: Input, action: Action): void {
  input.press(action);
  input.release(action);
}

// ------------------------------------------------------------------- menu

function buildMenuCard(
  input: Input,
  getSize: () => ControlSize,
  onPick: (size: ControlSize) => void,
): HTMLElement {
  const card = document.createElement('div');
  card.className = 'tc-card';
  card.hidden = true;
  // Taps inside the card are the card's business, not the scrim's.
  card.addEventListener('pointerdown', (e) => e.stopPropagation());

  const title = document.createElement('h2');
  title.className = 'tc-card-title';
  title.textContent = 'PAUSED';
  card.appendChild(title);

  const label = document.createElement('p');
  label.className = 'tc-card-label';
  label.textContent = 'Control size';
  card.appendChild(label);

  const options = document.createElement('div');
  options.className = 'tc-size-options';
  const buttons = SIZE_OPTIONS.map(({ id, label: text }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tc-size';
    button.textContent = text;
    button.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPick(id);
      sync();
    });
    options.appendChild(button);
    return { id, button };
  });
  card.appendChild(options);

  const hint = document.createElement('p');
  hint.className = 'tc-card-hint';
  // The pad stays visible above the scrim precisely so this is true.
  hint.textContent = 'The buttons resize as you choose.';
  card.appendChild(hint);

  const resume = document.createElement('button');
  resume.type = 'button';
  resume.className = 'tc-resume';
  resume.textContent = 'Resume';
  resume.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    tap(input, 'pause');
  });
  card.appendChild(resume);

  function sync(): void {
    const current = getSize();
    for (const { id, button } of buttons) {
      button.setAttribute('aria-pressed', String(id === current));
    }
  }
  sync();

  return card;
}

// ---------------------------------------------------------------- buttons

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
