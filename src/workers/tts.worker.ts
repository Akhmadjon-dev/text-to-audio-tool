/// <reference lib="webworker" />
import { KokoroTTS } from 'kokoro-js';
import { env } from '@huggingface/transformers';
import type {
  KokoroInbound,
  KokoroOutbound,
  KokoroVoiceInfo,
} from '@/services/tts/kokoroMessages';

// Kokoro-82M neural TTS runs entirely in this worker (model download, caching by
// transformers.js, and inference) so the UI thread stays responsive.

// Always fetch the model from the Hugging Face hub (cached by transformers.js in
// Cache Storage after first download) rather than expecting a local copy.
env.allowLocalModels = false;

let tts: KokoroTTS | null = null;

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(msg: KokoroOutbound, transfer?: Transferable[]) {
  ctx.postMessage(msg, transfer ?? []);
}

interface ProgressInfo {
  status?: string;
  loaded?: number;
  total?: number;
}

ctx.onmessage = async (e: MessageEvent<KokoroInbound>) => {
  const msg = e.data;

  if (msg.type === 'load') {
    if (tts) {
      post({ type: 'ready', voices: mapVoices(tts) });
      return;
    }
    try {
      tts = await KokoroTTS.from_pretrained(msg.modelId, {
        dtype: msg.dtype,
        device: msg.device,
        progress_callback: (p: ProgressInfo) => {
          if (typeof p.loaded === 'number') {
            post({
              type: 'progress',
              loaded: p.loaded,
              total: p.total ?? 0,
              status: p.status ?? 'downloading',
            });
          }
        },
      } as Parameters<typeof KokoroTTS.from_pretrained>[1]);
      post({ type: 'ready', voices: mapVoices(tts) });
    } catch (err) {
      post({ type: 'error', message: describeError(err) });
    }
    return;
  }

  if (msg.type === 'generate') {
    if (!tts) {
      post({ type: 'generate-error', id: msg.id, message: 'Voice model not loaded yet.' });
      return;
    }
    try {
      const options = { voice: msg.voice, speed: msg.speed } as Parameters<
        KokoroTTS['generate']
      >[1];
      const audio = await tts.generate(msg.text, options);
      const samples = audio.audio;
      post({ type: 'generated', id: msg.id, audio: samples, sampleRate: audio.sampling_rate }, [
        samples.buffer,
      ]);
    } catch (err) {
      post({ type: 'generate-error', id: msg.id, message: describeError(err) });
    }
  }
};

function mapVoices(model: KokoroTTS): KokoroVoiceInfo[] {
  const voices = model.voices as Record<
    string,
    { name?: string; language?: string; gender?: string }
  >;
  return Object.entries(voices).map(([id, v]) => ({
    id,
    name: v.name ?? id,
    language: v.language ?? 'en',
    gender: v.gender ?? '',
  }));
}

function describeError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
