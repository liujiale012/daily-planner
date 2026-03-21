import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { usePomodoroStore } from '../stores/pomodoroStore';
import { useTaskStore } from '../stores/taskStore';
import { usePomodoroStats } from '../hooks/usePomodoroStats';
import { MinuteWheelPicker } from '../components/pomodoro/MinuteWheelPicker';
import { Input } from '../components/ui/input';
import {
  FOCUS_MODULE_OPTIONS,
  isFocusModuleReady,
  resolveFocusModuleLabel,
} from '../lib/pomodoro-focus-module';
import { getTodayIncompleteTasks, isTaskDueToday } from '../lib/today-tasks-filter';
import { PomodoroFocusOverlay } from '../components/pomodoro/PomodoroFocusOverlay';
import { POMODORO_MOTIVATION_QUOTES } from '../lib/pomodoro-motivation-quotes';
import { resumeWheelAudio } from '../lib/wheelTick';

/** 专注结束时写入会话：今日任务模块则绑定 taskId 与展示标签 */
function getFinishedFocusSessionPayload(): {
  taskId: string | null;
  focusModuleLabel: string | null;
} {
  const pm = usePomodoroStore.getState();
  const tasks = useTaskStore.getState().tasks;
  if (pm.focusModule === 'today_task' && pm.focusTodayTaskId !== 'none') {
    const task = tasks.find((t) => t.id === pm.focusTodayTaskId);
    if (task && !task.completed && isTaskDueToday(task)) {
      return {
        taskId: task.id,
        focusModuleLabel: resolveFocusModuleLabel(
          pm.focusModule,
          pm.focusModuleCustomLabel,
          task.title
        ),
      };
    }
  }
  return {
    taskId: null,
    focusModuleLabel: resolveFocusModuleLabel(pm.focusModule, pm.focusModuleCustomLabel),
  };
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const SECOND_HAND_SOUND_LS = 'daily-planner-pomodoro-second-hand';

/** 与页面展示一致的剩余秒数快照（用于结束遮罩时结算） */
function getSafeSecondsLeftSnapshot(): number {
  const st = usePomodoroStore.getState();
  const safeBaseSeconds =
    (st.mode === 'custom'
      ? (st.customMinutes || 30)
      : st.isBreak
        ? (st.breakMinutes || 5)
        : (st.focusMinutes || 25)) * 60;
  return typeof st.secondsLeft === 'number' && Number.isFinite(st.secondsLeft) && st.secondsLeft >= 0
    ? st.secondsLeft
    : safeBaseSeconds;
}

export function PomodoroPage() {
  const intervalRef = useRef<number | null>(null);
  const segmentBaselineRemainingRef = useRef<number | null>(null);
  const [focusOverlayOpen, setFocusOverlayOpen] = useState(false);
  const [focusOverlayQuote, setFocusOverlayQuote] = useState('');
  const [secondHandSoundEnabled, setSecondHandSoundEnabled] = useState(true);
  const {
    mode,
    focusMinutes,
    breakMinutes,
    customMinutes,
    secondsLeft,
    isRunning,
    isBreak,
    addSession,
    setMode,
    setFocusMinutes,
    setBreakMinutes,
    setCustomMinutes,
    setSecondsLeft,
    setIsRunning,
    setIsBreak,
    focusModule,
    focusModuleCustomLabel,
    focusTodayTaskId,
    setFocusModule,
    setFocusModuleCustomLabel,
    setFocusTodayTaskId,
  } = usePomodoroStore();
  const tasks = useTaskStore((s) => s.tasks);
  const todayIncompleteTasks = useMemo(() => getTodayIncompleteTasks(tasks), [tasks]);
  const stats = usePomodoroStats();

  // 防止历史数据导致 secondsLeft 为 NaN/undefined（必须在下方依赖它的 useEffect 之前声明）
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
    try {
      if (localStorage.getItem(SECOND_HAND_SOUND_LS) === '0') {
        setSecondHandSoundEnabled(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (focusModule !== 'today_task' || focusTodayTaskId === 'none') return;
    const ok = todayIncompleteTasks.some((t) => t.id === focusTodayTaskId);
    if (!ok) setFocusTodayTaskId('none');
  }, [focusModule, focusTodayTaskId, todayIncompleteTasks, setFocusTodayTaskId]);

  /** 本段倒计时开始时的「剩余秒数」，用于结算手动结束时的已专注时长 */
  useEffect(() => {
    if (!isRunning) return;
    if (segmentBaselineRemainingRef.current === null) {
      segmentBaselineRemainingRef.current = safeSecondsLeft;
    }
  }, [isRunning, safeSecondsLeft]);

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
            const { taskId, focusModuleLabel } = getFinishedFocusSessionPayload();
            addSession({
              taskId,
              finishedAt,
              durationMinutes: customMinutes,
              focusModuleLabel,
            });
            if (taskId) useTaskStore.getState().incrementPomodoroCount(taskId);
            setIsRunning(false);
            segmentBaselineRemainingRef.current = null;
            setFocusOverlayOpen(false);
            setFocusOverlayQuote('');
            return 0;
          }

          setIsBreak((b) => {
            if (b) {
              toast.success('休息结束，继续专注吧');
              segmentBaselineRemainingRef.current = null;
              setFocusOverlayOpen(false);
              setFocusOverlayQuote('');
            } else {
              const messages = [
                '专注结束！这段时间很值 👏',
                '做得好，起来伸个懒腰吧～',
                '又向目标迈进了一小步。',
                '专注结束，喝口水再继续。',
              ];
              toast.success(messages[Math.floor(Math.random() * messages.length)]);
              const { taskId, focusModuleLabel } = getFinishedFocusSessionPayload();
              addSession({
                taskId,
                finishedAt,
                durationMinutes: focusMinutes,
                focusModuleLabel,
              });
              if (taskId) useTaskStore.getState().incrementPomodoroCount(taskId);
              segmentBaselineRemainingRef.current = null;
            }
            setFocusOverlayOpen(false);
            setFocusOverlayQuote('');
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
    segmentBaselineRemainingRef.current = null;
    setIsRunning(false);
    setFocusOverlayOpen(false);
    setFocusOverlayQuote('');
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (mode === 'custom') {
      setSecondsLeft(customMinutes * 60);
    } else {
      setSecondsLeft((isBreak ? breakMinutes : focusMinutes) * 60);
    }
  };

  const handleSwitchMode = () => {
    if (mode === 'custom') return;
    segmentBaselineRemainingRef.current = null;
    setIsRunning(false);
    setFocusOverlayOpen(false);
    setFocusOverlayQuote('');
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    setIsBreak((b) => !b);
    setSecondsLeft((!isBreak ? breakMinutes : focusMinutes) * 60);
  };

  const needsModuleToStart =
    mode === 'custom' ? true : !isBreak;

  const isTodayTaskValid =
    focusTodayTaskId !== 'none' &&
    todayIncompleteTasks.some((t) => t.id === focusTodayTaskId);

  const handleToggleRunning = () => {
    if (!isRunning && needsModuleToStart) {
      if (
        !isFocusModuleReady(focusModule, focusModuleCustomLabel, {
          todayTaskId: focusTodayTaskId,
          isTodayTaskValid,
        })
      ) {
        toast.error(
          focusModule === 'today_task'
            ? '请先在下拉框中选择今日任务哦！'
            : '请先选择您要专注的模块哦！'
        );
        return;
      }
    }
    setIsRunning((r) => {
      const next = !r;
      if (next) {
        void resumeWheelAudio();
        setFocusOverlayOpen(true);
        setFocusOverlayQuote((prev) => {
          if (prev) return prev;
          const arr = POMODORO_MOTIVATION_QUOTES;
          return arr[Math.floor(Math.random() * arr.length)] ?? arr[0]!;
        });
      }
      return next;
    });
  };

  const selectedTodayTask =
    focusModule === 'today_task' && focusTodayTaskId !== 'none'
      ? todayIncompleteTasks.find((t) => t.id === focusTodayTaskId)
      : undefined;
  const currentModuleDisplay = selectedTodayTask
    ? resolveFocusModuleLabel('today_task', '', selectedTodayTask.title)
    : resolveFocusModuleLabel(focusModule, focusModuleCustomLabel);

  const moduleLocked = isRunning;

  const toggleSecondHandSound = useCallback(() => {
    setSecondHandSoundEnabled((on) => {
      const next = !on;
      try {
        localStorage.setItem(SECOND_HAND_SOUND_LS, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleOverlayRestartSegment = () => {
    segmentBaselineRemainingRef.current = null;
    if (mode === 'custom') {
      setSecondsLeft((customMinutes || 30) * 60);
    } else {
      setSecondsLeft((isBreak ? breakMinutes : focusMinutes) * 60);
    }
    void resumeWheelAudio();
    setIsRunning(true);
  };

  const handleOverlayEndSession = () => {
    const st = usePomodoroStore.getState();
    const left = getSafeSecondsLeftSnapshot();
    const baseline = segmentBaselineRemainingRef.current;
    let elapsedSec = baseline != null ? baseline - left : 0;
    if (elapsedSec < 0) elapsedSec = 0;

    const isFocusSegment =
      st.mode === 'custom' || (st.mode === 'pomodoro' && !st.isBreak);

    if (isFocusSegment && elapsedSec >= 1) {
      const todayList = getTodayIncompleteTasks(useTaskStore.getState().tasks);
      const todayOk =
        st.focusTodayTaskId !== 'none' &&
        todayList.some((t) => t.id === st.focusTodayTaskId);
      if (
        isFocusModuleReady(st.focusModule, st.focusModuleCustomLabel, {
          todayTaskId: st.focusTodayTaskId,
          isTodayTaskValid: todayOk,
        })
      ) {
        const { taskId, focusModuleLabel } = getFinishedFocusSessionPayload();
        if (focusModuleLabel) {
          const durationMinutes = Math.round((elapsedSec / 60) * 100) / 100;
          st.addSession({
            taskId,
            finishedAt: new Date().toISOString(),
            durationMinutes,
            focusModuleLabel,
          });
          if (taskId) useTaskStore.getState().incrementPomodoroCount(taskId);
          toast.success(`已记录专注 ${durationMinutes} 分钟`);
        }
      }
    }

    handleReset();
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 py-4">
      {focusOverlayOpen ? (
        <PomodoroFocusOverlay
          open={focusOverlayOpen}
          secondsLeft={safeSecondsLeft}
          isBreak={isBreak}
          taskLabel={isBreak ? '休息中' : currentModuleDisplay || '专注'}
          quote={focusOverlayQuote || POMODORO_MOTIVATION_QUOTES[0]!}
          isRunning={isRunning}
          onPause={() => setIsRunning(false)}
          onResume={() => {
            void resumeWheelAudio();
            setIsRunning(true);
          }}
          onRestartSegment={handleOverlayRestartSegment}
          onEndSession={handleOverlayEndSession}
          formatTime={formatTime}
          secondHandSoundEnabled={secondHandSoundEnabled}
          onToggleSecondHandSound={toggleSecondHandSound}
        />
      ) : null}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <Card className="min-w-0">
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
          <CardContent className="flex min-w-0 flex-col items-center gap-6">
            <p className="text-5xl font-mono font-bold tabular-nums text-slate-900">
              {formatTime(safeSecondsLeft)}
            </p>
            <div className="flex gap-2">
              <Button
                size="lg"
                onClick={handleToggleRunning}
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
            <div className="mt-3 flex w-full min-w-0 flex-col items-stretch gap-3">
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                <Button
                  variant={mode === 'pomodoro' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    segmentBaselineRemainingRef.current = null;
                    setFocusOverlayOpen(false);
                    setFocusOverlayQuote('');
                    setMode('pomodoro');
                  }}
                >
                  番茄模式
                </Button>
                <Button
                  variant={mode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    segmentBaselineRemainingRef.current = null;
                    setFocusOverlayOpen(false);
                    setFocusOverlayQuote('');
                    setMode('custom');
                  }}
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
                ) : null}
              </div>
              {mode === 'custom' ? (
                <MinuteWheelPicker
                  orientation="horizontal"
                  min={1}
                  max={120}
                  step={1}
                  value={customMinutes}
                  disabled={isRunning}
                  onChange={(m) => setCustomMinutes(m)}
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">专注模块</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_MODULE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    type="button"
                    size="sm"
                    variant={focusModule === opt.id ? 'default' : 'outline'}
                    disabled={moduleLocked}
                    className="rounded-full px-3 text-xs"
                    onClick={() => setFocusModule(opt.id)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {focusModule === 'custom' && (
                <Input
                  placeholder="填写自定义模块名称"
                  value={focusModuleCustomLabel}
                  onChange={(e) => setFocusModuleCustomLabel(e.target.value)}
                  disabled={moduleLocked}
                  className="mt-2 text-sm"
                />
              )}
              {focusModule === 'today_task' && (
                <div className="mt-2 space-y-1">
                  <Select
                    className="w-full text-sm"
                    value={focusTodayTaskId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setFocusTodayTaskId(v === 'none' ? 'none' : v);
                    }}
                    disabled={moduleLocked}
                    options={[
                      { value: 'none', label: '请选择今日未完成任务' },
                      ...todayIncompleteTasks.map((t) => ({
                        value: t.id,
                        label: (t.title?.trim() || '(无标题)').slice(0, 80),
                      })),
                    ]}
                  />
                  {todayIncompleteTasks.length === 0 && (
                    <p className="text-[11px] text-[#c9a985]">
                      今日暂无可选任务。与首页「今日任务」一致：截止日为今天，或今日创建且无截止日。
                    </p>
                  )}
                </div>
              )}
              {currentModuleDisplay && (
                <p className="mt-2 text-[11px] text-[#c9a985]">当前：{currentModuleDisplay}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">番茄统计</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
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
          </div>
          {stats.todayModuleBreakdown.length > 0 && (
            <div className="border-t border-[#f5e7d0]/90 pt-4 dark:border-slate-700/80">
              <p className="mb-2 text-xs font-medium text-[#b58a6a]">今日各模块已专注</p>
              <p className="mb-2 text-[11px] text-[#c9a985]">
                仅统计今日已完成且选择了模块的专注；同一模块多次完成会累加时长。
              </p>
              <ul className="space-y-2">
                {stats.todayModuleBreakdown.map(({ label, minutes }) => (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#fffaf5]/90 px-3 py-2 text-[#73412d] dark:bg-slate-800/50 dark:text-slate-200"
                  >
                    <span className="truncate font-medium">{label}</span>
                    <span className="shrink-0 tabular-nums text-base font-semibold text-[#3f2a23] dark:text-slate-100">
                      {minutes} 分钟
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
