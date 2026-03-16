import dayjs from 'dayjs';
import { Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { useSettingsStore } from '../../stores/settingsStore';

const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function Header() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const now = dayjs();
  const location = useLocation();

  // 在情绪树洞页面隐藏顶部日期标题区域
  const isTreehole = location.pathname.startsWith('/treehole');
  if (isTreehole) {
    return null;
  }

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-2xl font-semibold text-slate-900">
          {now.format('YYYY年M月D日')} {weekdays[now.day()]}
        </p>
        <p className="mt-1 text-sm text-slate-400">今天也把事情安排清楚吧</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="切换主题"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </header>
  );
}
