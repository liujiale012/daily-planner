/** 勾选完成任务时的随机正向反馈（微成就感） */
export const TASK_COMPLETE_TOASTS = [
  '又划掉一项，真利落 ✓',
  '小胜利也是胜利，记一笔！',
  '完成一件，桌面就轻一点～',
  '这一步走得很稳 👍',
  '今日进度 +1，继续保持节奏',
  '做得好，给自己点个赞',
  '清单在变薄，你在变强',
];

export function randomTaskCompleteToast(): string {
  const i = Math.floor(Math.random() * TASK_COMPLETE_TOASTS.length);
  return TASK_COMPLETE_TOASTS[i] ?? TASK_COMPLETE_TOASTS[0]!;
}
