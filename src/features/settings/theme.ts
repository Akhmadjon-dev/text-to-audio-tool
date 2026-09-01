export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'local-reader:theme';

export function getStoredTheme(): ThemeMode {
  const v = localStorage.getItem(THEME_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyStoredTheme(): void {
  applyTheme(getStoredTheme());
}

export function applyTheme(mode: ThemeMode): void {
  const isDark = resolveDark(mode);
  document.documentElement.classList.toggle('dark', isDark);
}

export function setTheme(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}
