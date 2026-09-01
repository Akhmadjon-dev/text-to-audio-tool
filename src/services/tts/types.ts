import type { TTSEngine } from '@/types';

export interface TTSVoice {
  /** Stable identifier (voiceURI for the browser engine). */
  id: string;
  name: string;
  /** BCP-47 language tag, e.g. "en-US". */
  lang: string;
  /** True if the voice runs on-device (vs a cloud/network voice). */
  localService: boolean;
  engine: TTSEngine;
}

export interface TTSSpeakParams {
  text: string;
  voiceId: string | null;
  lang: string | null;
  /** 0.5 – 3.0 */
  rate: number;
  pitch?: number;
  volume?: number;
}

export type SpeakOutcome = 'ended' | 'cancelled' | 'error';

export interface TTSCapabilities {
  /** Can produce a downloadable audio buffer (WAV/MP3). */
  canExport: boolean;
  /** Emits reliable word-boundary events for word-level highlighting. */
  wordBoundary: boolean;
  /** Requires a one-time model download before first use. */
  requiresDownload: boolean;
}

/**
 * Engine-agnostic TTS contract. The UI and playback controller depend only on
 * this — never on `window.speechSynthesis` or any model runtime directly — so
 * new engines (Kokoro, etc.) can be added without touching the app.
 */
export interface TTSProvider {
  readonly id: TTSEngine;
  readonly name: string;
  readonly capabilities: TTSCapabilities;

  /** Whether this engine can run in the current browser. */
  isSupported(): boolean;

  /** Resolve the available voices (may be empty if none are installed). */
  loadVoices(): Promise<TTSVoice[]>;

  /** Optionally notify when the voice list changes. Returns an unsubscribe fn. */
  onVoicesChanged?(cb: () => void): () => void;

  /** Speak one chunk. Resolves when finished or cancelled; never rejects. */
  speak(params: TTSSpeakParams): Promise<SpeakOutcome>;

  pause(): void;
  resume(): void;
  cancel(): void;
}
