import { useMemo } from 'react';
import dayjs from 'dayjs';
import { usePomodoroStore } from '../stores/pomodoroStore';
import type { PomodoroSession } from '../stores/pomodoroStore';

/** 满 1 分钟才计入统计；时长按整数分钟（向下取整，忽略历史小数） */
function eligibleStatMinutes(s: PomodoroSession): number | null {
  const m = Math.floor(Number(s.durationMinutes ?? 0));
  if (!Number.isFinite(m) || m < 1) return null;
  return m;
}

export function usePomodoroStats() {
  const sessions = usePomodoroStore((s) => s.sessions);

  return useMemo(() => {
    const now = dayjs();
    const today = sessions.filter(
      (s) => dayjs(s.finishedAt).isSame(now, 'day') && eligibleStatMinutes(s) !== null
    );
    const week = sessions.filter(
      (s) => dayjs(s.finishedAt).isSame(now, 'week') && eligibleStatMinutes(s) !== null
    );

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = now.subtract(6 - i, 'day');
      const count = sessions.filter(
        (s) =>
          dayjs(s.finishedAt).isSame(d, 'day') && eligibleStatMinutes(s) !== null
      ).length;
      return {
        date: d.format('MM/DD'),
        dayLabel: ['日', '一', '二', '三', '四', '五', '六'][d.day()],
        count,
      };
    });

    const sumMinutes = (items: typeof sessions) =>
      items.reduce((acc, s) => acc + (eligibleStatMinutes(s) ?? 0), 0);

    /** 今日按「专注模块」汇总时长（仅统计满 1 分钟且带 focusModuleLabel） */
    const todayWithModuleLabel = today.filter(
      (s) => typeof s.focusModuleLabel === 'string' && s.focusModuleLabel.trim().length > 0
    );
    const moduleMinutesMap = new Map<string, number>();
    for (const s of todayWithModuleLabel) {
      const label = s.focusModuleLabel!.trim();
      const m = eligibleStatMinutes(s);
      if (m == null) continue;
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

