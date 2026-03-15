import dayjs, { type Dayjs } from 'dayjs';
import { cn } from '../../lib/utils';
import { isTaskOnDay } from '../../lib/date-utils';
import type { Task } from '../../types';
import { useTaskStore } from '../../stores/taskStore';

export function CalendarMonthView({
  current,
  onSelectDay,
  selectedDay,
}: {
  current: Dayjs;
  onSelectDay: (day: Dayjs) => void;
  selectedDay: Dayjs | null;
}) {
  const tasks = useTaskStore((s) => s.tasks);
  const first = current.startOf('month');
  const start =
    first.day() === 0 ? first.subtract(6, 'day') : first.subtract(first.day() - 1, 'day');
  const weeks: Dayjs[][] = [];
  let cursor = start.subtract(1, 'day');
  for (let w = 0; w < 6; w++) {
    const week: Dayjs[] = [];
    for (let d = 0; d < 7; d++) {
      cursor = cursor.add(1, 'day');
      week.push(cursor);
    }
    weeks.push(week);
  }

  const getTaskCount = (day: Dayjs) =>
    tasks.filter((t) => !t.completed && isTaskOnDay(t.deadline, day)).length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {['一', '二', '三', '四', '五', '六', '日'].map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const isCurrentMonth = day.month() === current.month();
          const isToday = day.isSame(dayjs(), 'day');
          const isSelected = selectedDay && day.isSame(selectedDay, 'day');
          const count = getTaskCount(day);
          return (
            <button
              key={day.format('YYYY-MM-DD')}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                'min-h-[72px] border-b border-r border-gray-100 p-1 text-left text-sm transition-colors dark:border-gray-700',
                !isCurrentMonth && 'bg-gray-50 text-gray-400 dark:bg-gray-900/50',
                isCurrentMonth && 'text-gray-900 dark:text-gray-100',
                isToday && 'ring-1 ring-indigo-500 ring-inset',
                isSelected && 'bg-indigo-50 dark:bg-indigo-900/20'
              )}
            >
              <span className="inline-block rounded px-1 py-0.5">{day.date()}</span>
              {count > 0 && (
                <span className="mt-1 block text-xs text-indigo-600 dark:text-indigo-400">
                  {count} 项
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
