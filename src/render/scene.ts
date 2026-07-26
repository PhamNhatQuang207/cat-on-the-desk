/** Room, desk, threats, particles — everything in world space. */

import { COLORS, DESK, PHYSICS, THREAT, VIEW } from '../game/config.ts';
import type { GameState, Threat } from '../game/types.ts';
import { ellipse, fillRoundRect, text, type Ctx, type ViewBounds } from './draw.ts';

/** Overdraw past the visible edges so screen shake cannot expose a gap. */
const BLEED = 48;

export function drawRoom(ctx: Ctx, bounds: ViewBounds): void {
  const left = bounds.left - BLEED;
  const top = bounds.top - BLEED;
  const width = bounds.right - bounds.left + BLEED * 2;
  const height = bounds.bottom - bounds.top + BLEED * 2;

  // The gradient stays keyed to the play area so the wall shades the same way
  // at any aspect; canvas clamps it past both ends, which is what we want.
  const wall = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  wall.addColorStop(0, COLORS.wallTop);
  wall.addColorStop(1, COLORS.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(left, top, width, height);

  // Floor beyond the desk edge — the abyss things fall into.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(left, PHYSICS.floorY, width, bounds.bottom + BLEED - PHYSICS.floorY);

  // A framed picture, because every desk sits under one.
  fillRoundRect(ctx, 300, 60, 120, 84, 6, '#3b3049');
  fillRoundRect(ctx, 308, 68, 104, 68, 3, '#5c789c');
  ctx.fillStyle = '#8ab88f';
  ctx.beginPath();
  ctx.moveTo(308, 136);
  ctx.lineTo(348, 92);
  ctx.lineTo(388, 136);
  ctx.closePath();
  ctx.fill();
}

export function drawDesk(ctx: Ctx): void {
  const { edgeX, rightEdgeX, surfaceY, thickness } = DESK;
  const width = rightEdgeX - edgeX;

  // Desk top.
  ctx.fillStyle = COLORS.deskTop;
  ctx.fillRect(edgeX, surfaceY, width, thickness);
  // Front face, slightly darker.
  ctx.fillStyle = COLORS.deskFace;
  ctx.fillRect(edgeX, surfaceY + thickness, width, 14);
  // Legs, inset from each edge.
  ctx.fillRect(edgeX + 22, surfaceY + thickness, 20, 150);
  ctx.fillRect(rightEdgeX - 42, surfaceY + thickness, 20, 150);

  // Both edges get a warning glow — this is where the fun happens.
  drawEdgeGlow(ctx, edgeX, 1);
  drawEdgeGlow(ctx, rightEdgeX, -1);
}

/** A warning glow and bright lip on one doom edge; dir points onto the desk. */
function drawEdgeGlow(ctx: Ctx, x: number, dir: 1 | -1): void {
  const { surfaceY, thickness } = DESK;
  const glow = ctx.createLinearGradient(x, 0, x + dir * 46, 0);
  glow.addColorStop(0, 'rgba(255, 202, 107, 0.5)');
  glow.addColorStop(1, 'rgba(255, 202, 107, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(dir === 1 ? x : x - 46, surfaceY - 60, 46, 60 + thickness);

  ctx.strokeStyle = COLORS.deskEdgeGlow;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, surfaceY - 8);
  ctx.lineTo(x, surfaceY + thickness + 14);
  ctx.stroke();
}

export function drawThreats(ctx: Ctx, state: GameState): void {
  for (const threat of state.threats) {
    if (threat.kind === 'spray') drawSpray(ctx, threat);
    else drawHand(ctx, threat);
  }
}

function drawSpray(ctx: Ctx, threat: Threat): void {
  const y = DESK.surfaceY;
  const progress = 1 - threat.timer / Math.max(0.001, threat.phaseDuration);

  if (threat.phase === 'telegraph') {
    const locked = !threat.tracking;
    const color = locked ? COLORS.danger : COLORS.warn;
    ctx.save();
    ctx.globalAlpha = locked ? 0.55 + Math.sin(progress * 30) * 0.25 : 0.4;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    // Reticle on the desk surface.
    ctx.beginPath();
    ctx.ellipse(threat.x, y - 4, THREAT.spray.radius, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Shrinking inner ring counts down to the shot.
    ctx.beginPath();
    ctx.ellipse(threat.x, y - 4, THREAT.spray.radius * (1 - progress * 0.75), 9 * (1 - progress * 0.75), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (locked) text(ctx, '!', threat.x, y - 100, { size: 34, color, align: 'center' });
    return;
  }

  if (threat.phase !== 'active') return;

  // The spray itself: a cone of droplets falling onto the target.
  ctx.save();
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 26; i++) {
    const t = (i / 26 + progress) % 1;
    const spread = THREAT.spray.radius * (0.2 + t * 0.9);
    const px = threat.x + Math.sin(i * 12.9898) * spread;
    const py = y - 160 + t * 160;
    ellipse(ctx, px, py, 3.2, 5, '#a8e2ff');
  }
  ctx.globalAlpha = 0.2;
  ellipse(ctx, threat.x, y - 4, THREAT.spray.radius, 14, '#a8e2ff');
  ctx.restore();
}

function drawHand(ctx: Ctx, threat: Threat): void {
  const y = DESK.surfaceY;
  const progress = 1 - threat.timer / Math.max(0.001, threat.phaseDuration);

  if (threat.phase === 'telegraph') {
    // Shadow on the desk grows as the hand comes down.
    ctx.save();
    ctx.globalAlpha = 0.2 + progress * 0.45;
    ellipse(ctx, threat.x, y - 2, 30 + progress * 34, 10 + progress * 8, '#000000');
    ctx.restore();
    text(ctx, threat.targetItemId !== null ? '🖐 saving it!' : '🖐', threat.x, y - 110, {
      size: 22,
      color: COLORS.warn,
      align: 'center',
      alpha: 0.5 + progress * 0.5,
    });
    return;
  }

  // Active/recover: the arm sweeps in from the right and back out.
  const reach = threat.phase === 'active' ? Math.sin(progress * Math.PI) : 0;
  if (reach <= 0.01) return;

  const handX = VIEW.width - (VIEW.width - threat.x) * reach;
  const handY = y - 40 - (1 - reach) * 90;

  ctx.save();
  ctx.strokeStyle = COLORS.owner;
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(VIEW.width + 20, y - 130);
  ctx.quadraticCurveTo((VIEW.width + handX) / 2, y - 150, handX, handY);
  ctx.stroke();

  ctx.fillStyle = COLORS.owner;
  ctx.beginPath();
  ctx.ellipse(handX, handY, 26, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Fingers.
  ctx.lineWidth = 8;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(handX + i * 8, handY + 8);
    ctx.lineTo(handX + i * 10, handY + 26);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawShards(ctx: Ctx, state: GameState): void {
  for (const shard of state.shards) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, shard.life));
    ctx.translate(shard.x, shard.y);
    ctx.rotate(shard.rotation);
    ctx.fillStyle = shard.color;
    ctx.fillRect(-shard.size / 2, -shard.size / 2, shard.size, shard.size * 0.7);
    ctx.restore();
  }
}

export function drawFloaters(ctx: Ctx, state: GameState): void {
  for (const floater of state.floaters) {
    text(ctx, floater.text, floater.x, floater.y, {
      size: 20 * floater.scale,
      color: floater.color,
      align: 'center',
      alpha: Math.max(0, Math.min(1, floater.life * 1.6)),
      weight: '700',
    });
  }
}

/** Debris that has piled up on the floor over the run — pure comedy. */
export function drawDebris(ctx: Ctx, destroyed: number): void {
  const count = Math.min(destroyed, 24);
  ctx.save();
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < count; i++) {
    // Deterministic scatter so the pile doesn't shimmer between frames.
    const seed = Math.sin(i * 78.233) * 43758.5453;
    const frac = seed - Math.floor(seed);
    // Wreckage piles up under both edges now that either can be a drop.
    const base = i % 2 === 0 ? DESK.edgeX - 60 : DESK.rightEdgeX - 20;
    const x = base + frac * 120;
    const y = PHYSICS.floorY - 4 - (i % 3) * 5;
    ellipse(ctx, x, y, 7 + frac * 6, 3.5, i % 2 === 0 ? '#cfe8ff' : '#8a7f9c');
  }
  ctx.restore();
}
