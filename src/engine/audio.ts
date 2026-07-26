/**
 * Tiny WebAudio synth — every sound is generated, no asset files.
 * The context is created lazily on the first user gesture because browsers
 * refuse to start audio before one.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function initAudio(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
}

export function setMuted(value: boolean): void {
  muted = value;
  if (master) master.gain.value = muted ? 0 : 0.35;
}

export function isMuted(): boolean {
  return muted;
}

function tone(
  type: OscillatorType,
  from: number,
  to: number,
  duration: number,
  gain: number,
  delay = 0,
): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + duration);
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(env).connect(master);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration: number, gain: number, filterHz: number, delay = 0): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) {
    // Fade the noise out over its length so it reads as a hit, not a hiss.
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterHz;
  filter.Q.value = 0.8;
  const env = ctx.createGain();
  env.gain.value = gain;
  src.connect(filter).connect(env).connect(master);
  src.start(t0);
}

export const sfx = {
  swipe(): void {
    tone('triangle', 620, 240, 0.09, 0.12);
  },
  nudge(): void {
    tone('square', 180, 120, 0.05, 0.07);
  },
  /** Glass/ceramic destruction — bright noise burst plus shard tones. */
  smash(value: number): void {
    noise(0.32, 0.5, 2600);
    noise(0.18, 0.3, 5200, 0.02);
    tone('triangle', 1400 + value * 4, 300, 0.18, 0.1, 0.01);
    tone('triangle', 900, 200, 0.22, 0.08, 0.05);
  },
  /** Heavy items land with a thud instead. */
  thud(): void {
    tone('sine', 150, 40, 0.28, 0.4);
    noise(0.14, 0.25, 400);
  },
  spray(): void {
    noise(0.45, 0.35, 7000);
  },
  grab(): void {
    tone('sawtooth', 300, 90, 0.22, 0.16);
  },
  meow(): void {
    tone('sawtooth', 520, 760, 0.14, 0.13);
    tone('sawtooth', 760, 420, 0.26, 0.11, 0.13);
  },
  hiss(): void {
    noise(0.5, 0.3, 5600);
  },
  gameOver(): void {
    tone('sawtooth', 400, 100, 0.5, 0.18);
    tone('sawtooth', 300, 70, 0.7, 0.14, 0.18);
  },
  combo(step: number): void {
    tone('square', 500 + step * 110, 900 + step * 110, 0.12, 0.09);
  },
};
