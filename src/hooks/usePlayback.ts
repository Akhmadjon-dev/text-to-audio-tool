import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { PlaybackController } from '@/features/playback/PlaybackController';
import { getProvider } from '@/services/tts';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useDocumentStore } from '@/store/useDocumentStore';

/**
 * React binding for the PlaybackController. Wires the active document's chunks
 * and the user's settings (engine, voice, rate) into a single long-lived
 * controller and exposes transport actions + reactive state.
 */
export function usePlayback() {
  const engine = useSettingsStore((s) => s.engine);
  const voiceId = useSettingsStore((s) => s.voiceId);
  const lang = useSettingsStore((s) => s.lang);
  const rate = useSettingsStore((s) => s.rate);
  const skipSeconds = useSettingsStore((s) => s.skipSeconds);
  const chunks = useDocumentStore((s) => s.chunks);

  const provider = useMemo(() => getProvider(engine), [engine]);

  // Create one long-lived controller (useState initializer runs exactly once).
  const [controller] = useState(
    () => new PlaybackController(getProvider(engine), { voiceId, lang, rate }),
  );

  // Swap the engine provider when it changes.
  useEffect(() => {
    controller.setProvider(provider);
  }, [controller, provider]);

  // Keep voice/lang/rate in sync.
  useEffect(() => {
    controller.setOptions({ voiceId, lang, rate });
  }, [controller, voiceId, lang, rate]);

  // Load new chunks when the active document changes.
  useEffect(() => {
    controller.load(chunks);
  }, [controller, chunks]);

  const state = useSyncExternalStore(
    useCallback((cb) => controller.subscribe(cb), [controller]),
    () => controller.getState(),
  );

  const play = useCallback(() => controller.play(), [controller]);
  const pause = useCallback(() => controller.pause(), [controller]);
  const toggle = useCallback(() => controller.toggle(), [controller]);
  const stop = useCallback(() => controller.stop(), [controller]);
  const restart = useCallback(() => controller.restart(), [controller]);
  const seek = useCallback((i: number) => controller.seek(i), [controller]);
  const next = useCallback(() => controller.next(), [controller]);
  const prev = useCallback(() => controller.prev(), [controller]);
  const skipForward = useCallback(
    () => controller.skipSeconds(skipSeconds),
    [controller, skipSeconds],
  );
  const skipBack = useCallback(
    () => controller.skipSeconds(-skipSeconds),
    [controller, skipSeconds],
  );

  return {
    ...state,
    isPlaying: state.status === 'playing',
    play,
    pause,
    toggle,
    stop,
    restart,
    seek,
    next,
    prev,
    skipForward,
    skipBack,
  };
}
