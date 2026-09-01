import { useEffect, useMemo, useState } from 'react';
import type { TTSProvider, TTSVoice } from '@/services/tts/types';
import { groupVoicesByLanguage, type VoiceGroup } from '@/utils/lang';

interface UseVoicesResult {
  voices: TTSVoice[];
  groups: VoiceGroup[];
  loading: boolean;
}

interface LoadedState {
  provider: TTSProvider | null;
  voices: TTSVoice[];
}

/**
 * Load the available voices for a provider and keep them in sync when the
 * platform's voice list changes (voices load asynchronously in most browsers).
 */
export function useVoices(provider: TTSProvider): UseVoicesResult {
  const [loaded, setLoaded] = useState<LoadedState>({ provider: null, voices: [] });

  useEffect(() => {
    let active = true;
    const apply = (v: TTSVoice[]) => {
      if (active) setLoaded({ provider, voices: v });
    };

    provider.loadVoices().then(apply);
    const unsubscribe = provider.onVoicesChanged?.(() => {
      provider.loadVoices().then(apply);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [provider]);

  // Derive loading from state so we never setState synchronously in the effect.
  const isCurrent = loaded.provider === provider;
  const voices = useMemo(
    () => (loaded.provider === provider ? loaded.voices : []),
    [loaded, provider],
  );
  const groups = useMemo(() => groupVoicesByLanguage(voices), [voices]);

  return { voices, groups, loading: !isCurrent };
}
