import type {
  SpeakOutcome,
  TTSCapabilities,
  TTSProvider,
  TTSSpeakParams,
  TTSVoice,
} from './types';

/**
 * TTS backed by the browser's built-in Web Speech API (SpeechSynthesis).
 * Zero download, uses the OS/browser voices. Cannot export audio (the API does
 * not expose the synthesized buffer) — that's what the Kokoro engine is for.
 */
export class BrowserSpeechProvider implements TTSProvider {
  readonly id = 'browser' as const;
  readonly name = 'Browser voices (built-in)';
  readonly capabilities: TTSCapabilities = {
    canExport: false,
    wordBoundary: false, // charIndex is unreliable across browsers — we highlight per chunk
    requiresDownload: false,
  };

  private synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  private voices: SpeechSynthesisVoice[] = [];
  private cancelling = false;
  private userPaused = false;
  private keepAlive: ReturnType<typeof setInterval> | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  loadVoices(): Promise<TTSVoice[]> {
    return new Promise((resolve) => {
      if (!this.synth) return resolve([]);

      const collect = () => {
        this.voices = this.synth!.getVoices();
        return this.voices.map(toTTSVoice);
      };

      const immediate = collect();
      if (immediate.length > 0) return resolve(immediate);

      // Voices load asynchronously; wait for the event, with a timeout fallback.
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        resolve(collect());
      };
      this.synth.addEventListener('voiceschanged', done, { once: true });
      setTimeout(done, 2000);
    });
  }

  onVoicesChanged(cb: () => void): () => void {
    if (!this.synth) return () => {};
    const handler = () => {
      this.voices = this.synth!.getVoices();
      cb();
    };
    this.synth.addEventListener('voiceschanged', handler);
    return () => this.synth?.removeEventListener('voiceschanged', handler);
  }

  speak(params: TTSSpeakParams): Promise<SpeakOutcome> {
    return new Promise((resolve) => {
      if (!this.synth) return resolve('error');

      // Clear any stuck state from a previous utterance.
      this.synth.cancel();
      this.cancelling = false;
      this.userPaused = false;

      const u = new SpeechSynthesisUtterance(params.text);
      u.rate = clamp(params.rate, 0.1, 10);
      u.pitch = params.pitch ?? 1;
      u.volume = params.volume ?? 1;

      const voice = params.voiceId
        ? this.voices.find((v) => v.voiceURI === params.voiceId)
        : undefined;
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? params.lang ?? '';

      const finish = (outcome: SpeakOutcome) => {
        this.stopKeepAlive();
        resolve(outcome);
      };

      u.onend = () => finish(this.cancelling ? 'cancelled' : 'ended');
      u.onerror = (e) => {
        // A cancel() legitimately fires 'canceled'/'interrupted' — not a failure.
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (this.cancelling || err === 'canceled' || err === 'interrupted') {
          finish('cancelled');
        } else {
          finish('error');
        }
      };

      this.synth.speak(u);
      this.startKeepAlive();
    });
  }

  pause(): void {
    if (!this.synth) return;
    this.userPaused = true;
    this.synth.pause();
  }

  resume(): void {
    if (!this.synth) return;
    this.userPaused = false;
    this.synth.resume();
  }

  cancel(): void {
    if (!this.synth) return;
    this.cancelling = true;
    this.stopKeepAlive();
    this.synth.cancel();
  }

  /**
   * Works around a long-standing Chromium bug where synthesis silently stalls
   * after ~15s. Nudging resume() while actively speaking keeps it alive without
   * disturbing an intentional user pause.
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAlive = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.userPaused) {
        this.synth.resume();
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAlive) {
      clearInterval(this.keepAlive);
      this.keepAlive = null;
    }
  }
}

function toTTSVoice(v: SpeechSynthesisVoice): TTSVoice {
  return {
    id: v.voiceURI,
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    engine: 'browser',
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
