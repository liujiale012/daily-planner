/**
 * 专注遮罩「雨滴」环境音：稀疏、轻柔的滴滴答答（随机间隔的短水滴声），与 wheelTick 共用 AudioContext。
 */
import { getSharedAudioContext } from './wheelTick';

let dripTimeoutId: ReturnType<typeof setTimeout> | null = null;
let ambienceActive = false;

function clearDripSchedule(): void {
  if (dripTimeoutId !== null) {
    clearTimeout(dripTimeoutId);
    dripTimeoutId = null;
  }
}

/** 单次极轻水滴：短促带通噪声 + 极弱高频「嗒」 */
function playSoftDrip(ctx: AudioContext): void {
  const t0 = ctx.currentTime;
  const sr = ctx.sampleRate;
  const dur = 0.038;
  const n = Math.max(1, Math.floor(sr * dur));
  const buffer = ctx.createBuffer(1, n, sr);
  const ch = buffer.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const env = Math.exp(-(i / sr) * 95);
    ch[i] = (Math.random() * 2 - 1) * env;
  }

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = buffer;

  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1100 + Math.random() * 1600;
  bp.Q.value = 1.8;

  const gNoise = ctx.createGain();
  gNoise.gain.setValueAtTime(0.0001, t0);
  gNoise.gain.exponentialRampToValueAtTime(0.014, t0 + 0.008);
  gNoise.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.034);

  noiseSrc.connect(bp);
  bp.connect(gNoise);
  gNoise.connect(ctx.destination);

  const tick = ctx.createOscillator();
  tick.type = 'sine';
  tick.frequency.setValueAtTime(3200 + Math.random() * 900, t0);
  const gTick = ctx.createGain();
  gTick.gain.setValueAtTime(0.0001, t0);
  gTick.gain.exponentialRampToValueAtTime(0.006, t0 + 0.003);
  gTick.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.022);
  tick.connect(gTick);
  gTick.connect(ctx.destination);

  noiseSrc.start(t0);
  noiseSrc.stop(t0 + dur);
  tick.start(t0);
  tick.stop(t0 + 0.028);
}

function scheduleNextDrip(ctx: AudioContext): void {
  if (!ambienceActive) return;
  const gapMs = 550 + Math.random() * 2800;
  dripTimeoutId = setTimeout(() => {
    if (!ambienceActive) return;
    playSoftDrip(ctx);
    scheduleNextDrip(ctx);
  }, gapMs);
}

/** 停止雨声 */
export function stopRainAmbience(): void {
  ambienceActive = false;
  clearDripSchedule();
}

/**
 * 开始轻柔滴滴答答。需先经用户手势调用 resumeWheelAudio。
 */
export function startRainAmbience(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;

  stopRainAmbience();
  ambienceActive = true;

  const kickoff = () => {
    if (!ambienceActive) return;
    playSoftDrip(ctx);
    scheduleNextDrip(ctx);
  };
  dripTimeoutId = setTimeout(kickoff, 200 + Math.random() * 500);
}
