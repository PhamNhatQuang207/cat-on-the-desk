/**
 * Draws one frame. Everything is drawn in the fixed VIEW space; a single
 * transform scales that to the real canvas so nothing else has to care about
 * window size or device pixel ratio.
 */

import { VIEW } from '../game/config.ts';
import { pawPosition } from '../game/entities/cat.ts';
import { riskLevel } from '../game/systems/physics.ts';
import { stareMultiplier } from '../game/systems/scoring.ts';
import type { GameState } from '../game/types.ts';
import type { Ctx } from './draw.ts';
import { drawHud } from './hud.ts';
import { drawGameOver, drawPaused, drawTitle } from './overlays.ts';
import { drawDebris, drawDesk, drawFloaters, drawRoom, drawShards, drawThreats } from './scene.ts';
import { drawCat, drawEyeContact, drawItem, drawOwner } from './sprites.ts';

export function render(ctx: Ctx, state: GameState, canvas: HTMLCanvasElement): void {
  const scale = Math.min(canvas.width / VIEW.width, canvas.height / VIEW.height);
  const offsetX = (canvas.width - VIEW.width * scale) / 2;
  const offsetY = (canvas.height - VIEW.height * scale) / 2;

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
  ctx.beginPath();
  ctx.rect(0, 0, VIEW.width, VIEW.height);
  ctx.clip();

  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawWorld(ctx, state);
  ctx.restore();

  if (state.phase !== 'title') drawHud(ctx, state);

  if (state.phase === 'title') drawTitle(ctx, state);
  else if (state.phase === 'paused') drawPaused(ctx);
  else if (state.phase === 'gameover') drawGameOver(ctx, state);

  ctx.restore();
  ctx.restore();
}

function drawWorld(ctx: Ctx, state: GameState): void {
  drawRoom(ctx);
  drawOwner(ctx, state.owner, state.elapsed);
  drawDesk(ctx);
  drawDebris(ctx, state.destroyed);

  if (state.cat.staring) {
    const strength = (stareMultiplier(state.cat.stareTime, true) - 1) / 2;
    drawEyeContact(ctx, state.cat, strength);
  }

  for (const item of state.items) {
    drawItem(ctx, item, riskLevel(item));
  }

  const paw = pawPosition(state.cat);
  drawCat(ctx, state.cat, state.cat.swipeTimer > 0 ? paw.x : state.cat.x + state.cat.facing * 26, state.owner.aggro);

  drawThreats(ctx, state);
  drawShards(ctx, state);
  drawFloaters(ctx, state);

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
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.flash * 0.12})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}
