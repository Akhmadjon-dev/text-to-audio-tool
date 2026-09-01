import type { TTSEngine } from '@/types';
import type { TTSProvider } from './types';
import { BrowserSpeechProvider } from './BrowserSpeechProvider';

export * from './types';

const browserProvider = new BrowserSpeechProvider();

/**
 * Resolve a TTS provider for the requested engine. The Kokoro neural provider
 * is registered here in a later phase; until then everything falls back to the
 * always-available browser engine.
 */
export function getProvider(engine: TTSEngine): TTSProvider {
  switch (engine) {
    case 'browser':
    default:
      return browserProvider;
  }
}

export { browserProvider };
