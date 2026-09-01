import type {
  SpeakOutcome,
  TTSCapabilities,
  TTSProvider,
  TTSSpeakParams,
  TTSVoice,
} from './types';
import type { KokoroDevice, KokoroInbound, KokoroOutbound } from './kokoroMessages';
import { KOKORO_VOICES, DEFAULT_KOKORO_VOICE, isKokoroVoice } from './kokoroVoices';

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';

export type KokoroPhase = 'idle' | 'loading' | 'ready' | 'error';

export interface KokoroStatus {
  phase: KokoroPhase;
  progress: number; // 0..1
  message: string;
}

export interface GeneratedAudio {
  audio: Float32Array;
  sampleRate: number;
}

type StatusListener = (s: KokoroStatus) => void;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Neural TTS via Kokoro-82M running in a Web Worker. The model is downloaded
 * from a public CDN on first use and cached by transformers.js; generation
 * happens off the main thread and audio is played through the Web Audio API.
 * Unlike the browser engine, this can export audio (WAV/MP3).
 */
export class KokoroProvider implements TTSProvider {
  readonly id = 'kokoro' as const;
  readonly name = 'Kokoro neural voice';
  readonly capabilities: TTSCapabilities = {
    canExport: true,
    wordBoundary: false,
    requiresDownload: true,
  };

  private worker: Worker | null = null;
  private status: KokoroStatus = { phase: 'idle', progress: 0, message: '' };
  private statusListeners = new Set<StatusListener>();

  private loadPromise: Promise<void> | null = null;
  private loadResolve: (() => void) | null = null;
  private loadReject: ((e: Error) => void) | null = null;

  private genId = 0;
  private pending = new Map<
    number,
    { resolve: (a: GeneratedAudio) => void; reject: (e: Error) => void }
  >();

  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private cancelling = false;

  isSupported(): boolean {
    return (
      typeof Worker !== 'undefined' &&
      typeof AudioContext !== 'undefined' &&
      typeof WebAssembly !== 'undefined'
    );
  }

  loadVoices(): Promise<TTSVoice[]> {
    // Static catalog — no model download required to populate the picker.
    return Promise.resolve(
      KOKORO_VOICES.map((v) => ({
        id: v.id,
        name: v.name,
        lang: v.lang,
        localService: true,
        engine: 'kokoro' as const,
      })),
    );
  }

  // --- Status ---
  getStatus(): KokoroStatus {
    return this.status;
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private setStatus(patch: Partial<KokoroStatus>): void {
    this.status = { ...this.status, ...patch };
    for (const l of this.statusListeners) l(this.status);
  }

  // --- Model loading ---
  ensureLoaded(): Promise<void> {
    if (this.status.phase === 'ready') return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<void>((resolve, reject) => {
      this.loadResolve = resolve;
      this.loadReject = reject;
    });
    this.setStatus({ phase: 'loading', progress: 0, message: 'Preparing neural voice…' });

    const device: KokoroDevice = 'gpu' in navigator ? 'webgpu' : 'wasm';
    this.getWorker().postMessage({
      type: 'load',
      modelId: MODEL_ID,
      dtype: device === 'webgpu' ? 'fp32' : 'q8',
      device,
    } satisfies KokoroInbound);

    return this.loadPromise;
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../../workers/tts.worker.ts', import.meta.url), {
        type: 'module',
      });
      this.worker.onmessage = (e: MessageEvent<KokoroOutbound>) => this.onMessage(e.data);
      this.worker.onerror = () => {
        this.setStatus({ phase: 'error', message: 'The neural voice engine failed to start.' });
        this.loadReject?.(new Error('worker error'));
      };
    }
    return this.worker;
  }

  private onMessage(msg: KokoroOutbound): void {
    switch (msg.type) {
      case 'progress': {
        const progress = msg.total > 0 ? clamp(msg.loaded / msg.total, 0, 1) : 0;
        this.setStatus({
          phase: 'loading',
          progress,
          message: `Downloading voice model… ${Math.round(progress * 100)}%`,
        });
        break;
      }
      case 'ready':
        this.setStatus({ phase: 'ready', progress: 1, message: 'Neural voice ready' });
        this.loadResolve?.();
        break;
      case 'error':
        this.setStatus({ phase: 'error', message: msg.message });
        this.loadReject?.(new Error(msg.message));
        this.loadPromise = null; // allow retry
        break;
      case 'generated': {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        p?.resolve({ audio: msg.audio, sampleRate: msg.sampleRate });
        break;
      }
      case 'generate-error': {
        const p = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        p?.reject(new Error(msg.message));
        break;
      }
    }
  }

  /** Generate speech audio for a chunk (used by playback and export). */
  generate(text: string, voiceId: string | null, rate: number): Promise<GeneratedAudio> {
    const voice = isKokoroVoice(voiceId) ? (voiceId as string) : DEFAULT_KOKORO_VOICE;
    const speed = clamp(rate, 0.5, 2);
    const id = ++this.genId;
    return new Promise<GeneratedAudio>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.getWorker().postMessage({ type: 'generate', id, text, voice, speed } satisfies KokoroInbound);
    });
  }

  // --- Playback ---
  private getAudioContext(): AudioContext {
    if (!this.audioContext) this.audioContext = new AudioContext();
    return this.audioContext;
  }

  async speak(params: TTSSpeakParams): Promise<SpeakOutcome> {
    this.cancelling = false;
    try {
      await this.ensureLoaded();
    } catch {
      return 'error';
    }
    if (this.cancelling) return 'cancelled';

    let generated: GeneratedAudio;
    try {
      generated = await this.generate(params.text, params.voiceId, params.rate);
    } catch {
      return this.cancelling ? 'cancelled' : 'error';
    }
    if (this.cancelling) return 'cancelled';

    return this.play(generated);
  }

  private play({ audio, sampleRate }: GeneratedAudio): Promise<SpeakOutcome> {
    return new Promise<SpeakOutcome>((resolve) => {
      try {
        const ctx = this.getAudioContext();
        const buffer = ctx.createBuffer(1, audio.length, sampleRate);
        buffer.getChannelData(0).set(audio);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => {
          if (this.currentSource === source) this.currentSource = null;
          resolve(this.cancelling ? 'cancelled' : 'ended');
        };
        this.currentSource = source;
        if (ctx.state === 'suspended') void ctx.resume();
        source.start();
      } catch {
        resolve('error');
      }
    });
  }

  pause(): void {
    void this.audioContext?.suspend();
  }

  resume(): void {
    void this.audioContext?.resume();
  }

  cancel(): void {
    this.cancelling = true;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        /* already stopped */
      }
      this.currentSource = null;
    }
    // Resume the context so a subsequent speak() isn't stuck suspended.
    if (this.audioContext?.state === 'suspended') void this.audioContext.resume();
  }
}
