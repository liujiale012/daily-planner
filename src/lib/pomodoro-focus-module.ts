import type { FocusModuleId } from '../stores/pomodoroStore';

export const FOCUS_MODULE_OPTIONS: { id: Exclude<FocusModuleId, 'none'>; label: string }[] = [
  { id: 'study', label: '学习' },
  { id: 'sport', label: '运动' },
  { id: 'research', label: '科研' },
  { id: 'work', label: '工作' },
  { id: 'today_task', label: '今日任务' },
  { id: 'custom', label: '自定义' },
];

export function resolveFocusModuleLabel(
  focusModule: FocusModuleId,
  customLabel: string,
  /** 选择「今日任务」时传入任务标题 */
  todayTaskTitle?: string | null
): string | null {
  if (focusModule === 'none') return null;
  if (focusModule === 'today_task') {
    const t = todayTaskTitle?.trim();
    return t && t.length > 0 ? `今日任务·${t}` : null;
  }
  if (focusModule === 'custom') {
    const t = customLabel.trim();
    return t.length > 0 ? t : null;
  }
  const o = FOCUS_MODULE_OPTIONS.find((x) => x.id === focusModule);
  return o?.label ?? null;
}

export type FocusModuleReadyContext = {
  todayTaskId: string | 'none';
  isTodayTaskValid: boolean;
};

export function isFocusModuleReady(
  focusModule: FocusModuleId,
  customLabel: string,
  ctx?: FocusModuleReadyContext
): boolean {
  if (focusModule === 'today_task') {
    return ctx?.todayTaskId !== 'none' && ctx?.isTodayTaskValid === true;
  }
  return resolveFocusModuleLabel(focusModule, customLabel) !== null;
}
