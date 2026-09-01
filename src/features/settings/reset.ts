import { clearAllData } from '@/services/storage/db';
import { clearLastDocId } from '@/features/documents/lastDoc';

/**
 * Erase every trace of local data: app database (documents, progress, settings),
 * the last-document pointer, and all Cache Storage (app shell + cached TTS
 * model). Does not touch the current theme choice by default.
 */
export async function wipeAllLocalData(): Promise<void> {
  clearLastDocId();

  try {
    await clearAllData();
  } catch {
    /* ignore */
  }

  // Clear Cache Storage (service-worker precache + any cached model assets).
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}
