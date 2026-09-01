import { describe, it, expect, beforeEach } from 'vitest';
import { PlaybackController } from './PlaybackController';
import type { Chunk } from '@/utils/chunker';
import type { SpeakOutcome, TTSProvider, TTSSpeakParams } from '@/services/tts/types';

/** A provider whose speak() stays pending until the test flushes it. */
class FakeProvider implements TTSProvider {
  readonly id = 'browser' as const;
  readonly name = 'fake';
  readonly capabilities = { canExport: false, wordBoundary: false, requiresDownload: false };

  spoken: string[] = [];
  paused = 0;
  resumed = 0;
  cancelled = 0;
  private resolveCurrent: ((o: SpeakOutcome) => void) | null = null;

  isSupported() {
    return true;
  }
  loadVoices() {
    return Promise.resolve([]);
  }
  speak(params: TTSSpeakParams): Promise<SpeakOutcome> {
    this.spoken.push(params.text);
    return new Promise((resolve) => {
      this.resolveCurrent = resolve;
    });
  }
  pause() {
    this.paused++;
  }
  resume() {
    this.resumed++;
  }
  cancel() {
    this.cancelled++;
    const r = this.resolveCurrent;
    this.resolveCurrent = null;
    r?.('cancelled');
  }
  /** Resolve the in-flight utterance as if it finished (or errored). */
  flush(outcome: SpeakOutcome = 'ended') {
    const r = this.resolveCurrent;
    this.resolveCurrent = null;
    r?.(outcome);
  }
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const chunks = (...texts: string[]): Chunk[] => texts.map((text, index) => ({ index, text }));

describe('PlaybackController', () => {
  let provider: FakeProvider;
  let controller: PlaybackController;

  beforeEach(() => {
    provider = new FakeProvider();
    controller = new PlaybackController(provider, { voiceId: null, lang: null, rate: 1 });
  });

  it('speaks chunks in order, auto-advancing', async () => {
    controller.load(chunks('c0', 'c1', 'c2'));
    controller.play();
    await tick();
    expect(provider.spoken).toEqual(['c0']);

    provider.flush('ended');
    await tick();
    expect(provider.spoken).toEqual(['c0', 'c1']);

    provider.flush('ended');
    await tick();
    expect(provider.spoken).toEqual(['c0', 'c1', 'c2']);

    provider.flush('ended');
    await tick();
    expect(controller.getState().status).toBe('ended');
  });

  it('tracks the current index for highlighting', async () => {
    const seen: number[] = [];
    controller.load(chunks('a', 'b'));
    controller.subscribe((s) => seen.push(s.currentIndex));
    controller.play();
    await tick();
    provider.flush('ended');
    await tick();
    expect(seen).toContain(0);
    expect(seen).toContain(1);
  });

  it('retries a failing chunk once, then skips it', async () => {
    controller.load(chunks('only'));
    controller.play();
    await tick();
    expect(provider.spoken).toEqual(['only']);

    provider.flush('error'); // first failure -> retry
    await tick();
    expect(provider.spoken).toEqual(['only', 'only']);

    provider.flush('error'); // second failure -> skip; queue exhausted
    await tick();
    expect(controller.getState().status).toBe('ended');
  });

  it('pauses and resumes without losing position', async () => {
    controller.load(chunks('c0', 'c1'));
    controller.play();
    await tick();

    controller.pause();
    expect(controller.getState().status).toBe('paused');
    expect(provider.paused).toBe(1);

    controller.resume();
    expect(controller.getState().status).toBe('playing');
    expect(provider.resumed).toBe(1);

    provider.flush('ended');
    await tick();
    expect(provider.spoken).toEqual(['c0', 'c1']);
  });

  it('seeks to a chunk and restarts playback there', async () => {
    controller.load(chunks('c0', 'c1', 'c2'));
    controller.play();
    await tick();

    controller.seek(2);
    await tick();
    expect(controller.getState().currentIndex).toBe(2);
    expect(provider.spoken[provider.spoken.length - 1]).toBe('c2');
  });

  it('stop resets to idle at the beginning', async () => {
    controller.load(chunks('c0', 'c1'));
    controller.play();
    await tick();
    controller.stop();
    expect(controller.getState().status).toBe('idle');
    expect(controller.getState().currentIndex).toBe(0);
  });

  it('skipSeconds moves forward at least one chunk and clamps at the start', async () => {
    controller.load(chunks('c0', 'c1', 'c2', 'c3'));
    controller.skipSeconds(30);
    expect(controller.getState().currentIndex).toBeGreaterThan(0);
    controller.seek(0);
    controller.skipSeconds(-30);
    expect(controller.getState().currentIndex).toBe(0);
  });

  it('restarting options while playing re-speaks the current chunk', async () => {
    controller.load(chunks('c0', 'c1'));
    controller.play();
    await tick();
    const before = provider.spoken.length;
    controller.setOptions({ rate: 1.5 });
    await tick();
    expect(provider.spoken.length).toBeGreaterThan(before);
    expect(provider.spoken[provider.spoken.length - 1]).toBe('c0');
  });
});
