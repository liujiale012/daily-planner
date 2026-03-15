import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { useTaskStore } from '../../stores/taskStore';
import { createTask } from '../../lib/task';
import type { Priority } from '../../types';

const schema = z.object({
  title: z.string().min(1, '请输入标题').max(100),
  priority: z.enum(['high', 'medium', 'low']),
  category: z.string(),
  starred: z.boolean().optional(),
});

type FormData = z.infer<typeof schema> & { deadline?: string };

export function QuickAddTask({ categories }: { categories: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const addTask = useTaskStore((s) => s.addTask);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      priority: 'medium',
      category: categories[0] ?? '生活',
      starred: false,
    },
  });

  const onSubmit = (data: FormData) => {
    const deadline = data.deadline ? new Date(data.deadline).toISOString() : null;
    addTask(
      createTask({
        title: data.title.trim(),
        priority: data.priority as Priority,
        category: data.category,
        starred: !!data.starred,
        deadline,
      })
    );
    reset({
      title: '',
      priority: 'medium',
      category: categories[0] ?? '生活',
      starred: false,
    });
    setExpanded(false);
  };

  const title = watch('title');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="输入新任务..." className="flex-1" {...register('title')} />
        <Button type="submit" disabled={!title?.trim()} size="icon" aria-label="添加">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {errors.title && (
        <p className="text-xs text-red-500">{errors.title.message}</p>
      )}
      {expanded && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select
            options={[
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' },
            ]}
            {...register('priority')}
          />
          <Select
            options={categories.map((c) => ({ value: c, label: c }))}
            {...register('category')}
          />
          <input
            type="datetime-local"
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
            {...register('deadline')}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('starred')} />
            星标
          </label>
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setExpanded((e) => !e)}
      >
        {expanded ? '收起' : '更多选项'}
      </Button>
    </form>
  );
}
