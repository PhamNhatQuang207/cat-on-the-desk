/**
 * Keyboard input with edge detection. `wasPressed` is consumed by the update
 * step, so the pressed set is cleared at the end of every frame.
 */

export type Action = 'left' | 'right' | 'swipe' | 'stare' | 'pause' | 'confirm';

const BINDINGS: Record<string, Action> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'swipe',
  ShiftLeft: 'stare',
  ShiftRight: 'stare',
  ArrowUp: 'stare',
  KeyW: 'stare',
  KeyP: 'pause',
  Escape: 'pause',
  Enter: 'confirm',
};

/**
 * What the game actually needs from input. Depending on this rather than the
 * concrete class lets tests drive a full run without a DOM.
 */
export interface InputSource {
  isDown(action: Action): boolean;
  wasPressed(action: Action): boolean;
  endFrame(): void;
}

export class Input implements InputSource {
  private down = new Set<Action>();
  private pressed = new Set<Action>();
  /** Fires on the first real key/pointer event — used to unlock WebAudio. */
  onFirstGesture: (() => void) | null = null;
  private gestured = false;

  constructor(target: Window = window) {
    target.addEventListener('keydown', (e) => {
      const action = BINDINGS[e.code];
      if (!action) return;
      e.preventDefault();
      this.gesture();
      if (!this.down.has(action)) this.pressed.add(action);
      this.down.add(action);
    });

    target.addEventListener('keyup', (e) => {
      const action = BINDINGS[e.code];
      if (!action) return;
      e.preventDefault();
      this.down.delete(action);
    });

    // Releasing focus should not leave the cat sprinting into a wall forever.
    target.addEventListener('blur', () => this.down.clear());

    target.addEventListener('pointerdown', () => {
      this.gesture();
      if (!this.down.has('confirm')) this.pressed.add('confirm');
    });
  }

  private gesture(): void {
    if (this.gestured) return;
    this.gestured = true;
    this.onFirstGesture?.();
  }

  isDown(action: Action): boolean {
    return this.down.has(action);
  }

  wasPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  /** Call once at the end of each update step. */
  endFrame(): void {
    this.pressed.clear();
  }
}
