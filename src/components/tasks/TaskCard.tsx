import { useState } from 'react';
import { Star, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { randomTaskCompleteToast } from '../../lib/task-complete-toasts';
import type { Task } from '../../types';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';
import { formatDeadline, remainingText, isOverdue } from '../../lib/date-utils';

const priorityLabels = { high: '高', medium: '中', low: '低' };
const priorityStyles = {
  high: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
};

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onToggleStarred: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({
  task,
  onToggleComplete,
  onToggleStarred,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [justCompleted, setJustCompleted] = useState(false);
  const [checkboxGlow, setCheckboxGlow] = useState(false);
  const overdue = isOverdue(task.deadline, task.completed);
  const remaining = remainingText(task.deadline, task.completed);

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-xl border bg-white p-3 shadow-sm transition-shadow duration-300 dark:bg-gray-800',
        overdue && 'border-l-4 border-l-red-500',
        task.completed && 'bg-gray-50 dark:bg-gray-800/80',
        !overdue && 'border-gray-200 dark:border-gray-700',
        justCompleted && 'animate-task-complete-pop shadow-md shadow-pink-200/50 ring-1 ring-pink-200/60 dark:shadow-pink-900/20 dark:ring-pink-500/25'
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => {
          onToggleComplete(task.id);
          if (!task.completed) {
            toast.success(randomTaskCompleteToast());
            setJustCompleted(true);
            setCheckboxGlow(true);
            window.setTimeout(() => setJustCompleted(false), 560);
            window.setTimeout(() => setCheckboxGlow(false), 700);
          }
        }}
        className={cn(
          'mt-0.5 shrink-0 transition-transform duration-200',
          checkboxGlow && 'animate-checkbox-spark rounded-full'
        )}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-medium text-gray-900 dark:text-gray-100',
            task.completed && 'text-gray-400 line-through dark:text-gray-500'
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{task.category}</span>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 font-medium',
              priorityStyles[task.priority]
            )}
          >
            {priorityLabels[task.priority]}
          </span>
          {task.deadline && (
            <>
              <span>{formatDeadline(task.deadline)}</span>
              {remaining && (
                <span className={overdue ? 'text-red-500' : ''}>{remaining}</span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleStarred(task.id)}
          className={task.starred ? 'text-amber-500' : ''}
          aria-label={task.starred ? '取消星标' : '星标'}
        >
          <Star className={cn('h-4 w-4', task.starred && 'fill-current')} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onEdit(task)} aria-label="编辑">
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(task)} aria-label="删除">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
