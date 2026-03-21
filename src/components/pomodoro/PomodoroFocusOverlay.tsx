import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Music, Pause, Play, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { playSecondHandTick, resumeWheelAudio } from '../../lib/wheelTick';
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
  /** 是否播放与秒同步的秒针咔嗒声 */
  secondHandSoundEnabled: boolean;
  onToggleSecondHandSound: () => void;
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
  secondHandSoundEnabled,
  onToggleSecondHandSound,
}: PomodoroFocusOverlayProps) {
  const prevSecondsRef = useRef<number | null>(null);
  const audioPrimedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      prevSecondsRef.current = null;
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  /** 与整秒倒计时同步的秒针音：仅在数字减少时播放 */
  useEffect(() => {
    if (!open) return;
    if (!isRunning) {
      prevSecondsRef.current = secondsLeft;
      return;
    }
    const prev = prevSecondsRef.current;
    if (secondHandSoundEnabled && prev !== null && secondsLeft < prev) {
      void resumeWheelAudio();
      playSecondHandTick();
    }
    prevSecondsRef.current = secondsLeft;
  }, [open, isRunning, secondsLeft, secondHandSoundEnabled]);

  useEffect(() => {
    if (open && isRunning && !audioPrimedRef.current) {
      audioPrimedRef.current = true;
      void resumeWheelAudio();
    }
    if (!open) audioPrimedRef.current = false;
  }, [open, isRunning]);

  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[120] flex flex-col overflow-hidden bg-[#060302] text-[#fff7ee]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pomodoro-overlay-quote"
      aria-describedby="pomodoro-overlay-time"
    >
      <HeartfeltRainBackground active className="opacity-[0.97]" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#1a1410]/25 via-transparent to-[#0a0604]/55 px-5 pb-8 pt-10 backdrop-blur-[1px] sm:px-10">
        <p
          id="pomodoro-overlay-quote"
          className="mx-auto max-w-xl text-center text-sm font-medium leading-relaxed text-[#e8d4c4]/95 sm:text-base"
        >
          {quote}
        </p>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6">
          <p
            id="pomodoro-overlay-time"
            className="font-mono text-6xl font-bold tabular-nums tracking-tight text-[#fffaf5] drop-shadow-sm sm:text-7xl md:text-8xl"
          >
            {formatTime(secondsLeft)}
          </p>
          <p
            className={`max-w-md text-center text-base sm:text-lg ${
              isBreak ? 'text-[#a8c4a8]' : 'text-[#f0dcc8]'
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
            className={`h-14 w-14 rounded-full border border-white/20 p-0 shadow-lg hover:text-[#fff7ee] ${
              secondHandSoundEnabled
                ? 'bg-white/10 text-[#fff7ee] hover:bg-white/20'
                : 'bg-white/5 text-[#fff7ee]/40 hover:bg-white/10 hover:text-[#fff7ee]/60'
            }`}
            onClick={() => {
              void resumeWheelAudio();
              onToggleSecondHandSound();
            }}
            aria-label={secondHandSoundEnabled ? '关闭秒针声音' : '开启秒针声音'}
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
