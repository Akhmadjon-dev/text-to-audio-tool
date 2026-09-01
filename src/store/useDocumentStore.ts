import { create } from 'zustand';
import type { DocumentRecord, SourceKind } from '@/types';
import { cleanText } from '@/utils/textClean';
import { chunkText, type Chunk } from '@/utils/chunker';
import { persistDocument } from '@/features/documents/persistence';
import { clearLastDocId } from '@/features/documents/lastDoc';

interface SetTextMeta {
  id?: string;
  title?: string;
  source?: SourceKind;
}

interface DocumentState {
  document: DocumentRecord | null;
  chunks: Chunk[];
  /** Chunk index to begin playback at (for resuming a restored document). */
  startIndex: number;
  /** Clean, chunk, persist, and load raw text as the active document. */
  setFromText: (raw: string, meta?: SetTextMeta) => DocumentRecord | null;
  /** Load an already-prepared document (e.g. restored from storage). */
  setDocument: (doc: DocumentRecord, startIndex?: number) => void;
  clear: () => void;
}

function makeId(): string {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(text: string): string {
  const firstLine = text
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean) ?? '';
  if (!firstLine) return 'Untitled document';
  return firstLine.length > 60 ? `${firstLine.slice(0, 57).trim()}…` : firstLine;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  document: null,
  chunks: [],
  startIndex: 0,

  setFromText: (raw, meta) => {
    const text = cleanText(raw);
    if (!text) {
      set({ document: null, chunks: [], startIndex: 0 });
      return null;
    }
    const now = Date.now();
    const document: DocumentRecord = {
      id: meta?.id ?? makeId(),
      title: meta?.title ?? deriveTitle(text),
      source: meta?.source ?? 'text',
      text,
      createdAt: now,
      updatedAt: now,
    };
    set({ document, chunks: chunkText(text), startIndex: 0 });
    void persistDocument(document);
    return document;
  },

  setDocument: (doc, startIndex = 0) => {
    set({ document: doc, chunks: chunkText(doc.text), startIndex });
    void persistDocument(doc);
  },

  clear: () => {
    clearLastDocId();
    set({ document: null, chunks: [], startIndex: 0 });
  },
}));
