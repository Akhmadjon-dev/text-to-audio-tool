import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  putDocument,
  getDocument,
  listDocuments,
  deleteDocument,
  putProgress,
  getProgress,
  loadSettings,
  saveSettings,
  clearAllData,
} from './db';
import { DEFAULT_SETTINGS, type DocumentRecord } from '@/types';

const doc = (id: string, updatedAt: number): DocumentRecord => ({
  id,
  title: `Doc ${id}`,
  source: 'text',
  text: 'hello world',
  createdAt: updatedAt,
  updatedAt,
});

describe('storage/db', () => {
  beforeEach(async () => {
    // Reset stored data between tests (the DB connection is cached in the module).
    await clearAllData();
  });

  it('stores and retrieves a document', async () => {
    await putDocument(doc('a', 1));
    const got = await getDocument('a');
    expect(got?.title).toBe('Doc a');
  });

  it('lists documents newest-first', async () => {
    await putDocument(doc('a', 100));
    await putDocument(doc('b', 200));
    const list = await listDocuments();
    expect(list.map((d) => d.id)).toEqual(['b', 'a']);
  });

  it('deletes a document and its progress', async () => {
    await putDocument(doc('a', 1));
    await putProgress({ docId: 'a', chunkIndex: 3, charOffset: 0, updatedAt: 1 });
    await deleteDocument('a');
    expect(await getDocument('a')).toBeUndefined();
    expect(await getProgress('a')).toBeUndefined();
  });

  it('stores and retrieves reading progress', async () => {
    await putProgress({ docId: 'x', chunkIndex: 7, charOffset: 0, updatedAt: 1 });
    const p = await getProgress('x');
    expect(p?.chunkIndex).toBe(7);
  });

  it('saves and loads settings', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, rate: 1.5, voiceId: 'v1' });
    const s = await loadSettings();
    expect(s?.rate).toBe(1.5);
    expect(s?.voiceId).toBe('v1');
  });

  it('clearAllData wipes documents, progress, and settings', async () => {
    await putDocument(doc('a', 1));
    await putProgress({ docId: 'a', chunkIndex: 1, charOffset: 0, updatedAt: 1 });
    await saveSettings(DEFAULT_SETTINGS);
    await clearAllData();
    expect(await listDocuments()).toEqual([]);
    expect(await getProgress('a')).toBeUndefined();
    expect(await loadSettings()).toBeUndefined();
  });
});
