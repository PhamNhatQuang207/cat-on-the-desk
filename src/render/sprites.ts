/** Every sprite is drawn with canvas paths — no image assets anywhere. */

import { CAT, COLORS, DESK, type ItemKind } from '../game/config.ts';
import type { Cat, Item, Owner } from '../game/types.ts';
import { contactShadow, ellipse, fillRoundRect, roundRect, type Ctx } from './draw.ts';

// ---------------------------------------------------------------- items

/**
 * Draws an item with its origin at the bottom-center of its footprint, so the
 * caller can place it on the desk surface and rotate it around that point.
 */
export function drawItem(ctx: Ctx, item: Item, risk: number): void {
  ctx.save();
  ctx.translate(item.x, item.y);

  if (item.phase === 'resting') {
    contactShadow(ctx, 0, 0, item.width);
    // Wobble after a swipe — a little visual "ooh, careful".
    if (item.wobble > 0) ctx.rotate(Math.sin(item.wobble * 30) * 0.06 * item.wobble);
  } else {
    ctx.rotate(item.rotation);
  }

  // Items hanging over the void get an alarmed red rim.
  if (risk > 0) {
    ctx.save();
    ctx.globalAlpha = 0.25 + risk * 0.5;
    ctx.shadowColor = COLORS.danger;
    ctx.shadowBlur = 18 + risk * 22;
    ellipse(ctx, 0, -item.height / 2, item.width * 0.5, item.height * 0.5, COLORS.danger);
    ctx.restore();
  }

  SHAPES[item.kind](ctx, item);
  ctx.restore();
}

type ShapeFn = (ctx: Ctx, item: Item) => void;

const SHAPES: Record<ItemKind, ShapeFn> = {
  mug: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    ctx.strokeStyle = '#e7e2ef';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w * 0.55, -h * 0.55, h * 0.28, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    fillRoundRect(ctx, -w / 2, -h, w, h, 5, '#f2eef8');
    fillRoundRect(ctx, -w / 2 + 3, -h + 3, w - 6, 7, 3, '#6b4a2f');
    ctx.fillStyle = '#c9c1d6';
    ctx.fillRect(-w / 2, -h * 0.28, w, 3);
  },

  glass: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    ctx.fillStyle = 'rgba(190, 225, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h);
    ctx.lineTo(w / 2, -h);
    ctx.lineTo(w * 0.36, 0);
    ctx.lineTo(-w * 0.36, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 190, 255, 0.6)';
    ctx.fillRect(-w * 0.4, -h * 0.55, w * 0.8, h * 0.55);
    ctx.strokeStyle = 'rgba(230, 245, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  },

  phone: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    fillRoundRect(ctx, -w / 2, -h, w, h, 4, '#1d1a26');
    fillRoundRect(ctx, -w / 2 + 2, -h + 3, w - 4, h - 6, 2, '#4fd8ff');
    ctx.globalAlpha = 0.4;
    fillRoundRect(ctx, -w / 2 + 2, -h + 3, w - 4, (h - 6) * 0.4, 2, '#ffffff');
    ctx.globalAlpha = 1;
  },

  vase: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    ctx.fillStyle = '#5f8fb5';
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, -h);
    ctx.bezierCurveTo(-w * 0.7, -h * 0.6, -w * 0.55, -h * 0.1, -w * 0.3, 0);
    ctx.lineTo(w * 0.3, 0);
    ctx.bezierCurveTo(w * 0.55, -h * 0.1, w * 0.7, -h * 0.6, w * 0.28, -h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e5d3a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, -h * 0.42);
    ctx.lineTo(w * 0.42, -h * 0.42);
    ctx.stroke();
  },

  plant: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    const potH = h * 0.42;
    ctx.fillStyle = '#2f7a4f';
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.rotate(i * 0.32);
      ctx.beginPath();
      ctx.ellipse(0, -potH - h * 0.28, w * 0.14, h * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#b4653c';
    ctx.beginPath();
    ctx.moveTo(-w / 2, -potH);
    ctx.lineTo(w / 2, -potH);
    ctx.lineTo(w * 0.36, 0);
    ctx.lineTo(-w * 0.36, 0);
    ctx.closePath();
    ctx.fill();
  },

  laptop: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    ctx.save();
    // Screen, hinged up at the back.
    ctx.translate(-w * 0.35, 0);
    ctx.rotate(-0.28);
    fillRoundRect(ctx, 0, -h, w * 0.85, h, 3, '#2b2836');
    fillRoundRect(ctx, 2, -h + 2, w * 0.85 - 4, h - 4, 2, '#3f7dd8');
    ctx.restore();
    fillRoundRect(ctx, -w / 2, -8, w, 8, 3, '#c9c3d6');
    fillRoundRect(ctx, -w / 2 + 4, -6, w - 8, 4, 2, '#8f8a9e');
  },

  monitor: (ctx, item) => {
    const w = item.width;
    const h = item.height;
    ctx.fillStyle = '#3a3548';
    ctx.fillRect(-w * 0.16, -h * 0.32, w * 0.32, h * 0.32);
    fillRoundRect(ctx, -w * 0.34, -6, w * 0.68, 7, 3, '#3a3548');
    fillRoundRect(ctx, -w / 2, -h, w, h * 0.72, 4, '#26232f');
    fillRoundRect(ctx, -w / 2 + 4, -h + 4, w - 8, h * 0.72 - 8, 2, '#57c7a8');
  },
};

