import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { MOOD_OPTIONS, useMoodStore, type MoodKey } from '../stores/moodStore';
import { cn } from '../lib/utils';

function dateKeyFromInput(value: string): string {
  return value || dayjs().format('YYYY-MM-DD');
}

export function MoodPage() {
  const byDate = useMoodStore((s) => s.byDate);
  const setDayMood = useMoodStore((s) => s.setDayMood);
  const removeDayMood = useMoodStore((s) => s.removeDayMood);

  const todayKey = dayjs().format('YYYY-MM-DD');
  const [pickDate, setPickDate] = useState(todayKey);
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [note, setNote] = useState('');

  const entryForPick = byDate[pickDate];

  const recentRows = useMemo(() => {
    return Object.entries(byDate)
      .map(([dateKey, v]) => ({ dateKey, ...v }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
      .slice(0, 42);
  }, [byDate]);

  const loadDayIntoForm = (dateKey: string) => {
    setPickDate(dateKey);
    const e = byDate[dateKey];
    if (e) {
      setSelectedMood(e.mood);
      setNote(e.note);
    } else {
      setSelectedMood(null);
      setNote('');
    }
  };

  const handleSave = () => {
    if (!selectedMood) return;
    const key = dateKeyFromInput(pickDate);
    setDayMood(key, selectedMood, note);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-4">
      <Card className="border-[#f5e7d0]/90 bg-[#fffaf7]/80 dark:border-slate-700 dark:bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800 dark:text-slate-100">记录今天的心情</CardTitle>
          <p className="text-sm font-normal text-[#b58a6a] dark:text-slate-400">
            选一天、点选心情，可加一句备注。数据只保存在本机浏览器。
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span>日期</span>
              <Input
                type="date"
                value={pickDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setPickDate(v);
                  const ex = byDate[v];
                  if (ex) {
                    setSelectedMood(ex.mood);
                    setNote(ex.note);
                  } else {
                    setSelectedMood(null);
                    setNote('');
                  }
                }}
                className="w-[200px] rounded-xl border-[#f5e7d0] bg-white/90 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-300 dark:hover:bg-pink-950/40"
              onClick={() => loadDayIntoForm(todayKey)}
            >
              跳到今日
            </Button>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">此刻心情</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MOOD_OPTIONS.map((opt) => {
                const active = selectedMood === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedMood(opt.key)}
                    className={cn(
                      'flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-3 text-left transition-all',
                      active
                        ? 'border-pink-400 bg-pink-50 shadow-[0_8px_24px_rgba(244,114,182,0.25)] dark:border-pink-500 dark:bg-pink-950/50'
                        : 'border-[#f5e7d0] bg-white/70 hover:border-pink-200 hover:bg-pink-50/40 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-pink-800'
                    )}
                  >
                    <span className="text-xl leading-none" aria-hidden>
                      {opt.emoji}
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{opt.label}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>备注（可选）</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="写一句给自己看的话…"
              className="resize-none rounded-2xl border border-[#f5e7d0] bg-white/90 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 shadow-md shadow-pink-300/30 hover:from-pink-600 hover:to-rose-600 dark:shadow-pink-900/20"
              disabled={!selectedMood}
              onClick={handleSave}
            >
              保存这条心情
            </Button>
            {entryForPick ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
                onClick={() => {
                  removeDayMood(pickDate);
                  setSelectedMood(null);
                  setNote('');
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                删除该日记录
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">最近记录</CardTitle>
          <p className="text-xs font-normal text-slate-400">点击一行可载入到上方编辑</p>
        </CardHeader>
        <CardContent>
          {recentRows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#f5e7d0] bg-[#fff7ee] py-10 text-center text-sm text-[#b58a6a] dark:border-slate-600 dark:bg-slate-800/30 dark:text-slate-400">
              还没有记录，先从上面选个心情吧～
            </p>
          ) : (
            <ul className="space-y-2">
              {recentRows.map((row) => {
                const meta = MOOD_OPTIONS.find((o) => o.key === row.mood);
                return (
                  <li key={row.dateKey}>
                    <button
                      type="button"
                      onClick={() => loadDayIntoForm(row.dateKey)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-[#f5e7d0] bg-white/80 px-4 py-3 text-left transition hover:border-pink-200 hover:bg-pink-50/30 dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-pink-800"
                    >
                      <span className="text-2xl leading-none">{meta?.emoji ?? '·'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {dayjs(row.dateKey).format('YYYY年M月D日')}
                          <span className="ml-2 text-pink-500 dark:text-pink-400">{meta?.label}</span>
                        </p>
                        {row.note ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                            {row.note}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
