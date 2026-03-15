import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings, AccentColor } from '../types';
import { DEFAULT_SETTINGS } from '../types';

interface SettingsState extends Settings {
  setTheme: (theme: Settings['theme']) => void;
  setTodayGoal: (todayGoal: string) => void;
  setAccentColor: (accentColor: AccentColor) => void;
  setQwenApiKey: (qwenApiKey: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTheme: (theme) => set({ theme }),
      setTodayGoal: (todayGoal) => set({ todayGoal }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setQwenApiKey: (qwenApiKey) => set({ qwenApiKey }),
    }),
    { name: 'daily-planner-settings', storage: createJSONStorage(() => localStorage) }
  )
);
