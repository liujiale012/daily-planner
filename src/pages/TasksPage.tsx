import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { TaskList } from '../components/tasks/TaskList';
import { TaskModal } from '../components/tasks/TaskModal';
import { DeleteConfirmDialog } from '../components/tasks/DeleteConfirmDialog';
import { Button } from '../components/ui/button';
import { useTaskStore } from '../stores/taskStore';
import {
  useFilteredTasks,
  type StatusFilter,
  type TimeFilter,
  type SortKey,
} from '../hooks/useFilteredTasks';
import type { Task, Priority } from '../types';

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'incomplete', label: '未完成' },
  { value: 'completed', label: '已完成' },
  { value: 'overdue', label: '已过期' },
];

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'default', label: '默认' },
  { value: 'created', label: '创建时间' },
  { value: 'deadline', label: '截止时间' },
  { value: 'priority', label: '优先级' },
  { value: 'starred', label: '星标' },
  { value: 'completed', label: '完成状态' },
];

export function TasksPage() {
  const { categories, toggleComplete, toggleStarred, deleteTask } = useTaskStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('incomplete');
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [category, setCategory] = useState('all');
  const [timeRange, setTimeRange] = useState<TimeFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const filtered = useFilteredTasks(search, status, priority, category, timeRange, sortBy);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索任务..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-[120px]"
            />
            <Select
              options={[
                { value: 'all', label: '全部优先级' },
                { value: 'high', label: '高' },
                { value: 'medium', label: '中' },
                { value: 'low', label: '低' },
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | 'all')}
              className="w-[120px]"
            />
            <Select
              options={[
                { value: 'all', label: '全部分类' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-[120px]"
            />
            <Select
              options={timeOptions}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeFilter)}
              className="w-[120px]"
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-[120px]"
            />
            <Button onClick={() => { setEditTask(null); setModalOpen(true); }}>
              新建任务
            </Button>
          </div>
        </CardContent>
      </Card>

      <TaskList
        tasks={filtered}
        onToggleComplete={toggleComplete}
        onToggleStarred={toggleStarred}
        onEdit={(t) => { setEditTask(t); setModalOpen(true); }}
        onDelete={(t) => setDeleteTarget(t)}
        emptyMessage="没有匹配的任务"
      />

      <TaskModal
        open={modalOpen}
        onOpenChange={(o) => { setModalOpen(o); if (!o) setEditTask(null); }}
        task={editTask}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        taskTitle={deleteTarget?.title ?? ''}
        onConfirm={() => deleteTarget && deleteTask(deleteTarget.id)}
      />
    </div>
  );
}
