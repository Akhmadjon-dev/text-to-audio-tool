import { useDocumentLibrary } from '@/hooks/useDocumentLibrary';
import type { DocumentRecord } from '@/types';

interface RecentDocumentsProps {
  onOpen: (doc: DocumentRecord) => void;
}

const SOURCE_ICON: Record<DocumentRecord['source'], string> = {
  pdf: '📄',
  text: '📝',
};

/** List of previously opened documents, restorable with one tap. */
export function RecentDocuments({ onOpen }: RecentDocumentsProps) {
  const { docs, loading, remove } = useDocumentLibrary();

  if (loading || docs.length === 0) return null;

  return (
    <div className="w-full max-w-2xl text-left">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Recent
      </h3>
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {docs.map((doc) => (
          <li key={doc.id} className="flex items-center gap-3 bg-white px-3 py-2.5 dark:bg-slate-900">
            <span aria-hidden>{SOURCE_ICON[doc.source]}</span>
            <button
              type="button"
              onClick={() => onOpen(doc)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {doc.title}
              </span>
              <span className="block text-xs text-slate-400 dark:text-slate-500">
                {new Date(doc.createdAt).toLocaleDateString()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void remove(doc.id)}
              aria-label={`Delete ${doc.title}`}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
