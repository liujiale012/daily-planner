import dayjs from 'dayjs';

export function isOverdue(deadline: string | null, completed: boolean): boolean {
  if (completed || !deadline) return false;
  return dayjs(deadline).isBefore(dayjs());
}

export function getDueSoon(deadline: string | null, completed: boolean): 'urgent' | 'soon' | null {
  if (completed || !deadline) return null;
  const now = dayjs();
  const d = dayjs(deadline);
  if (d.isBefore(now)) return null;
  const hours = d.diff(now, 'hour', true);
  if (hours <= 3) return 'urgent';
  if (hours <= 24) return 'soon';
  return null;
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return '';
  const d = dayjs(deadline);
  if (d.isSame(dayjs(), 'day')) return `今天 ${d.format('HH:mm')}`;
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return `明天 ${d.format('HH:mm')}`;
  return d.format('YYYY-MM-DD HH:mm');
}

export function remainingText(deadline: string | null, completed: boolean): string {
  if (completed || !deadline) return '';
  const now = dayjs();
  const d = dayjs(deadline);
  if (d.isBefore(now)) {
    const days = now.diff(d, 'day');
    return days === 0 ? '已过期' : `已过期 ${days} 天`;
  }
  const hours = d.diff(now, 'hour', true);
  if (hours < 24) return `剩余 ${Math.round(hours)} 小时`;
  return `剩余 ${d.diff(now, 'day')} 天`;
}

export function isTaskOnDay(deadline: string | null, day: dayjs.Dayjs): boolean {
  if (!deadline) return false;
  return dayjs(deadline).isSame(day, 'day');
}
