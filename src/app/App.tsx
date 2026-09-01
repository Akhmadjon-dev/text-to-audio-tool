import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getStoredTheme, setTheme, type ThemeMode } from '@/features/settings/theme';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { restoreLastDocument } from '@/features/documents/persistence';
import { getProgress } from '@/services/storage/db';
import type { DocumentRecord } from '@/types';
import { TextInput } from '@/components/upload/TextInput';
import { FileDrop } from '@/components/upload/FileDrop';
import { RecentDocuments } from '@/components/documents/RecentDocuments';
import { ReaderScreen } from '@/components/reader/ReaderScreen';
import { SettingsPanel } from '@/components/settings/SettingsPanel';

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
      type="button"
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const document = useDocumentStore((s) => s.document);
  const chunks = useDocumentStore((s) => s.chunks);
  const setFromText = useDocumentStore((s) => s.setFromText);
  const setDocument = useDocumentStore((s) => s.setDocument);
  const clear = useDocumentStore((s) => s.clear);
  const hydrate = useSettingsStore((s) => s.hydrate);

  const openDocument = async (doc: DocumentRecord) => {
    const progress = await getProgress(doc.id);
    setDocument(doc, progress?.chunkIndex ?? 0);
  };

  // Load persisted settings once on mount.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Restore the last opened document + reading position (continue where stopped).
  useEffect(() => {
    let active = true;
    void restoreLastDocument().then((r) => {
      if (active && r) setDocument(r.document, r.chunkIndex);
    });
    return () => {
      active = false;
    };
  }, [setDocument]);

  const hasDocument = document !== null && chunks.length > 0;

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <button
          type="button"
          onClick={hasDocument ? clear : undefined}
          className="flex items-center gap-2"
          aria-label={hasDocument ? 'Back to start' : 'Local Reader'}
        >
          <span className="text-xl" aria-hidden>
            📖
          </span>
          <h1 className="text-lg font-semibold tracking-tight">Local Reader</h1>
        </button>
        <div className="flex items-center gap-2">
          {hasDocument && (
            <button
              type="button"
              onClick={clear}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ＋ New
            </button>
          )}
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
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            title="Settings"
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ⚙️
          </button>
        </div>
      </header>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {hasDocument ? (
        <ReaderScreen document={document} chunks={chunks} />
      ) : (
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center">
          <div className="text-5xl" aria-hidden>
            🎧
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Turn any PDF or text into audio</h2>
            <p className="max-w-md text-slate-600 dark:text-slate-400">
              Drop a PDF or paste text and listen — while you work, exercise, or commute. Everything
              runs on your device.
            </p>
          </div>

          <FileDrop
            onExtracted={(text, title) => setFromText(text, { title, source: 'pdf' })}
          />

          <div className="flex w-full max-w-2xl items-center gap-3 text-xs font-medium text-slate-400 dark:text-slate-600">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            OR
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <TextInput onSubmit={(text) => setFromText(text)} />

          <RecentDocuments onOpen={(doc) => void openDocument(doc)} />

          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500">
            <span aria-hidden>🔒</span>
            Your documents stay on your device. Nothing is uploaded to a server.
          </p>
        </main>
      )}

      <footer className="border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
        Local Reader — offline-first · no account · no tracking
      </footer>
    </div>
  );
}
