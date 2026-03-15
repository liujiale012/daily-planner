import dayjs, { type Dayjs } from 'dayjs';
import { TaskList } from '../tasks/TaskList';
import type { Task } from '../../types';
import { useTaskStore } from '../../stores/taskStore';
import { isTaskOnDay } from '../../lib/date-utils';

export function DayTaskPanel({
  day,
  onToggleComplete,
  onToggleStarred,
  onEdit,
  onDelete,
}: {
  day: Dayjs | null;
  onToggleComplete: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const tasks = useTaskStore((s) => s.tasks);
  const dayTasks = day
    ? tasks.filter((t) => isTaskOnDay(t.deadline, day)).sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
    : [];

  if (!day) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        点击日历选择日期查看任务
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {day.format('YYYY年M月D日')} 的任务
      </h3>
      <TaskList
        tasks={dayTasks}
        onToggleComplete={onToggleComplete}
        onToggleStarred={onToggleStarred}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage="该日暂无任务"
      />
    </div>
  );
}
