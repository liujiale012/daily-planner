import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTaskStore } from '../stores/taskStore';
import { isOverdue } from '../lib/date-utils';
import type { Task, Priority } from '../types';

export type StatusFilter = 'all' | 'incomplete' | 'completed' | 'overdue';
export type TimeFilter = 'all' | 'today' | 'week' | 'month';
export type SortKey = 'default' | 'created' | 'deadline' | 'priority' | 'starred' | 'completed';

export function useFilteredTasks(
  search: string,
  status: StatusFilter,
  priority: Priority | 'all',
  category: string,
  timeRange: TimeFilter,
  sortBy: SortKey
) {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => {
    let result = tasks.filter((t) => {
      const matchSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.note.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (status === 'incomplete' && t.completed) return false;
      if (status === 'completed' && !t.completed) return false;
      if (status === 'overdue' && !isOverdue(t.deadline, t.completed)) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (category !== 'all' && t.category !== category) return false;
      const now = dayjs();
      if (timeRange === 'today' && (!t.deadline || !dayjs(t.deadline).isSame(now, 'day')))
        return false;
      if (timeRange === 'week' && (!t.deadline || !dayjs(t.deadline).isSame(now, 'week')))
        return false;
      if (timeRange === 'month' && (!t.deadline || !dayjs(t.deadline).isSame(now, 'month')))
        return false;
      return true;
    });
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (sortBy === 'default')
      result = [...result].sort((a, b) =>
        a.starred !== b.starred
          ? a.starred
            ? -1
            : 1
          : a.completed !== b.completed
            ? a.completed
              ? 1
              : -1
            : priorityOrder[a.priority] - priorityOrder[b.priority]
      );
    else if (sortBy === 'created')
      result = [...result].sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()
      );
    else if (sortBy === 'deadline')
      result = [...result].sort((a, b) =>
        !a.deadline ? 1 : !b.deadline ? -1 : dayjs(a.deadline).valueOf() - dayjs(b.deadline).valueOf()
      );
    else if (sortBy === 'priority')
      result = [...result].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    else if (sortBy === 'starred')
      result = [...result].sort((a, b) => (a.starred === b.starred ? 0 : a.starred ? -1 : 1));
    else if (sortBy === 'completed')
      result = [...result].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
    return result;
  }, [tasks, search, status, priority, category, timeRange, sortBy]);
}
