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
    <aside className="hidden h-screen w-64 flex-shrink-0 bg-transparent lg:flex">
      <div className="flex h-full flex-col">
        <div className="px-6 py-6">
          <span className="text-xl font-semibold tracking-tight text-pink-500">
            Daily Planner
          </span>
        </div>
        <nav className="flex-1 space-y-2 px-4 pb-6">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/80 text-pink-500 shadow-[0_12px_30px_rgba(244,114,182,0.35)]'
                    : 'text-slate-500 hover:bg-white/60 hover:text-pink-500'
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
