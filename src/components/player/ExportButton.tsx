import { useState } from 'react';
import { useAudioExport } from '@/hooks/useAudioExport';

/** Download the current document as audio (WAV/MP3). Kokoro engine only. */
export function ExportButton() {
  const { state, done, total, message, exportAudio, reset } = useAudioExport();
  const [menuOpen, setMenuOpen] = useState(false);

  if (state === 'exporting') {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return (
      <span className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
        Generating audio… {done}/{total} ({pct}%)
      </span>
    );
  }

  if (state === 'error') {
    return (
      <button
        type="button"
        onClick={reset}
        className="text-sm text-amber-600 underline dark:text-amber-400"
      >
        {message} — retry
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        ⬇ Download audio
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute bottom-full right-0 mb-1 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {(['mp3', 'wav'] as const).map((format) => (
            <button
              key={format}
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                void exportAudio(format);
              }}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {format.toUpperCase()}
              {format === 'mp3' && (
                <span className="ml-1 text-xs text-slate-400">smaller</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
