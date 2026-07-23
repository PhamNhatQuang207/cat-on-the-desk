/**
 * Fixed-timestep game loop. `update` always sees the same dt so the physics is
 * frame-rate independent; `render` runs once per animation frame and gets an
 * interpolation alpha for smoothing between the two most recent sim states.
 */

const STEP = 1 / 60;
/** Never simulate more than this much time in one frame (tab-switch guard). */
const MAX_FRAME = 0.25;

export interface LoopHandlers {
  update(dt: number): void;
  render(alpha: number): void;
}

export function startLoop(handlers: LoopHandlers): () => void {
  let last = performance.now() / 1000;
  let accumulator = 0;
  let raf = 0;
  let running = true;

  const frame = (nowMs: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    const now = nowMs / 1000;
    accumulator += Math.min(now - last, MAX_FRAME);
    last = now;

    while (accumulator >= STEP) {
      handlers.update(STEP);
      accumulator -= STEP;
    }

    handlers.render(accumulator / STEP);
  };

  raf = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
  };
}
