import type { TTSEngine } from '@/types';
import type { TTSProvider } from './types';
import { BrowserSpeechProvider } from './BrowserSpeechProvider';
import { KokoroProvider } from './KokoroProvider';

export * from './types';

const browserProvider = new BrowserSpeechProvider();
const kokoroProvider = new KokoroProvider();

/** Resolve a TTS provider for the requested engine. */
export function getProvider(engine: TTSEngine): TTSProvider {
  switch (engine) {
    case 'kokoro':
      return kokoroProvider;
    case 'browser':
    default:
      return browserProvider;
  }
}

export { browserProvider, kokoroProvider };
