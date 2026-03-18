import { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { useTaskStore } from '../stores/taskStore';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { usePomodoroStats } from '../hooks/usePomodoroStats';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PomodoroPage() {
  const intervalRef = useRef<number | null>(null);
  const {
    mode,
    focusMinutes,
    breakMinutes,
    customMinutes,
    secondsLeft,
    isRunning,
    isBreak,
    currentTaskId,
    addSession,
    setMode,
    setFocusMinutes,
    setBreakMinutes,
    setCustomMinutes,
    setSecondsLeft,
    setIsRunning,
    setIsBreak,
    setCurrentTaskId,
  } = usePomodoroStore();
  const tasks = useTaskStore((s) => s.tasks.filter((t) => !t.completed));
  const incrementPomodoroCount = useTaskStore((s) => s.incrementPomodoroCount);
  const stats = usePomodoroStats();

  const currentTask = tasks.find((t) => t.id === currentTaskId);

  // 防止历史数据导致 secondsLeft 为 NaN/undefined
  const safeBaseSeconds =
    (mode === 'custom'
      ? (customMinutes || 30)
      : isBreak
        ? (breakMinutes || 5)
        : (focusMinutes || 25)) * 60;
  const safeSecondsLeft =
    typeof secondsLeft === 'number' && Number.isFinite(secondsLeft) && secondsLeft >= 0
      ? secondsLeft
      : safeBaseSeconds;

  useEffect(() => {
    if (safeSecondsLeft !== secondsLeft) {
      setSecondsLeft(safeSecondsLeft);
    }
    // 仅在 secondsLeft 异常时修正
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeSecondsLeft]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          const finishedAt = new Date().toISOString();
          if (mode === 'custom') {
            const messages = [
              '计时结束，做得很好 👏',
              '时间到，可以稍微歇一歇啦～',
              '这一段专注已经完成，给自己点奖励。',
            ];
            toast.success(messages[Math.floor(Math.random() * messages.length)]);
            const taskId = currentTaskId === 'none' ? null : currentTaskId;
            if (taskId) {
              incrementPomodoroCount(taskId);
            }
            addSession({ taskId, finishedAt, durationMinutes: customMinutes });
            setIsRunning(false);
            return 0;
          }

          setIsBreak((b) => {
            if (b) {
              toast.success('休息结束，继续专注吧');
            } else {
              const messages = [
                '专注结束！这段时间很值 👏',
                '做得好，起来伸个懒腰吧～',
                '又向目标迈进了一小步。',
                '专注结束，喝口水再继续。',
              ];
              toast.success(messages[Math.floor(Math.random() * messages.length)]);
              const taskId = currentTaskId === 'none' ? null : currentTaskId;
              if (taskId) {
                incrementPomodoroCount(taskId);
              }
              addSession({ taskId, finishedAt, durationMinutes: focusMinutes });
            }
            return !b;
          });
          return !isBreak ? breakMinutes * 60 : focusMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isRunning, isBreak]);

  const handleReset = () => {
    setIsRunning(false);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (mode === 'custom') {
      setSecondsLeft(customMinutes * 60);
    } else {
      setSecondsLeft((isBreak ? breakMinutes : focusMinutes) * 60);
    }
  };

  const handleSwitchMode = () => {
    if (mode === 'custom') return;
    setIsRunning(false);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setIsBreak((b) => !b);
    setSecondsLeft((!isBreak ? breakMinutes : focusMinutes) * 60);
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{isBreak ? '休息时间' : '专注时间'}</span>
              <span className="text-xs font-normal text-slate-400">
                {mode === 'custom'
                  ? `自由计时 ${customMinutes} 分钟`
                  : isBreak
                    ? `好好放松 ${breakMinutes} 分钟`
                    : `专注 ${focusMinutes} 分钟`}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <p className="text-5xl font-mono font-bold tabular-nums text-slate-900">
              {formatTime(safeSecondsLeft)}
            </p>
            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={() => setIsRunning((r) => !r)}
                aria-label={isRunning ? '暂停' : '开始'}
              >
                {isRunning ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button variant="outline" size="lg" onClick={handleReset} aria-label="重置">
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="lg" onClick={handleSwitchMode}>
                {mode === 'custom' ? '仅计时' : isBreak ? '切回专注' : '休息一下'}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
              <Button
                variant={mode === 'pomodoro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('pomodoro')}
              >
                番茄模式
              </Button>
              <Button
                variant={mode === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('custom')}
              >
                自由计时
              </Button>
              {mode === 'pomodoro' ? (
                <>
                  <span>专注时长</span>
                  <Select
                    className="w-[80px]"
                    value={String(focusMinutes)}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 25;
                      setFocusMinutes(v);
                    }}
                    options={[
                      { value: '25', label: '25 分钟' },
                      { value: '45', label: '45 分钟' },
                      { value: '60', label: '60 分钟' },
                    ]}
                  />
                  <span>休息时长</span>
                  <Select
                    className="w-[80px]"
                    value={String(breakMinutes)}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 5;
                      setBreakMinutes(v);
                    }}
                    options={[
                      { value: '5', label: '5 分钟' },
                      { value: '10', label: '10 分钟' },
                      { value: '15', label: '15 分钟' },
                    ]}
                  />
                </>
              ) : (
                <>
                  <span>计时时长</span>
                  <Select
                    className="w-[80px]"
                    value={String(customMinutes)}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 30;
                      setCustomMinutes(v);
                    }}
                    options={[
                      { value: '10', label: '10 分钟' },
                      { value: '20', label: '20 分钟' },
                      { value: '30', label: '30 分钟' },
                      { value: '45', label: '45 分钟' },
                    ]}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">当前专注任务</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              options={[
                { value: 'none', label: '不绑定任务，仅计时' },
                ...tasks.map((t) => ({ value: t.id, label: t.title })),
              ]}
              value={currentTaskId}
              onChange={(e) => setCurrentTaskId(e.target.value as string | 'none')}
            />
            {currentTask && (
              <div className="rounded-2xl bg-pink-50/80 px-3 py-2 text-xs text-pink-700">
                <p className="truncate font-medium">{currentTask.title}</p>
                <p className="mt-0.5 text-[11px] opacity-80">
                  分类：{currentTask.category} · 已为 Ta 专注 {currentTask.pomodoroCount ?? 0} 轮
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">番茄统计</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400">今日已完成</p>
            <p className="mt-1 text-lg font-semibold">
              {stats.todayCount} 轮 · {stats.todayMinutes} 分钟
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">本周累计</p>
            <p className="mt-1 text-lg font-semibold">
              {stats.weekCount} 轮 · {stats.weekMinutes} 分钟
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
