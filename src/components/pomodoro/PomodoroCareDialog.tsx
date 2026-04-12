import { Wind, Heart, Coffee } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

const TIPS = [
  { icon: Wind, text: '慢慢吸气 4 秒，屏息 2 秒，再缓缓呼气 6 秒，重复 3 次。' },
  { icon: Coffee, text: '起来接一杯水，看看远处，让眼睛和肩颈都松一松。' },
  { icon: Heart, text: '高强度投入很了不起，但身体也需要被照顾——现在值得停一小会儿。' },
];

type Props = {
  open: boolean;
  onAcknowledge: () => void;
};

export function PomodoroCareDialog({ open, onAcknowledge }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="care-dialog-title"
        className={cn(
          'relative z-[61] w-full max-w-md overflow-hidden rounded-3xl border border-rose-100/90',
          'animate-care-dialog-in bg-gradient-to-br from-rose-50 via-white to-amber-50/90 shadow-[0_24px_64px_rgba(244,114,182,0.35)]',
          'dark:border-rose-900/40 dark:from-rose-950/90 dark:via-slate-900 dark:to-amber-950/40'
        )}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-200/40 blur-2xl dark:bg-rose-500/20" />
        <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-amber-200/50 blur-2xl dark:bg-amber-600/15" />
        <div className="relative px-6 pb-6 pt-7">
          <p className="text-xs font-medium uppercase tracking-widest text-rose-400 dark:text-rose-300">
            来自番茄钟的小督导
          </p>
          <h2
            id="care-dialog-title"
            className="mt-2 text-xl font-semibold leading-snug text-slate-800 dark:text-slate-100"
          >
            你已经连续专注很久了
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            三小时是一段非常扎实的投入。为了不透支自己，请你现在给自己一个真正的间隙——这不是偷懒，而是可持续的节奏。
          </p>
          <ul className="mt-5 space-y-3">
            {TIPS.map(({ icon: Icon, text }, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl bg-white/70 px-3 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-800/60 dark:text-slate-200"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-900/40 dark:text-rose-300">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            size="lg"
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-300/40 transition hover:from-rose-600 hover:to-pink-600 dark:shadow-rose-900/30"
            onClick={onAcknowledge}
          >
            我知道了，我会休息一下
          </Button>
          <p className="mt-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
            计时已暂停，准备好时再按「继续」即可。
          </p>
        </div>
      </div>
    </div>
  );
}
