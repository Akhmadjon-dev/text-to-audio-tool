import type { Chunk } from '@/utils/chunker';
import { countWords } from '@/utils/textClean';
import type { TTSProvider } from '@/services/tts/types';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended';

export interface PlaybackOptions {
  voiceId: string | null;
  lang: string | null;
  rate: number;
}

export interface PlaybackState {
  status: PlaybackStatus;
  currentIndex: number;
  totalChunks: number;
  /** Estimated seconds elapsed up to the start of the current chunk. */
  elapsedSeconds: number;
  /** Estimated total seconds for the whole document at the current rate. */
  totalSeconds: number;
}

type Listener = (state: PlaybackState) => void;

/** Baseline speaking pace used only for time-remaining estimates. */
const WORDS_PER_MINUTE = 165;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Engine-agnostic playback state machine. Drives a TTSProvider through an
 * ordered chunk queue: auto-advances, recovers from errors, and supports
 * pause/resume, stop, seek, and skip. Framework-free and unit-testable — the
 * React layer subscribes via usePlayback.
 */
export class PlaybackController {
  private provider: TTSProvider;
  private chunks: Chunk[] = [];
  private wordCounts: number[] = [];
  private cumulativeWords: number[] = [];
  private totalWords = 0;

  private index = 0;
  private status: PlaybackStatus = 'idle';
  private options: PlaybackOptions;

  private listeners = new Set<Listener>();
  private runToken = 0;
  private errorRetries = 0;
  private snapshot: PlaybackState;

  constructor(provider: TTSProvider, options: PlaybackOptions) {
    this.provider = provider;
    this.options = options;
    this.snapshot = this.compute();
  }

  // --- Subscription ---
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Returns a cached, stable snapshot (safe for useSyncExternalStore). */
  getState(): PlaybackState {
    return this.snapshot;
  }

  private compute(): PlaybackState {
    const elapsedWords = this.cumulativeWords[this.index] ?? this.totalWords;
    const perWord = 60 / (WORDS_PER_MINUTE * this.options.rate);
    return {
      status: this.status,
      currentIndex: this.index,
      totalChunks: this.chunks.length,
      elapsedSeconds: elapsedWords * perWord,
      totalSeconds: this.totalWords * perWord,
    };
  }

  private emit(): void {
    this.snapshot = this.compute();
    for (const l of this.listeners) l(this.snapshot);
  }

  private setStatus(status: PlaybackStatus): void {
    this.status = status;
    this.emit();
  }

  // --- Configuration ---
  load(chunks: Chunk[], startIndex = 0): void {
    this.runToken++;
    this.provider.cancel();
    this.chunks = chunks;
    this.wordCounts = chunks.map((c) => countWords(c.text));
    this.cumulativeWords = [];
    let acc = 0;
    for (const w of this.wordCounts) {
      this.cumulativeWords.push(acc);
      acc += w;
    }
    this.totalWords = acc;
    this.index = clamp(startIndex, 0, Math.max(0, chunks.length - 1));
    this.status = 'idle';
    this.errorRetries = 0;
    this.emit();
  }

  setProvider(provider: TTSProvider): void {
    this.stop();
    this.provider = provider;
  }

  /**
   * Update voice/lang/rate. Applied immediately if currently playing (the
   * current chunk restarts with the new settings); otherwise applied on the
   * next utterance.
   */
  setOptions(patch: Partial<PlaybackOptions>): void {
    this.options = { ...this.options, ...patch };
    if (this.status === 'playing') this.startRun();
    else this.emit();
  }

  // --- Transport ---
  play(): void {
    if (!this.chunks.length) return;
    if (this.status === 'paused') {
      this.resume();
      return;
    }
    if (this.status === 'ended') this.index = 0;
    this.startRun();
  }

  pause(): void {
    if (this.status !== 'playing') return;
    this.setStatus('paused');
    this.provider.pause();
  }

  resume(): void {
    if (this.status !== 'paused') return;
    this.setStatus('playing');
    this.provider.resume();
  }

  toggle(): void {
    if (this.status === 'playing') this.pause();
    else this.play();
  }

  stop(): void {
    this.runToken++;
    this.provider.cancel();
    this.index = 0;
    this.setStatus('idle');
  }

  restart(): void {
    this.index = 0;
    this.startRun();
  }

  seek(index: number): void {
    if (!this.chunks.length) return;
    this.index = clamp(index, 0, this.chunks.length - 1);
    if (this.status === 'playing' || this.status === 'paused') {
      this.startRun();
    } else {
      this.emit();
    }
  }

  next(): void {
    this.seek(this.index + 1);
  }

  prev(): void {
    this.seek(this.index - 1);
  }

  /** Skip by an approximate number of seconds (no real audio clock exists). */
  skipSeconds(deltaSeconds: number): void {
    const avgWords = this.chunks.length ? this.totalWords / this.chunks.length : 1;
    const perChunk = Math.max(1, (avgWords * 60) / (WORDS_PER_MINUTE * this.options.rate));
    const steps = Math.max(1, Math.round(Math.abs(deltaSeconds) / perChunk));
    this.seek(this.index + (deltaSeconds >= 0 ? steps : -steps));
  }

  // --- Internal run loop ---
  private startRun(): void {
    this.provider.cancel();
    void this.run();
  }

  private async run(): Promise<void> {
    const token = ++this.runToken;
    this.setStatus('playing');

    while (this.index < this.chunks.length && token === this.runToken) {
      this.emit(); // publish the current index for highlighting
      const chunk = this.chunks[this.index];
      const outcome = await this.provider.speak({
        text: chunk.text,
        voiceId: this.options.voiceId,
        lang: this.options.lang,
        rate: this.options.rate,
      });

      if (token !== this.runToken) return; // superseded by stop/seek/restart/options

      if (outcome === 'ended') {
        this.errorRetries = 0;
        this.index++;
        continue;
      }
      if (outcome === 'cancelled') {
        return; // paused (parked) or superseded — leave state as-is
      }
      // outcome === 'error': retry once, then skip the offending chunk
      if (this.errorRetries < 1) {
        this.errorRetries++;
        continue;
      }
      this.errorRetries = 0;
      this.index++;
    }

    if (token === this.runToken && this.index >= this.chunks.length) {
      this.index = Math.max(0, this.chunks.length - 1);
      this.setStatus('ended');
    }
  }
}
