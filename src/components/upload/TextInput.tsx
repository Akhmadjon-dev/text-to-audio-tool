import { useState } from 'react';
import { countWords } from '@/utils/textClean';

interface TextInputProps {
  onSubmit: (text: string) => void;
}

/** Large paste area — the fastest path: paste text, press Listen. */
export function TextInput({ onSubmit }: TextInputProps) {
  const [value, setValue] = useState('');
  const words = countWords(value);
  const canSubmit = words > 0;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <label htmlFor="paste-area" className="sr-only">
        Paste the text you want to listen to
      </label>
      <textarea
        id="paste-area"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste your text here — an article, notes, a chapter — and press Listen."
        className="min-h-56 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-base leading-relaxed text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
          {words > 0 ? `${words.toLocaleString()} words` : 'No text yet'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue('')}
            disabled={!value}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onSubmit(value)}
            disabled={!canSubmit}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            ▶ Listen
          </button>
        </div>
      </div>
    </div>
  );
}
