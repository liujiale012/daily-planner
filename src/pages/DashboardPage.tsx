import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { QuickAddTask } from '../components/tasks/QuickAddTask';
import { TaskList } from '../components/tasks/TaskList';
import { TaskModal } from '../components/tasks/TaskModal';
import { DeleteConfirmDialog } from '../components/tasks/DeleteConfirmDialog';
import { DailyQuote } from '../components/dashboard/DailyQuote';
import { TodayGoal } from '../components/dashboard/TodayGoal';
import { TrendChart } from '../components/stats/TrendChart';
import { useTaskStore } from '../stores/taskStore';
import { useStats } from '../hooks/useStats';
import dayjs from 'dayjs';
import type { Task } from '../types';

export function DashboardPage() {
  const { tasks, categories, toggleComplete, toggleStarred, deleteTask } = useTaskStore();
  const stats = useStats();
  const todayTasks = tasks.filter((t) => {
    const now = dayjs();
    const isDueToday = !!t.deadline && dayjs(t.deadline).isSame(now, 'day');
    // 兼容「不填截止日期」的任务：创建于今天也算今日任务，避免首页不更新
    const isCreatedTodayWithoutDeadline =
      !t.deadline && !!t.createdAt && dayjs(t.createdAt).isSame(now, 'day');
    return isDueToday || isCreatedTodayWithoutDeadline;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  return (
    <div className="space-y-6 text-[#73412d]">
      {/* 统计卡片区域，使用玻璃感卡片与层级化文字 */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[#b58a6a]">
              今日进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3f2a23]">
              {stats.todayCompleted}/{stats.todayTotal}
            </p>
            <p className="mt-1 text-xs text-[#b58a6a]">
              完成率 {stats.todayRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[#b58a6a]">
              已过期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#e25858]">
              {stats.overdueCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[#b58a6a]">
              即将到期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3f2a23]">{stats.dueSoonCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-[#b58a6a]">
              高优先级待办
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3f2a23]">{stats.highPriorityPending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* 快速添加模块，增加圆角和内边距，按钮更显眼 */}
          <Card className="rounded-[28px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#3f2a23]">快速添加</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <QuickAddTask categories={categories} />
            </CardContent>
          </Card>
          <TaskList
            title="今日任务"
            tasks={todayTasks}
            onToggleComplete={toggleComplete}
            onToggleStarred={toggleStarred}
            onEdit={(t) => {
              setEditTask(t);
              setModalOpen(true);
            }}
            onDelete={(t) => setDeleteTarget(t)}
            emptyMessage="今天还没有任务，快去添加吧"
          />
        </div>
        <div className="space-y-4">
          <DailyQuote />
          <TodayGoal />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#3f2a23]">
                近 7 日完成趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrendChart data={stats.last7Days} />
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditTask(null);
        }}
        task={editTask}
      />
      {/* 右下角悬浮按钮：稍微缩小，统一橙色主色 */}
      <Button
        className="fixed bottom-20 right-6 h-11 w-11 rounded-full bg-[rgb(var(--accent))] text-white shadow-[0_18px_40px_rgba(249,99,47,0.6)] lg:bottom-10"
        size="icon"
        onClick={() => {
          setEditTask(null);
          setModalOpen(true);
        }}
        aria-label="新建任务"
      >
        +
      </Button>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        taskTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteTarget && deleteTask(deleteTarget.id)}
      />
    </div>
  );
}
