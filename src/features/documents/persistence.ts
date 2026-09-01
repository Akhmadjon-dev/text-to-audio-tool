import type { DocumentRecord, ReadingProgress } from '@/types';
import {
  putDocument,
  getDocument,
  putProgress,
  getProgress,
} from '@/services/storage/db';
import { getLastDocId, setLastDocId } from './lastDoc';

/** Persist a document and mark it as the last opened. Fire-and-forget safe. */
export async function persistDocument(doc: DocumentRecord): Promise<void> {
  try {
    await putDocument(doc);
    setLastDocId(doc.id);
  } catch {
    /* storage may be unavailable/full — playback still works this session */
  }
}

/** Save the current reading position for a document. */
export async function persistProgress(docId: string, chunkIndex: number): Promise<void> {
  try {
    const progress: ReadingProgress = {
      docId,
      chunkIndex,
      charOffset: 0,
      updatedAt: Date.now(),
    };
    await putProgress(progress);
  } catch {
    /* ignore */
  }
}

export interface RestoredDocument {
  document: DocumentRecord;
  chunkIndex: number;
}

/** Load the last opened document and its saved position, if any. */
export async function restoreLastDocument(): Promise<RestoredDocument | null> {
  try {
    const id = getLastDocId();
    if (!id) return null;
    const document = await getDocument(id);
    if (!document) return null;
    const progress = await getProgress(id);
    return { document, chunkIndex: progress?.chunkIndex ?? 0 };
  } catch {
    return null;
  }
}
