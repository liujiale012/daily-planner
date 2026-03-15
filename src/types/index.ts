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
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'rose';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  calendarView: 'month';
  todayGoal: string;
  accentColor: AccentColor;
  qwenApiKey: string;
}

export const DEFAULT_CATEGORIES = ['工作', '学习', '生活', '健身', '购物'];
export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  calendarView: 'month',
  todayGoal: '',
  accentColor: 'indigo',
  qwenApiKey: '',
};
