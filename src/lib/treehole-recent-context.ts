import { usePomodoroStore } from '../stores/pomodoroStore';
import { useTaskStore } from '../stores/taskStore';

const DEFAULT_WINDOW_MINUTES = 30;

type RecentContextCandidate = {
  endedAtMs: number;
  text: string;
};

function toMs(iso?: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function formatAgoMinutes(diffMs: number): string {
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  return `${minutes} 分钟前`;
}

function buildPomodoroCandidate(nowMs: number, windowMs: number): RecentContextCandidate | null {
  const { sessions } = usePomodoroStore.getState();
  if (!Array.isArray(sessions) || sessions.length === 0) return null;

  const tasks = useTaskStore.getState().tasks;
  let latest: RecentContextCandidate | null = null;

  for (const s of sessions) {
    const endedAtMs = toMs(s.finishedAt);
    if (endedAtMs == null) continue;
    const diff = nowMs - endedAtMs;
    if (diff < 0 || diff > windowMs) continue;

    const taskTitle =
      s.taskId && s.taskId !== 'none' ? tasks.find((t) => t.id === s.taskId)?.title?.trim() : '';
    const moduleLabel = s.focusModuleLabel?.trim();
    const duration = Math.max(1, Math.floor(Number(s.durationMinutes) || 0));
    const focusLabel = taskTitle || moduleLabel || '一次专注';
    const text = `用户在 ${formatAgoMinutes(diff)} 刚完成了「${focusLabel}」专注，时长约 ${duration} 分钟。`;

    if (!latest || endedAtMs > latest.endedAtMs) {
      latest = { endedAtMs, text };
    }
  }

  return latest;
}

function buildTaskCandidate(nowMs: number, windowMs: number): RecentContextCandidate | null {
  const { tasks } = useTaskStore.getState();
  if (!Array.isArray(tasks) || tasks.length === 0) return null;

  let latest: RecentContextCandidate | null = null;
  for (const t of tasks) {
    if (!t.completed) continue;
    const endedAtMs = toMs(t.completedAt);
    if (endedAtMs == null) continue;
    const diff = nowMs - endedAtMs;
    if (diff < 0 || diff > windowMs) continue;

    const title = t.title?.trim() || '一个任务';
    const text = `用户在 ${formatAgoMinutes(diff)} 刚完成了任务「${title}」。`;
    if (!latest || endedAtMs > latest.endedAtMs) {
      latest = { endedAtMs, text };
    }
  }

  return latest;
}

export function getTreeholeRecentContext(windowMinutes = DEFAULT_WINDOW_MINUTES): string {
  const nowMs = Date.now();
  const windowMs = Math.max(1, windowMinutes) * 60 * 1000;

  const pomodoroCandidate = buildPomodoroCandidate(nowMs, windowMs);
  const taskCandidate = buildTaskCandidate(nowMs, windowMs);

  const winner =
    !taskCandidate || (pomodoroCandidate && pomodoroCandidate.endedAtMs >= taskCandidate.endedAtMs)
      ? pomodoroCandidate
      : taskCandidate;

  if (!winner) return '';

  return [
    '【最近 30 分钟上下文（仅供你共情时参考，不要生硬复述）】',
    winner.text,
    '请优先做温柔共情，可用“如果刚刚那段专注让你有点累”这类不武断表达；若用户话题明显无关，请以用户当下表达为主。',
  ].join('\n');
}
