import { useMemo } from 'react';
import dayjs from 'dayjs';
import { usePomodoroStore } from '../stores/pomodoroStore';

export function usePomodoroStats() {
  const sessions = usePomodoroStore((s) => s.sessions);

  return useMemo(() => {
    const now = dayjs();
    const today = sessions.filter((s) => dayjs(s.finishedAt).isSame(now, 'day'));
    const week = sessions.filter((s) => dayjs(s.finishedAt).isSame(now, 'week'));

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = now.subtract(6 - i, 'day');
      const count = sessions.filter((s) => dayjs(s.finishedAt).isSame(d, 'day')).length;
      return {
        date: d.format('MM/DD'),
        dayLabel: ['日', '一', '二', '三', '四', '五', '六'][d.day()],
        count,
      };
    });

    const sumMinutes = (items: typeof sessions) =>
      items.reduce((acc, s) => acc + (s.durationMinutes ?? 25), 0);

    return {
      todayCount: today.length,
      weekCount: week.length,
      todayMinutes: sumMinutes(today),
      weekMinutes: sumMinutes(week),
      last7Days,
    };
  }, [sessions]);
}

