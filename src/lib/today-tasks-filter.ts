import dayjs from 'dayjs';
import type { Task } from '../types';

/**
 * 与首页「今日任务」一致：
 * - 截止日期为今天，或
 * - 无截止日期且创建于今天
 */
export function isTaskDueToday(task: Task): boolean {
  const now = dayjs();
  const isDueToday = !!task.deadline && dayjs(task.deadline).isSame(now, 'day');
  const isCreatedTodayWithoutDeadline =
    !task.deadline && !!task.createdAt && dayjs(task.createdAt).isSame(now, 'day');
  return isDueToday || isCreatedTodayWithoutDeadline;
}

/** 今日且未完成的任务（用于番茄钟「今日任务」模块） */
export function getTodayIncompleteTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.completed && isTaskDueToday(t));
}
