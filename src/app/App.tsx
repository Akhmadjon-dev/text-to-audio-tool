import { useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getStoredTheme, setTheme, type ThemeMode } from '@/features/settings/theme';

function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());
  const cycle = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
    setMode(next);
    setTheme(next);
  };
  const label = mode === 'light' ? '☀️ Light' : mode === 'dark' ? '🌙 Dark' : '🖥️ System';
  return (
    <button
      onClick={cycle}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={`Theme: ${mode}. Click to change.`}
    >
      {label}
    </button>
  );
}

export default function App() {
  const online = useOnlineStatus();

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>
            📖
          </span>
          <h1 className="text-lg font-semibold tracking-tight">Local Reader</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              online
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
            title={online ? 'Online' : 'Offline — the app still works'}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {online ? 'Online' : 'Offline'}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
        <div className="text-5xl" aria-hidden>
          🎧
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Turn any PDF or text into audio</h2>
          <p className="max-w-md text-slate-600 dark:text-slate-400">
            Paste text or drop a PDF and listen — while you work, exercise, or commute. Everything
            runs on your device.
          </p>
        </div>

        <div className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <p className="font-medium">Upload &amp; playback coming in the next build.</p>
          <p className="mt-1 text-sm">Phase 0 scaffold — PWA shell is live.</p>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
          <span aria-hidden>🔒</span>
          Your documents stay on your device. Nothing is uploaded to a server.
        </p>
      </main>

      <footer className="border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
        Local Reader — offline-first · no account · no tracking
      </footer>
    </div>
  );
}
