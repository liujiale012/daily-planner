import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PomodoroSession {
  id: string;
  taskId: string | null;
  finishedAt: string;
  /** 本轮专注时长（分钟），用于统计 */
  durationMinutes: number;
}

export type PomodoroMode = 'pomodoro' | 'custom';

interface PomodoroState {
  sessions: PomodoroSession[];
  // 运行时状态（用于避免切换路由时重置）
  mode: PomodoroMode;
  focusMinutes: number;
  breakMinutes: number;
  customMinutes: number;
  secondsLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  currentTaskId: string | 'none';

  addSession: (session: Omit<PomodoroSession, 'id'>) => void;

  setMode: (mode: PomodoroMode) => void;
  setFocusMinutes: (m: number) => void;
  setBreakMinutes: (m: number) => void;
  setCustomMinutes: (m: number) => void;
  setSecondsLeft: (updater: number | ((prev: number) => number)) => void;
  setIsRunning: (r: boolean) => void;
  setIsBreak: (b: boolean) => void;
  setCurrentTaskId: (id: string | 'none') => void;
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      sessions: [],
      mode: 'pomodoro',
      focusMinutes: 25,
      breakMinutes: 5,
      customMinutes: 30,
      secondsLeft: 25 * 60,
      isRunning: false,
      isBreak: false,
      currentTaskId: 'none',
      addSession: (session) =>
        set((s) => ({
          sessions: [
            ...s.sessions,
            {
              id: crypto.randomUUID(),
              ...session,
            },
          ],
        })),
      setMode: (mode) =>
        set((s) => ({
          mode,
          // 切换模式时，停止计时，重置剩余时间到对应模式
          isRunning: false,
          isBreak: false,
          secondsLeft:
            mode === 'pomodoro' ? s.focusMinutes * 60 : s.customMinutes * 60,
        })),
      setFocusMinutes: (m) =>
        set((s) => ({
          focusMinutes: m,
          secondsLeft: !s.isBreak && s.mode === 'pomodoro' && !s.isRunning ? m * 60 : s.secondsLeft,
        })),
      setBreakMinutes: (m) =>
        set((s) => ({
          breakMinutes: m,
          secondsLeft: s.isBreak && s.mode === 'pomodoro' && !s.isRunning ? m * 60 : s.secondsLeft,
        })),
      setCustomMinutes: (m) =>
        set((s) => ({
          customMinutes: m,
          secondsLeft: s.mode === 'custom' && !s.isRunning ? m * 60 : s.secondsLeft,
        })),
      setSecondsLeft: (updater) =>
        set((s) => ({
          secondsLeft:
            typeof updater === 'function'
              ? (updater as (prev: number) => number)(s.secondsLeft)
              : updater,
        })),
      setIsRunning: (isRunning) => set(() => ({ isRunning })),
      setIsBreak: (isBreak) => set(() => ({ isBreak })),
      setCurrentTaskId: (currentTaskId) => set(() => ({ currentTaskId })),
    }),
    {
      name: 'daily-planner-pomodoro',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

