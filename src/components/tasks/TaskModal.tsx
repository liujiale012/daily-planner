import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task, Priority, RepeatType } from '../../types';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useTaskStore } from '../../stores/taskStore';
import { createTask } from '../../lib/task';

const schema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  note: z.string().max(500).optional(),
  category: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  deadline: z.string().optional(),
  repeatType: z.enum(['none', 'daily', 'weekly', 'monthly']),
  starred: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function TaskModal({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task: Task | null;
}) {
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const categories = useTaskStore((s) => s.categories);

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      note: '',
      category: '生活',
      priority: 'medium',
      deadline: '',
      repeatType: 'none',
      starred: false,
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        note: task.note,
        category: task.category,
        priority: task.priority,
        deadline: task.deadline ? task.deadline.slice(0, 16) : '',
        repeatType: task.repeatType,
        starred: task.starred,
      });
    } else {
      const cats = useTaskStore.getState().categories;
      reset({
        title: '',
        note: '',
        category: cats[0] ?? '生活',
        priority: 'medium',
        deadline: '',
        repeatType: 'none',
        starred: false,
      });
    }
  }, [task, reset]);

  const onSubmit = (data: FormData) => {
    const deadline = data.deadline ? new Date(data.deadline).toISOString() : null;
    if (task) {
      updateTask(task.id, {
        title: data.title.trim(),
        note: (data.note ?? '').trim(),
        category: data.category,
        priority: data.priority as Priority,
        repeatType: data.repeatType as RepeatType,
        starred: data.starred,
        deadline,
      });
    } else {
      addTask(
        createTask({
          title: data.title.trim(),
          note: (data.note ?? '').trim(),
          category: data.category,
          priority: data.priority as Priority,
          repeatType: data.repeatType as RepeatType,
          starred: data.starred,
          deadline,
        })
      );
    }
    onOpenChange(false);
  };

  const starred = watch('starred');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title={task ? '编辑任务' : '新建任务'}
          onClose={() => onOpenChange(false)}
        />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">标题</label>
            <Input {...register('title')} placeholder="任务标题" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">备注</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              placeholder="可选"
              {...register('note')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">分类</label>
              <Select
                options={categories.map((c) => ({ value: c, label: c }))}
                {...register('category')}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">优先级</label>
              <Select
                options={[
                  { value: 'high', label: '高' },
                  { value: 'medium', label: '中' },
                  { value: 'low', label: '低' },
                ]}
                {...register('priority')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">截止时间</label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
                {...register('deadline')}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">重复</label>
              <Select
                options={[
                  { value: 'none', label: '不重复' },
                  { value: 'daily', label: '每天' },
                  { value: 'weekly', label: '每周' },
                  { value: 'monthly', label: '每月' },
                ]}
                {...register('repeatType')}
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <Checkbox checked={starred} onCheckedChange={(v) => setValue('starred', !!v)} />
            <span className="text-sm">星标任务</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
