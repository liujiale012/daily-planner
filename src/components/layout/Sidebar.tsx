import { NavLink } from 'react-router-dom';
import { Calendar, CheckSquare, Home, Settings, Timer, MessageCircle } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: '首页', icon: Home },
  { to: '/tasks', label: '任务', icon: CheckSquare },
  { to: '/calendar', label: '日历', icon: Calendar },
  { to: '/pomodoro', label: '番茄钟', icon: Timer },
  { to: '/treehole', label: '情绪树洞', icon: MessageCircle },
  { to: '/settings', label: '设置', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 flex-shrink-0 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-800 lg:flex">
      <div className="flex h-full flex-col">
        <div className="px-5 py-4">
          <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            Daily Planner
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
