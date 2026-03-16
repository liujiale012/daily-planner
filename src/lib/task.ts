import type { Task, Priority, RepeatType } from '../types';

export function createTask(partial: {
  title: string;
  note?: string;
  category?: string;
  priority?: Priority;
  deadline?: string | null;
  starred?: boolean;
  repeatType?: RepeatType;
}): Task {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: partial.title,
    note: partial.note ?? '',
    category: partial.category ?? '生活',
    priority: partial.priority ?? 'medium',
    deadline: partial.deadline ?? null,
    completed: false,
    starred: partial.starred ?? false,
    repeatType: partial.repeatType ?? 'none',
    pomodoroCount: 0,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}
