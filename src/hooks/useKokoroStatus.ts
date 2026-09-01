import { useCallback, useSyncExternalStore } from 'react';
import { kokoroProvider } from '@/services/tts';
import type { KokoroStatus } from '@/services/tts/KokoroProvider';

/** Subscribe to the Kokoro model load/download status for UI feedback. */
export function useKokoroStatus(): KokoroStatus {
  return useSyncExternalStore(
    useCallback((cb) => kokoroProvider.subscribeStatus(cb), []),
    () => kokoroProvider.getStatus(),
  );
}
