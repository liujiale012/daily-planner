import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { resumeWheelAudio } from '../../lib/wheelTick';
import { startRainAmbience, stopRainAmbience } from '../../lib/rainAmbience';
import { HeartfeltRainBackground } from './HeartfeltRainBackground';

type PomodoroFocusOverlayProps = {
  open: boolean;
  /** 剩余秒数（与 store 同步） */
  secondsLeft: number;
  isBreak: boolean;
  /** 倒计时下方展示的名称 */
  taskLabel: string;
  quote: string;
  /** 是否处于运行中（非暂停） */
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  /** 从当前阶段起点重新倒计时（保持运行意图：若当前为暂停则先恢复） */
  onRestartSegment: () => void;
  /** 结束本次计时：停止并复位到本段初始时长 */
  onEndSession: () => void;
  formatTime: (seconds: number) => string;
  /** 雨滴环境音是否开启 */
  overlayRainSoundOn: boolean;
  onToggleOverlayRainSound: () => void;
};

export function PomodoroFocusOverlay({
  open,
  secondsLeft,
  isBreak,
  taskLabel,
  quote,
  isRunning,
  onPause,
  onResume,
  onRestartSegment,
  onEndSession,
  formatTime,
  overlayRainSoundOn,
  onToggleOverlayRainSound,
}: PomodoroFocusOverlayProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /** 雨声：遮罩打开且开启时播放 */
  useEffect(() => {
    if (!open || !overlayRainSoundOn) {
      stopRainAmbience();
      return;
    }
    void resumeWheelAudio().then(() => {
      startRainAmbience();
    });
    return () => {
      stopRainAmbience();
    };
  }, [open, overlayRainSoundOn]);

  if (!open) return null;

  const musicBtnClass = overlayRainSoundOn
    ? 'border-white/25 bg-white/10 text-[#fff7ee] shadow-lg ring-2 ring-emerald-400/25 hover:bg-white/18 hover:text-[#fff7ee]'
    : 'border-white/15 bg-white/[0.06] text-[#fff7ee]/35 shadow-md hover:bg-white/10 hover:text-[#fff7ee]/55';

  const node = (
    <div
      className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-black text-[#fff7ee]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pomodoro-overlay-quote"
      aria-describedby="pomodoro-overlay-time"
    >
      <HeartfeltRainBackground active className="opacity-100" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-8 pt-10 sm:px-10">
        <p
          id="pomodoro-overlay-quote"
          className="mx-auto max-w-xl text-center text-sm font-medium leading-relaxed text-[#e8e4e0]/95 drop-shadow-[0_1px_12px_rgba(0,0,0,0.75)] sm:text-base"
        >
          {quote}
        </p>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
          <p
            id="pomodoro-overlay-time"
            className="font-mono text-6xl font-bold tabular-nums tracking-tight text-[#f8f6f3] drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] sm:text-7xl md:text-8xl"
          >
            {formatTime(secondsLeft)}
          </p>
          <p
            className={`max-w-md text-center text-base drop-shadow-[0_1px_10px_rgba(0,0,0,0.8)] sm:text-lg ${
              isBreak ? 'text-[#b8d4c8]' : 'text-[#ebe6e0]'
            }`}
          >
            {taskLabel}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full border border-white/20 bg-white/10 p-0 text-[#fff7ee] shadow-lg hover:bg-white/20 hover:text-[#fff7ee]"
            onClick={() => {
              void resumeWheelAudio();
              if (isRunning) onPause();
              else onResume();
            }}
            aria-label={isRunning ? '暂停' : '继续'}
          >
            {isRunning ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 pl-0.5" />}
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className={`h-14 w-14 rounded-full p-0 ${musicBtnClass}`}
            onClick={() => {
              void resumeWheelAudio();
              onToggleOverlayRainSound();
            }}
            aria-label={overlayRainSoundOn ? '关闭雨滴声' : '开启雨滴声'}
          >
            <Music className="h-7 w-7" />
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full border border-white/20 bg-white/10 p-0 text-[#fff7ee] shadow-lg hover:bg-white/20 hover:text-[#fff7ee]"
            onClick={() => {
              void resumeWheelAudio();
              onRestartSegment();
            }}
            aria-label="重新计时"
          >
            <RotateCcw className="h-7 w-7" />
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 w-14 rounded-full border border-red-400/50 bg-red-700/90 p-0 text-white shadow-[0_8px_24px_rgba(185,28,28,0.35)] hover:bg-red-600 hover:text-white"
            onClick={() => {
              void resumeWheelAudio();
              onEndSession();
            }}
            aria-label="结束"
          >
            <Square className="h-6 w-6 fill-current" />
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
