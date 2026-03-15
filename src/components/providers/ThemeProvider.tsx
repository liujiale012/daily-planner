import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

const ACCENT_RGB: Record<string, string> = {
  indigo: '79 70 229',
  emerald: '5 150 105',
  violet: '124 58 237',
  rose: '225 29 72',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const accentColor = useSettingsStore((s) => s.accentColor);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'light') root.classList.remove('dark');
    else {
      const q = window.matchMedia('(prefers-color-scheme: dark)');
      const fn = () => (q.matches ? root.classList.add('dark') : root.classList.remove('dark'));
      fn();
      q.addEventListener('change', fn);
      return () => q.removeEventListener('change', fn);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--accent',
      ACCENT_RGB[accentColor] ?? ACCENT_RGB.indigo
    );
  }, [accentColor]);

  return <>{children}</>;
}
