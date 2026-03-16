import type { Task } from '../../types';
import { TaskCard } from './TaskCard';

interface TaskListProps {
  title?: string;
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  emptyMessage?: string;
}

export function TaskList({
  title,
  tasks,
  onToggleComplete,
  onToggleStarred,
  onEdit,
  onDelete,
  emptyMessage = '暂无任务',
}: TaskListProps) {
  return (
    <section>
      {title && (
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      )}
      {tasks.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-[#f5e7d0] bg-[#fff7ee] py-8 text-center text-sm text-[#b58a6a]">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard
                task={task}
                onToggleComplete={onToggleComplete}
                onToggleStarred={onToggleStarred}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
