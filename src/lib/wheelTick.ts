/** 轻量滑轮刻度音（无需音频文件，Web Audio） */
let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new Ctx();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/** 用户交互后调用一次，解除浏览器自动播放限制 */
export async function resumeWheelAudio(): Promise<void> {
  const ctx = getCtx();
  if (ctx?.state === 'suspended') {
    await ctx.resume().catch(() => {});
  }
}

/**
 * 短促“咔嗒”，音量很小避免刺耳
 * @param pitchHz 频率，略调可区分不同步进
 */
export function playWheelTick(pitchHz = 880): void {
  const ctx = getCtx();
  if (!ctx) return;

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(pitchHz, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.06, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}

/** 钟表秒针式轻叩（略低频、略短），与整秒倒计时同步 */
export function playSecondHandTick(): void {
  const ctx = getCtx();
  if (!ctx) return;

  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(520, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.038);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.042);
}