// ---------------------------------------------------------------- cat

export function drawCat(ctx: Ctx, cat: Cat, pawX: number, aggroGlow: number): void {
  const w = CAT.width;
  const h = CAT.height;
  const y = DESK.surfaceY;
  const stunned = cat.stunTimer > 0;
  const bobY = stunned ? 4 : Math.sin(cat.bob) * 2;

  ctx.save();
  ctx.translate(cat.x, y + bobY);
  contactShadow(ctx, 0, -bobY, w * 0.9, 0.4);
  // The sprite below is authored facing RIGHT (head at +x); this flip is what
  // turns it around, so every local coordinate reads as "forward = +x".
  ctx.scale(cat.facing, 1);

  // Tail, out behind — lashes faster the angrier the standoff gets.
  ctx.strokeStyle = COLORS.cat;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  const lash = Math.sin(cat.bob * 1.6) * (0.25 + aggroGlow * 0.5);
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -h * 0.35);
  ctx.quadraticCurveTo(-w * 0.62, -h * 0.55 - lash * 22, -w * 0.5, -h * 0.95 - lash * 26);
  ctx.stroke();

  // Body.
  ctx.fillStyle = COLORS.cat;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.4, w * 0.4, h * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tabby stripes.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.4, w * 0.4, h * 0.34, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = COLORS.catStripe;
  for (let i = -1; i <= 2; i++) {
    ctx.fillRect(i * 13 - 4, -h * 0.8, 6, h);
  }
  ctx.restore();

  // Legs.
  ctx.fillStyle = COLORS.catDark;
  ctx.fillRect(-w * 0.3, -h * 0.22, 11, h * 0.22);
  ctx.fillRect(w * 0.1, -h * 0.22, 11, h * 0.22);

  // Head, out front.
  const headX = w * 0.34;
  const headY = -h * 0.68;
  ctx.fillStyle = COLORS.cat;
  ctx.beginPath();
  ctx.ellipse(headX, headY, w * 0.24, h * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears — pinned back when stunned, alert otherwise.
  const earTilt = stunned ? 0.9 : 0;
  for (const side of [-1, 1] as const) {
    ctx.save();
    ctx.translate(headX + side * w * 0.13, headY - h * 0.19);
    ctx.rotate(side * earTilt);
    ctx.beginPath();
    ctx.moveTo(-7, 7);
    ctx.lineTo(0, -13);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0b39a';
    ctx.beginPath();
    ctx.moveTo(-3, 4);
    ctx.lineTo(0, -6);
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.cat;
    ctx.restore();
  }

  drawCatFace(ctx, headX, headY, cat, stunned);

  // Front paw — extends during a swipe. pawX is world space, so undo the flip.
  const localPawX = (pawX - cat.x) * cat.facing;
  ctx.strokeStyle = COLORS.catDark;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(w * 0.14, -h * 0.3);
  ctx.lineTo(localPawX, -h * 0.14);
  ctx.stroke();
  ctx.fillStyle = COLORS.catDark;
  ctx.beginPath();
  ctx.ellipse(localPawX, -h * 0.14, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** World-space position of the cat's head — where the stare-down line starts. */
export function catHeadPosition(cat: Cat): { x: number; y: number } {
  return { x: cat.x + cat.facing * CAT.width * 0.34, y: DESK.surfaceY - CAT.height * 0.68 };
}

function drawCatFace(ctx: Ctx, x: number, y: number, cat: Cat, stunned: boolean): void {
  if (stunned) {
    // X_X
    ctx.strokeStyle = COLORS.danger;
    ctx.lineWidth = 3;
    for (const dx of [-9, 7]) {
      ctx.beginPath();
      ctx.moveTo(x + dx - 4, y - 4);
      ctx.lineTo(x + dx + 4, y + 4);
      ctx.moveTo(x + dx + 4, y - 4);
      ctx.lineTo(x + dx - 4, y + 4);
      ctx.stroke();
    }
    return;
  }

  const staring = cat.staring;
  const eyeR = staring ? 7.5 : 5.5;
  ctx.fillStyle = COLORS.catEye;
  for (const dx of [-7, 9]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y - 2, eyeR, eyeR, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pupils: slits normally, wide saucers when staring the owner down.
  ctx.fillStyle = '#12101a';
  for (const dx of [-7, 9]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, y - 2, staring ? 4 : 1.6, staring ? 5 : 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Muzzle and nose.
  ctx.fillStyle = '#f5e0cd';
  ctx.beginPath();
  ctx.ellipse(x + 9, y + 10, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0728c';
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 6);
  ctx.lineTo(x + 13, y + 6);
  ctx.lineTo(x + 9, y + 11);
  ctx.closePath();
  ctx.fill();

  // Whiskers.
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  for (const dy of [-2, 2, 6]) {
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 9);
    ctx.lineTo(x + 30, y + 9 + dy);
    ctx.stroke();
  }

  if (staring) {
    // Furrowed brow — the cat is committing to the bit.
    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = COLORS.catDark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 13);
    ctx.lineTo(x + 15, y - 13);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- owner

export function drawOwner(ctx: Ctx, owner: Owner, elapsed: number): void {
  const x = 890;
  const baseY = DESK.surfaceY + 60;
  const anger = owner.displayAnger;
  // Angrier owner = more agitated fidget.
  const fidget = Math.sin(elapsed * (2 + anger * 8)) * anger * 3;

  ctx.save();
  ctx.translate(x + fidget, baseY);

  // Torso behind the desk.
  fillRoundRect(ctx, -62, -110, 124, 190, 26, COLORS.ownerShirt);

  // Head.
  const headY = -150;
  ctx.fillStyle = COLORS.owner;
  ctx.beginPath();
  ctx.ellipse(0, headY, 40, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair.
  ctx.fillStyle = '#4a3628';
  ctx.beginPath();
  ctx.ellipse(0, headY - 26, 41, 24, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes — narrow into a glare as anger rises, and go wide during eye contact.
  const lidDrop = owner.lockedEyes ? -3 : anger * 7;
  for (const dx of [-15, 15]) {
    ctx.fillStyle = '#f7f2ff';
    ctx.beginPath();
    ctx.ellipse(dx, headY - 4, 10, Math.max(2.5, 9 - lidDrop), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20202c';
    ctx.beginPath();
    ctx.ellipse(dx - 3, headY - 4, 4, Math.max(2, 5 - lidDrop * 0.4), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brows: flat when calm, hard V when furious.
  ctx.strokeStyle = '#4a3628';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(side * 6, headY - 16 - anger * 4);
    ctx.lineTo(side * 26, headY - 14 + anger * 10);
    ctx.stroke();
  }

  // Mouth: neutral line -> open yell.
  ctx.fillStyle = '#63313a';
  const mouthH = 3 + anger * 14;
  ctx.beginPath();
  ctx.ellipse(0, headY + 22, 12 + anger * 6, mouthH / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sweat drop when the cat is staring them down.
  if (owner.lockedEyes) {
    ctx.fillStyle = '#8fd6ff';
    ctx.beginPath();
    ctx.ellipse(38, headY - 12, 5, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** The dotted line of the stare-down, drawn between cat and owner. */
export function drawEyeContact(ctx: Ctx, cat: Cat, strength: number): void {
  const head = catHeadPosition(cat);
  ctx.save();
  ctx.globalAlpha = 0.25 + strength * 0.55;
  ctx.strokeStyle = COLORS.catEye;
  ctx.lineWidth = 2 + strength * 2;
  ctx.setLineDash([10, 8]);
  ctx.lineDashOffset = -performance.now() / 24;
  ctx.beginPath();
  ctx.moveTo(head.x, head.y);
  ctx.lineTo(875, DESK.surfaceY - 96);
  ctx.stroke();
  ctx.restore();
}

/** Reusable rounded highlight, used by overlays for key hints. */
export function keyCap(ctx: Ctx, label: string, x: number, y: number, w = 54, h = 30): void {
  fillRoundRect(ctx, x, y, w, h, 7, 'rgba(255,255,255,0.14)');
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 7);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = COLORS.text;
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
  ctx.restore();
}
