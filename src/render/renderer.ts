/**
 * Draws one frame. Everything is drawn in the fixed VIEW space; a single
 * transform scales that to the real canvas so nothing else has to care about
 * window size or device pixel ratio.
 */

import { VIEW } from '../game/config.ts';
import { pawPosition } from '../game/entities/cat.ts';
import { riskLevel } from '../game/systems/physics.ts';
import type { GameState } from '../game/types.ts';
import type { Ctx, ViewBounds } from './draw.ts';
import { drawHud } from './hud.ts';
import { drawGameOver, drawPaused, drawTitle } from './overlays.ts';
import { drawDebris, drawDesk, drawFloaters, drawRoom, drawShards, drawThreats } from './scene.ts';
import { drawCat, drawItem, drawOwner } from './sprites.ts';

export interface RenderOptions {
  /** Set when the touch pause menu is drawing its own, richer paused screen. */
  hidePausedOverlay?: boolean;
}

export function render(
  ctx: Ctx,
  state: GameState,
  canvas: HTMLCanvasElement,
  options: RenderOptions = {},
): void {
  // Fit the whole play area on screen — never crop it, since the doom edges at
  // the far left and right are the game. Whatever the shape of the display
  // leaves over becomes extra room rather than black bars.
  const scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
  const offsetX = (canvas.width - VIEW.width * scale) / 2;
  const offsetY = (canvas.height - VIEW.height * scale) / 2;
  const bounds: ViewBounds = {
    left: -offsetX / scale,
    top: -offsetY / scale,
    right: VIEW.width + offsetX / scale,
    bottom: VIEW.height + offsetY / scale,
  };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0d0a10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  // Screen shake, applied to the world only — the HUD stays put.
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawWorld(ctx, state, bounds);
  ctx.restore();

  if (state.phase !== 'title') drawHud(ctx, state);

  if (state.phase === 'title') drawTitle(ctx, state, bounds);
  else if (state.phase === 'paused' && !options.hidePausedOverlay) drawPaused(ctx, bounds);
  else if (state.phase === 'gameover') drawGameOver(ctx, state, bounds);

  ctx.restore();
}

function drawWorld(ctx: Ctx, state: GameState, bounds: ViewBounds): void {
  drawRoom(ctx, bounds);
  drawOwner(ctx, state.owner, state.elapsed);
  drawDesk(ctx);
  drawDebris(ctx, state.destroyed);

  for (const item of state.items) {
    drawItem(ctx, item, riskLevel(item));
  }

  const paw = pawPosition(state.cat);
  drawCat(ctx, state.cat, state.cat.swipeTimer > 0 ? paw.x : state.cat.x + state.cat.facing * 26, state.owner.aggro);

  drawThreats(ctx, state);
  drawShards(ctx, state);
  drawFloaters(ctx, state);

  // Full-screen tints have to cover the widened room, not just the play area,
  // or they stop short in a visible band.
  const x = bounds.left;
  const y = bounds.top;
  const w = bounds.right - bounds.left;
  const h = bounds.bottom - bounds.top;

  // A red vignette when the owner is about to lose it.
  if (state.owner.aggro > 0.65) {
    const intensity = (state.owner.aggro - 0.65) / 0.35;
    const vignette = ctx.createRadialGradient(
      VIEW.width / 2,
      VIEW.height / 2,
      VIEW.height * 0.3,
      VIEW.width / 2,
      VIEW.height / 2,
      VIEW.height * 0.8,
    );
    vignette.addColorStop(0, 'rgba(255,0,40,0)');
    vignette.addColorStop(1, `rgba(255,0,40,${0.35 * intensity})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(x, y, w, h);
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flash * 0.12})`;
    ctx.fillRect(x, y, w, h);
  }
}
