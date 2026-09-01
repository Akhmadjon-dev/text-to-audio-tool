import { useRef, useState } from 'react';
import { validatePdf, extractPdf, ScannedPdfError } from '@/services/pdf/pdfService';

interface FileDropProps {
  onExtracted: (text: string, title: string) => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'extracting'; page: number; total: number }
  | { kind: 'error'; message: string };

function titleFromName(name: string): string {
  return name.replace(/\.pdf$/i, '').trim() || 'PDF document';
}

/** Drag-and-drop / click-to-choose PDF upload with local extraction. */
export function FileDrop({ onExtracted }: FileDropProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const error = validatePdf(file);
    if (error) {
      setStatus({ kind: 'error', message: error });
      return;
    }
    setStatus({ kind: 'extracting', page: 0, total: 0 });
    try {
      const result = await extractPdf(file, (page, total) =>
        setStatus({ kind: 'extracting', page, total }),
      );
      onExtracted(result.text, titleFromName(file.name));
      setStatus({ kind: 'idle' });
    } catch (err) {
      const message =
        err instanceof ScannedPdfError
          ? err.message
          : 'Could not read this PDF. It may be corrupted or password-protected.';
      setStatus({ kind: 'error', message });
    }
  }

  const extracting = status.kind === 'extracting';

  return (
    <div className="w-full max-w-2xl">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragging
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <span className="text-3xl" aria-hidden>
          📄
        </span>
        {extracting ? (
          <div className="w-full" aria-live="polite">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Extracting text… {status.total ? `page ${status.page} of ${status.total}` : ''}
            </p>
            <div className="mx-auto mt-2 h-2 w-56 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: status.total ? `${(status.page / status.total) * 100}%` : '10%' }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-slate-600 dark:text-slate-300">
              Drop a PDF here, or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-brand-600 underline underline-offset-2 hover:text-brand-700 dark:text-brand-400"
              >
                choose a file
              </button>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Processed on your device · up to 50 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
      {status.kind === 'error' && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
