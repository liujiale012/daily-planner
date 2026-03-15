import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

interface TaskState {
  tasks: Task[];
  categories: string[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleStarred: (id: string) => void;
  replaceState: (tasks: Task[], categories: string[]) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      categories: DEFAULT_CATEGORIES,
      addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      toggleComplete: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: t.completed ? null : new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        })),
      toggleStarred: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)),
        })),
      replaceState: (tasks, categories) => set({ tasks, categories }),
    }),
    {
      name: 'daily-planner-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ tasks: s.tasks, categories: s.categories }),
    }
  )
);
