import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/** 心情档位（含 emoji 展示在 UI） */
export type MoodKey = 'great' | 'good' | 'calm' | 'neutral' | 'tired' | 'low';

export interface DayMood {
  mood: MoodKey;
  note: string;
  updatedAt: string;
}

interface MoodState {
  /** 本地日期的 key：YYYY-MM-DD */
  byDate: Record<string, DayMood>;
  setDayMood: (dateKey: string, mood: MoodKey, note: string) => void;
  removeDayMood: (dateKey: string) => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set) => ({
      byDate: {},
      setDayMood: (dateKey, mood, note) =>
        set((s) => ({
          byDate: {
            ...s.byDate,
            [dateKey]: {
              mood,
              note: note.trim(),
              updatedAt: new Date().toISOString(),
            },
          },
        })),
      removeDayMood: (dateKey) =>
        set((s) => {
          const next = { ...s.byDate };
          delete next[dateKey];
          return { byDate: next };
        }),
    }),
    {
      name: 'daily-planner-mood',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byDate: s.byDate }),
    }
  )
);

export const MOOD_OPTIONS: { key: MoodKey; label: string; emoji: string; hint: string }[] = [
  { key: 'great', label: '特别好', emoji: '🤩', hint: '能量满满' },
  { key: 'good', label: '不错', emoji: '😊', hint: '心情明亮' },
  { key: 'calm', label: '平静', emoji: '😌', hint: '稳稳的' },
  { key: 'neutral', label: '一般', emoji: '😐', hint: '普通一天' },
  { key: 'tired', label: '有点累', emoji: '😓', hint: '需要歇歇' },
  { key: 'low', label: '低落', emoji: '😔', hint: '允许自己慢下来' },
];
