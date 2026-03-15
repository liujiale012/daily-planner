import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

export function TodayGoal() {
  const todayGoal = useSettingsStore((s) => s.todayGoal);
  const setTodayGoal = useSettingsStore((s) => s.setTodayGoal);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(todayGoal);

  useEffect(() => {
    setValue(todayGoal);
  }, [todayGoal]);

  const handleSave = () => {
    setTodayGoal(value.trim());
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 dark:border-amber-900/30 dark:bg-amber-950/20">
      <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
        <Target className="h-4 w-4 shrink-0" aria-hidden />
        <span>今日目标</span>
      </p>
      {editing ? (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="今天我想..."
            className="flex-1 rounded-md border border-amber-200 bg-white px-3 py-1.5 text-sm placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-amber-800 dark:bg-gray-800 dark:placeholder:text-amber-600"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"
          >
            保存
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 block w-full text-left text-sm text-amber-700 dark:text-amber-300"
        >
          {todayGoal ? (
            <span className="italic">「{todayGoal}」</span>
          ) : (
            <span className="text-amber-500 dark:text-amber-500">
              点击写下今天最想完成的一件事...
            </span>
          )}
        </button>
      )}
    </div>
  );
}
