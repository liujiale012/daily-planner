import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useTaskStore } from '../stores/taskStore';
import { isOverdue, getDueSoon } from '../lib/date-utils';

export function useStats() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => {
    const now = dayjs();
    const todayTasks = tasks.filter((t) => {
      const isDueToday = !!t.deadline && dayjs(t.deadline).isSame(now, 'day');
      const isCreatedTodayWithoutDeadline =
        !t.deadline && !!t.createdAt && dayjs(t.createdAt).isSame(now, 'day');
      return isDueToday || isCreatedTodayWithoutDeadline;
    });
    const completedToday = todayTasks.filter((t) => t.completed).length;
    const totalToday = todayTasks.length;
    const overdueCount = tasks.filter((t) => isOverdue(t.deadline, t.completed)).length;
    const highPriorityPending = tasks.filter(
      (t) => !t.completed && t.priority === 'high' && (!t.deadline || dayjs(t.deadline).isAfter(now))
    ).length;
    const dueSoonCount = tasks.filter((t) => getDueSoon(t.deadline, t.completed) !== null).length;
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = now.subtract(6 - i, 'day');
      const count = tasks.filter(
        (t) => t.completedAt && dayjs(t.completedAt).isSame(d, 'day')
      ).length;
      return {
        date: d.format('MM/DD'),
        dayLabel: ['日', '一', '二', '三', '四', '五', '六'][d.day()],
        count,
      };
    });
    return {
      todayTotal: totalToday,
      todayCompleted: completedToday,
      todayRate: totalToday ? Math.round((completedToday / totalToday) * 100) : 0,
      overdueCount,
      highPriorityPending,
      dueSoonCount,
      last7Days,
    };
  }, [tasks]);
}
