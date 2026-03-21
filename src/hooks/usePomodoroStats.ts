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

    /** 今日按「专注模块」汇总时长（仅统计带 focusModuleLabel 的完成记录，累加同名字段） */
    const todayWithModuleLabel = today.filter(
      (s) => typeof s.focusModuleLabel === 'string' && s.focusModuleLabel.trim().length > 0
    );
    const moduleMinutesMap = new Map<string, number>();
    for (const s of todayWithModuleLabel) {
      const label = s.focusModuleLabel!.trim();
      const m = s.durationMinutes ?? 25;
      moduleMinutesMap.set(label, (moduleMinutesMap.get(label) ?? 0) + m);
    }
    const todayModuleBreakdown = Array.from(moduleMinutesMap.entries())
      .map(([label, minutes]) => ({ label, minutes }))
      .filter((x) => x.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes || a.label.localeCompare(b.label, 'zh-CN'));

    return {
      todayCount: today.length,
      weekCount: week.length,
      todayMinutes: sumMinutes(today),
      weekMinutes: sumMinutes(week),
      last7Days,
      todayModuleBreakdown,
    };
  }, [sessions]);
}

