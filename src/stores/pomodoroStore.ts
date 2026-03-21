import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PomodoroSession {
  id: string;
  taskId: string | null;
  finishedAt: string;
  /** 本轮专注时长（分钟），用于统计 */
  durationMinutes: number;
  /** 本轮专注模块（展示用） */
  focusModuleLabel?: string | null;
}

export type PomodoroMode = 'pomodoro' | 'custom';

/** 专注场景模块：需先选择再开始计时 */
export type FocusModuleId =
  | 'none'
  | 'study'
  | 'sport'
  | 'research'
  | 'work'
  | 'today_task'
  | 'custom';

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
  focusModule: FocusModuleId;
  /** 选择「自定义」时的说明 */
  focusModuleCustomLabel: string;
  /** 选择「今日任务」时绑定的任务 id */
  focusTodayTaskId: string | 'none';

  addSession: (session: Omit<PomodoroSession, 'id'>) => void;

  setMode: (mode: PomodoroMode) => void;
  setFocusMinutes: (m: number) => void;
  setBreakMinutes: (m: number) => void;
  setCustomMinutes: (m: number) => void;
  setSecondsLeft: (updater: number | ((prev: number) => number)) => void;
  setIsRunning: (updater: boolean | ((prev: boolean) => boolean)) => void;
  setIsBreak: (updater: boolean | ((prev: boolean) => boolean)) => void;
  setCurrentTaskId: (id: string | 'none') => void;
  setFocusModule: (id: FocusModuleId) => void;
  setFocusModuleCustomLabel: (label: string) => void;
  setFocusTodayTaskId: (id: string | 'none') => void;
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
      focusModule: 'none',
      focusModuleCustomLabel: '',
      focusTodayTaskId: 'none',
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
      setIsRunning: (updater) =>
        set((s) => ({
          isRunning:
            typeof updater === 'function'
              ? (updater as (prev: boolean) => boolean)(s.isRunning)
              : updater,
        })),
      setIsBreak: (updater) =>
        set((s) => ({
          isBreak:
            typeof updater === 'function'
              ? (updater as (prev: boolean) => boolean)(s.isBreak)
              : updater,
        })),
      setCurrentTaskId: (currentTaskId) => set(() => ({ currentTaskId })),
      setFocusModule: (focusModule) =>
        set((s) => ({
          focusModule,
          focusTodayTaskId: focusModule === 'today_task' ? s.focusTodayTaskId : 'none',
        })),
      setFocusModuleCustomLabel: (focusModuleCustomLabel) => set(() => ({ focusModuleCustomLabel })),
      setFocusTodayTaskId: (focusTodayTaskId) => set(() => ({ focusTodayTaskId })),
    }),
    {
      name: 'daily-planner-pomodoro',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

