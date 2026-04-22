import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useSettingsStore } from '../stores/settingsStore';
import type { AccentColor } from '../types';
import { DEFAULT_CATEGORIES } from '../types';
import { useRef } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { toast } from 'sonner';

const ACCENT_OPTIONS: { value: AccentColor; label: string; class: string }[] = [
  { value: 'indigo', label: '靛蓝', class: 'bg-indigo-500' },
  { value: 'emerald', label: '翠绿', class: 'bg-emerald-500' },
  { value: 'violet', label: '紫色', class: 'bg-violet-500' },
  { value: 'rose', label: '玫瑰', class: 'bg-rose-500' },
];

export function SettingsPage() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const accentColor = useSettingsStore((s) => s.accentColor);
  const setAccentColor = useSettingsStore((s) => s.setAccentColor);
  const replaceState = useTaskStore((s) => s.replaceState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const { tasks, categories } = useTaskStore.getState();
    const blob = new Blob(
      [JSON.stringify({ tasks, categories, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('已导出备份');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const tasks = Array.isArray(data.tasks) ? data.tasks : [];
        const categories = Array.isArray(data.categories) ? data.categories : DEFAULT_CATEGORIES;
        replaceState(tasks, categories);
        toast.success('已恢复备份');
      } catch {
        toast.error('备份文件格式无效');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>外观</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium">主题</p>
              <div className="flex flex-wrap gap-2">
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme(t)}
                  >
                    {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">强调色</p>
              <div className="flex flex-wrap gap-2">
                {ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccentColor(opt.value)}
                    className={`h-8 w-8 rounded-full ${opt.class} ring-2 ring-offset-2 ${
                      accentColor === opt.value ? 'ring-gray-900 dark:ring-white' : 'ring-transparent'
                    }`}
                    aria-label={opt.label}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本地数据</CardTitle>
            <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
              导出为 JSON 备份，或从备份文件恢复。恢复将覆盖当前数据。
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              导出备份
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              从备份恢复
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
