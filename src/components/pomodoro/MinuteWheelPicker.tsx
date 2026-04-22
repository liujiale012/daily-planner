import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { playWheelTick, resumeWheelAudio } from '../../lib/wheelTick';

const ITEM = 44;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM;

type Props = {
  /** 当前选中的分钟数 */
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  className?: string;
  /** 横向：左右滑动；纵向：上下滑动 */
  orientation?: 'horizontal' | 'vertical';
};

function buildValues(min: number, max: number, step: number) {
  const out: number[] = [];
  for (let v = min; v <= max; v += step) out.push(v);
  return out;
}

export function MinuteWheelPicker({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
  className,
  orientation = 'vertical',
}: Props) {
  const values = buildValues(min, max, step);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 与当前滚动位置对齐的刻度索引，用于“过一格响一下” */
  const lastSnapIndexRef = useRef(-1);
  const isH = orientation === 'horizontal';

  const indexOf = useCallback(
    (m: number) => {
      const i = values.indexOf(m);
      if (i >= 0) return i;
      const clamped = Math.min(max, Math.max(min, m));
      let best = 0;
      let bestDiff = Infinity;
      values.forEach((v, idx) => {
        const d = Math.abs(v - clamped);
        if (d < bestDiff) {
          bestDiff = d;
          best = idx;
        }
      });
      return best;
    },
    [max, min, values]
  );

  const scrollToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = 'auto') => {
      const el = containerRef.current;
      if (!el) return;
      const i = Math.max(0, Math.min(values.length - 1, idx));
      if (isH) {
        el.scrollTo({ left: i * ITEM, behavior });
      } else {
        el.scrollTo({ top: i * ITEM, behavior });
      }
    },
    [isH, values.length]
  );

  useLayoutEffect(() => {
    if (scrollingRef.current) return;
    const idx = indexOf(value);
    scrollToIndex(idx, 'auto');
    lastSnapIndexRef.current = idx;
  }, [value, indexOf, scrollToIndex]);

  useEffect(
    () => () => {
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    },
    []
  );

  const commitScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || disabled) return;
    const pos = isH ? el.scrollLeft : el.scrollTop;
    const idx = Math.round(pos / ITEM);
    const clampedIdx = Math.max(0, Math.min(values.length - 1, idx));
    const next = values[clampedIdx];
    lastSnapIndexRef.current = clampedIdx;
    if (next !== value) onChange(next);
    scrollToIndex(clampedIdx, 'smooth');
  }, [disabled, isH, onChange, scrollToIndex, value, values]);

  const handleScroll = () => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;

    const pos = isH ? el.scrollLeft : el.scrollTop;
    const idx = Math.round(pos / ITEM);
    const clampedIdx = Math.max(0, Math.min(values.length - 1, idx));
    if (clampedIdx !== lastSnapIndexRef.current) {
      lastSnapIndexRef.current = clampedIdx;
      playWheelTick(isH ? 920 : 840);
    }

    scrollingRef.current = true;
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      scrollingRef.current = false;
      commitScroll();
    }, 120);
  };

  const handlePointerDown = () => {
    if (disabled) return;
    void resumeWheelAudio();
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isH || disabled) return;
    const onWheelNative = (e: WheelEvent) => {
      const absY = Math.abs(e.deltaY);
      const absX = Math.abs(e.deltaX);
      if (absY <= absX) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, [isH, disabled]);

  return (
    <div
      className={cn(
        'relative min-w-0 rounded-2xl border border-[#f5e7d0]/90 bg-[#fffaf5]/95 shadow-inner dark:border-slate-700 dark:bg-slate-900/60',
        isH ? 'mx-auto w-full max-w-md' : 'flex flex-col items-center',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      title={disabled ? '计时中请先暂停再调整时长' : undefined}
    >
      {isH ? (
        <div
          className="pointer-events-none absolute bottom-2 top-2 z-[1] rounded-xl border border-[rgb(var(--accent))]/25 bg-[rgb(var(--accent))]/5"
          style={{ left: '50%', width: ITEM, transform: 'translateX(-50%)' }}
        />
      ) : (
        <div
          className="pointer-events-none absolute left-2 right-2 z-[1] rounded-xl border border-[rgb(var(--accent))]/25 bg-[rgb(var(--accent))]/5"
          style={{ top: '50%', height: ITEM, transform: 'translateY(-50%)' }}
        />
      )}
      <div
        ref={containerRef}
        role="listbox"
        aria-label="选择计时时长（分钟）"
        tabIndex={disabled ? -1 : 0}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        className={cn(
          'no-scrollbar min-w-0 overscroll-contain',
          isH
            ? 'flex w-full max-w-full flex-nowrap flex-row overflow-x-auto overflow-y-hidden touch-pan-x'
            : 'w-full max-w-[120px] overflow-y-auto overflow-x-hidden touch-pan-y'
        )}
        style={
          isH
            ? {
                height: ITEM + 16,
                scrollSnapType: 'x mandatory',
                paddingLeft: PAD,
                paddingRight: PAD,
                WebkitOverflowScrolling: 'touch',
              }
            : {
                height: VISIBLE * ITEM,
                scrollSnapType: 'y mandatory',
                paddingTop: PAD,
                paddingBottom: PAD,
                WebkitOverflowScrolling: 'touch',
              }
        }
      >
        {values.map((m) => (
          <button
            key={m}
            type="button"
            role="option"
            aria-selected={m === value}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              void resumeWheelAudio();
              const idx = values.indexOf(m);
              scrollToIndex(idx, 'smooth');
              lastSnapIndexRef.current = idx;
              playWheelTick(780);
              onChange(m);
            }}
            className={cn(
              'flex shrink-0 items-center justify-center text-sm font-medium transition-colors',
              isH ? 'min-w-[44px]' : 'w-full',
              m === value
                ? 'text-[#3f2a23] dark:text-slate-100'
                : 'text-[#b58a6a]/80 dark:text-slate-400'
            )}
            style={
              isH
                ? {
                    width: ITEM,
                    height: ITEM,
                    scrollSnapAlign: 'center',
                  }
                : {
                    height: ITEM,
                    scrollSnapAlign: 'center',
                  }
            }
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
