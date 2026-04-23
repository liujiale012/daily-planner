import { NavLink } from 'react-router-dom';
import { Calendar, CheckSquare, Home, Settings, Timer, MessageCircle, Smile } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: '首页', icon: Home },
  { to: '/tasks', label: '任务', icon: CheckSquare },
  { to: '/calendar', label: '日历', icon: Calendar },
  { to: '/mood', label: '心情', icon: Smile },
  { to: '/pomodoro', label: '番茄', icon: Timer },
  { to: '/treehole', label: '树洞', icon: MessageCircle },
  { to: '/settings', label: '设置', icon: Settings },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 lg:hidden">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
              isActive ? 'text-[rgb(var(--accent))]' : 'text-gray-500 dark:hover:text-gray-100'
            }`
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
