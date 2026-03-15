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
  const todayTasks = tasks.filter(
    (t) => t.deadline && dayjs(t.deadline).isSame(dayjs(), 'day')
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              今日进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.todayCompleted}/{stats.todayTotal}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              完成率 {stats.todayRate}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              已过期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.overdueCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              即将到期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.dueSoonCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              高优先级待办
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.highPriorityPending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>快速添加</CardTitle>
            </CardHeader>
            <CardContent>
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
            <CardHeader>
              <CardTitle>近 7 日完成趋势</CardTitle>
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
      <Button
        className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg lg:bottom-8"
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
