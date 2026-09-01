import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DocumentRecord, ReadingProgress, Settings } from '@/types';

/**
 * IndexedDB schema. All user data lives here on-device — documents, reading
 * position, settings. The neural TTS model is cached separately by
 * transformers.js in its own IndexedDB store.
 */
interface LocalReaderDB extends DBSchema {
  documents: {
    key: string;
    value: DocumentRecord;
    indexes: { 'by-updated': number };
  };
  progress: {
    key: string;
    value: ReadingProgress;
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'local-reader';
const DB_VERSION = 1;
const SETTINGS_KEY = 'app-settings';

let dbPromise: Promise<IDBPDatabase<LocalReaderDB>> | null = null;

function getDB(): Promise<IDBPDatabase<LocalReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LocalReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const docs = db.createObjectStore('documents', { keyPath: 'id' });
        docs.createIndex('by-updated', 'updatedAt');
        db.createObjectStore('progress', { keyPath: 'docId' });
        db.createObjectStore('settings');
      },
    });
  }
  return dbPromise;
}

// --- Documents ---
export async function putDocument(doc: DocumentRecord): Promise<void> {
  await (await getDB()).put('documents', doc);
}
export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  return (await getDB()).get('documents', id);
}
export async function listDocuments(): Promise<DocumentRecord[]> {
  const all = await (await getDB()).getAllFromIndex('documents', 'by-updated');
  return all.reverse(); // newest first
}
export async function deleteDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
  await db.delete('progress', id);
}

// --- Progress ---
export async function putProgress(p: ReadingProgress): Promise<void> {
  await (await getDB()).put('progress', p);
}
export async function getProgress(docId: string): Promise<ReadingProgress | undefined> {
  return (await getDB()).get('progress', docId);
}

// --- Settings ---
export async function loadSettings(): Promise<Settings | undefined> {
  return (await getDB()).get('settings', SETTINGS_KEY);
}
export async function saveSettings(settings: Settings): Promise<void> {
  await (await getDB()).put('settings', settings, SETTINGS_KEY);
}

/** Wipe every trace of user data from the device. */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await Promise.all([db.clear('documents'), db.clear('progress'), db.clear('settings')]);
}
