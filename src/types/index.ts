export type Priority = 'high' | 'medium' | 'low';
export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  note: string;
  category: string;
  priority: Priority;
  deadline: string | null;
  completed: boolean;
  starred: boolean;
  repeatType: RepeatType;
  /** 已为此任务完成的番茄钟轮数 */
  pomodoroCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type AccentColor =
  | 'orange'
  | 'indigo'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'sky'
  | 'amber'
  | 'teal'
  | 'fuchsia';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  calendarView: 'month';
  todayGoal: string;
  accentColor: AccentColor;
  qwenApiKey: string;
}

export const DEFAULT_CATEGORIES = ['工作', '学习', '生活', '健身', '购物'];
const ENV_QWEN_API_KEY =
  typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_QWEN_API_KEY === 'string'
    ? import.meta.env.VITE_QWEN_API_KEY.trim()
    : '';
export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  calendarView: 'month',
  todayGoal: '',
  accentColor: 'indigo',
  qwenApiKey: ENV_QWEN_API_KEY,
};
