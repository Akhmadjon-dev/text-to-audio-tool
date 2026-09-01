import { useCallback, useEffect, useState } from 'react';
import { listDocuments, deleteDocument } from '@/services/storage/db';
import type { DocumentRecord } from '@/types';

/** Reactive list of saved documents from IndexedDB. */
export function useDocumentLibrary() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    listDocuments()
      .then((d) => {
        if (active) setDocs(d);
      })
      .catch(() => {
        if (active) setDocs([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const remove = useCallback(async (id: string) => {
    await deleteDocument(id);
    setRefreshKey((k) => k + 1);
  }, []);

  return { docs, loading, refresh, remove };
}
