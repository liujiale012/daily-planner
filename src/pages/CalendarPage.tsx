import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CalendarMonthView } from '../components/calendar/CalendarMonthView';
import { DayTaskPanel } from '../components/calendar/DayTaskPanel';
import { TaskModal } from '../components/tasks/TaskModal';
import { DeleteConfirmDialog } from '../components/tasks/DeleteConfirmDialog';
import { useTaskStore } from '../stores/taskStore';
import type { Task } from '../types';

export function CalendarPage() {
  const [current, setCurrent] = useState<Dayjs>(dayjs());
  const [selectedDay, setSelectedDay] = useState<Dayjs | null>(null);
  const { toggleComplete, toggleStarred, deleteTask } = useTaskStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrent((c) => c.subtract(1, 'month'))}
            aria-label="上个月"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-lg font-semibold">
            {current.format('YYYY年M月')}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrent((c) => c.add(1, 'month'))}
            aria-label="下个月"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => { setEditTask(null); setModalOpen(true); }}>
          新建任务
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CalendarMonthView
            current={current}
            onSelectDay={(day) => setSelectedDay(day)}
            selectedDay={selectedDay}
          />
        </div>
        <DayTaskPanel
          day={selectedDay}
          onToggleComplete={toggleComplete}
          onToggleStarred={toggleStarred}
          onEdit={(t) => { setEditTask(t); setModalOpen(true); }}
          onDelete={(t) => setDeleteTarget(t)}
        />
      </div>

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
