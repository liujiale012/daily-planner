import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
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

function toLocalDateTimeInputValue(date: Date): string {
  return dayjs(date).format('YYYY-MM-DDTHH:mm');
}

function nextWeekendDate(): Date {
  const now = dayjs();
  const day = now.day(); // 0 = Sun
  const daysToSaturday = day <= 6 ? (6 - day || 7) : 6;
  return now.add(daysToSaturday, 'day').hour(18).minute(0).second(0).millisecond(0).toDate();
}

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
  const [moreOpen, setMoreOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [deadlinePickerOpen, setDeadlinePickerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
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

  useEffect(() => {
    if (!open) return;
    const hasNote = !!watch('note')?.trim();
    const hasDetailsByTask =
      !!task ||
      hasNote ||
      watch('priority') !== 'medium' ||
      watch('repeatType') !== 'none' ||
      watch('starred') ||
      watch('category') !== (categories[0] ?? '生活');

    setMoreOpen(!!hasDetailsByTask && !!task);
    setNoteOpen(hasNote);
    setDeadlinePickerOpen(!!watch('deadline'));
  }, [open, task, watch, categories]);

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
  const deadline = watch('deadline');
  const deadlineLabel = useMemo(() => {
    if (!deadline) return '添加截止时间';
    return dayjs(deadline).format('M月D日 HH:mm');
  }, [deadline]);

  const applyQuickDeadline = (kind: 'today' | 'tomorrow' | 'weekend') => {
    let date: Date;
    if (kind === 'today') {
      date = dayjs().hour(21).minute(0).second(0).millisecond(0).toDate();
    } else if (kind === 'tomorrow') {
      date = dayjs().add(1, 'day').hour(21).minute(0).second(0).millisecond(0).toDate();
    } else {
      date = nextWeekendDate();
    }
    setValue('deadline', toLocalDateTimeInputValue(date), { shouldDirty: true });
    setDeadlinePickerOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader
          title={task ? '编辑任务' : '新建任务'}
          onClose={() => onOpenChange(false)}
        />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              标题 <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('title')}
              autoFocus
              placeholder="输入任务标题"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !(e.nativeEvent as KeyboardEvent).isComposing) {
                  e.preventDefault();
                  void handleSubmit(onSubmit)();
                }
              }}
            />
            {errors.title?.message && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-[rgba(var(--surface-border-rgb),0.8)] bg-[rgba(var(--surface-bg-rgb),0.7)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">截止时间</span>
              {deadline ? (
                <button
                  type="button"
                  onClick={() => setValue('deadline', '', { shouldDirty: true })}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                >
                  清除
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeadlinePickerOpen((v) => !v)}
              >
                {deadlineLabel}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => applyQuickDeadline('today')}>
                今天
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => applyQuickDeadline('tomorrow')}>
                明天
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => applyQuickDeadline('weekend')}>
                本周末
              </Button>
            </div>
            {deadlinePickerOpen ? (
              <input
                type="datetime-local"
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800"
                {...register('deadline')}
              />
            ) : null}
          </div>

          <div className="rounded-xl border border-[rgba(var(--surface-border-rgb),0.8)]">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium"
            >
              更多设置
              {moreOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {moreOpen ? (
              <div className="space-y-4 border-t border-[rgba(var(--surface-border-rgb),0.8)] px-3 py-3">
                <div>
                  {!noteOpen ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setNoteOpen(true)}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      添加备注
                    </Button>
                  ) : (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium">备注</label>
                        <button
                          type="button"
                          onClick={() => {
                            setNoteOpen(false);
                            setValue('note', '', { shouldDirty: true });
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                        >
                          收起
                        </button>
                      </div>
                      <textarea
                        className="min-h-[72px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                        placeholder="写点补充信息（可选）"
                        {...register('note')}
                      />
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">分类</label>
                    <Select
                      options={categories.map((c) => ({ value: c, label: c }))}
                      {...register('category')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">优先级</label>
                    <div className="flex items-center gap-2">
                      {([
                        { value: 'low', label: '低' },
                        { value: 'medium', label: '中' },
                        { value: 'high', label: '高' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setValue('priority', opt.value, { shouldDirty: true })}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            watch('priority') === opt.value
                              ? 'border-[rgb(var(--accent))] bg-[rgba(var(--accent),0.12)] text-[rgb(var(--accent))]'
                              : 'border-gray-200 bg-white text-slate-600 hover:border-[rgba(var(--accent),0.35)] dark:border-gray-600 dark:bg-gray-800 dark:text-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <label className="mt-6 flex items-center gap-2">
                    <Checkbox checked={starred} onCheckedChange={(v) => setValue('starred', !!v)} />
                    <span className="text-sm">星标任务</span>
                  </label>
                </div>
              </div>
            ) : null}
          </div>

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
