import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { AccentColor } from '../../types';

type AccentTheme = {
  accentRgb: string;
  pageGradientFrom: string;
  pageGradientVia: string;
  pageGradientTo: string;
  surfaceBgRgb: string;
  surfaceBorderRgb: string;
  surfaceShadowRgb: string;
};

const ACCENT_THEMES: Record<AccentColor, AccentTheme> = {
  orange: {
    accentRgb: '249 99 47',
    pageGradientFrom: '#f9632f',
    pageGradientVia: '#ffb06a',
    pageGradientTo: '#fff3e2',
    surfaceBgRgb: '255 247 238',
    surfaceBorderRgb: '245 231 208',
    surfaceShadowRgb: '190 140 90',
  },
  indigo: {
    accentRgb: '79 70 229',
    pageGradientFrom: '#4f46e5',
    pageGradientVia: '#8b8cf8',
    pageGradientTo: '#eef2ff',
    surfaceBgRgb: '241 242 255',
    surfaceBorderRgb: '199 210 254',
    surfaceShadowRgb: '99 102 241',
  },
  emerald: {
    accentRgb: '5 150 105',
    pageGradientFrom: '#047857',
    pageGradientVia: '#34d399',
    pageGradientTo: '#ecfdf5',
    surfaceBgRgb: '236 253 245',
    surfaceBorderRgb: '167 243 208',
    surfaceShadowRgb: '16 185 129',
  },
  violet: {
    accentRgb: '124 58 237',
    pageGradientFrom: '#6d28d9',
    pageGradientVia: '#a78bfa',
    pageGradientTo: '#f5f3ff',
    surfaceBgRgb: '245 243 255',
    surfaceBorderRgb: '221 214 254',
    surfaceShadowRgb: '139 92 246',
  },
  rose: {
    accentRgb: '225 29 72',
    pageGradientFrom: '#be123c',
    pageGradientVia: '#fb7185',
    pageGradientTo: '#fff1f2',
    surfaceBgRgb: '255 241 242',
    surfaceBorderRgb: '254 205 211',
    surfaceShadowRgb: '244 63 94',
  },
  sky: {
    accentRgb: '14 165 233',
    pageGradientFrom: '#0284c7',
    pageGradientVia: '#38bdf8',
    pageGradientTo: '#f0f9ff',
    surfaceBgRgb: '240 249 255',
    surfaceBorderRgb: '186 230 253',
    surfaceShadowRgb: '14 165 233',
  },
  amber: {
    accentRgb: '217 119 6',
    pageGradientFrom: '#b45309',
    pageGradientVia: '#f59e0b',
    pageGradientTo: '#fffbeb',
    surfaceBgRgb: '255 251 235',
    surfaceBorderRgb: '253 230 138',
    surfaceShadowRgb: '245 158 11',
  },
  teal: {
    accentRgb: '13 148 136',
    pageGradientFrom: '#0f766e',
    pageGradientVia: '#2dd4bf',
    pageGradientTo: '#f0fdfa',
    surfaceBgRgb: '240 253 250',
    surfaceBorderRgb: '153 246 228',
    surfaceShadowRgb: '20 184 166',
  },
  fuchsia: {
    accentRgb: '192 38 211',
    pageGradientFrom: '#a21caf',
    pageGradientVia: '#e879f9',
    pageGradientTo: '#fdf4ff',
    surfaceBgRgb: '253 244 255',
    surfaceBorderRgb: '240 171 252',
    surfaceShadowRgb: '217 70 239',
  },
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
    const theme = ACCENT_THEMES[accentColor as AccentColor] ?? ACCENT_THEMES.indigo;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--accent', theme.accentRgb);
    rootStyle.setProperty('--app-bg-from', theme.pageGradientFrom);
    rootStyle.setProperty('--app-bg-via', theme.pageGradientVia);
    rootStyle.setProperty('--app-bg-to', theme.pageGradientTo);
    rootStyle.setProperty('--surface-bg-rgb', theme.surfaceBgRgb);
    rootStyle.setProperty('--surface-border-rgb', theme.surfaceBorderRgb);
    rootStyle.setProperty('--surface-shadow-rgb', theme.surfaceShadowRgb);
  }, [accentColor]);

  return <>{children}</>;
}
