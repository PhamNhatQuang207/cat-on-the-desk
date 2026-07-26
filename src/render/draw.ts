/** Small canvas helpers shared by every renderer. */

export type Ctx = CanvasRenderingContext2D;

/**
 * The visible area in virtual units.
 *
 * Always contains the fixed 960x540 play area, and is larger than it on any
 * screen whose aspect is not 16:9 — the surplus is filled with more room so
 * the game reaches the edges of the display instead of letterboxing. Gameplay
 * still lives entirely inside VIEW, so nothing outside it can matter.
 */
export interface ViewBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function fillRoundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string): void {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

export function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** Soft contact shadow under an object sitting on the desk. */
export function contactShadow(ctx: Ctx, x: number, y: number, width: number, strength = 0.35): void {
  ctx.save();
  ctx.globalAlpha = strength;
  ellipse(ctx, x, y + 3, width * 0.55, 5, '#000000');
  ctx.restore();
}

export function text(
  ctx: Ctx,
  value: string,
  x: number,
  y: number,
  options: {
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    weight?: string;
    alpha?: number;
    shadow?: boolean;
  } = {},
): void {
  const { size = 18, color = '#ffffff', align = 'left', baseline = 'alphabetic', weight = '600', alpha = 1, shadow = true } = options;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(value, x + 2, y + 2);
  }
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

/** Horizontal meter used for aggro and combo timers. */
export function meter(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  fraction: number,
  color: string,
  background = 'rgba(255,255,255,0.12)',
): void {
  fillRoundRect(ctx, x, y, w, h, h / 2, background);
  const filled = Math.max(0, Math.min(1, fraction)) * w;
  if (filled > 1) fillRoundRect(ctx, x, y, filled, h, h / 2, color);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
