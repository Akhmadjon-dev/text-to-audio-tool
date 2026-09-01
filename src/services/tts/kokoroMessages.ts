export type KokoroDtype = 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16';
export type KokoroDevice = 'wasm' | 'webgpu';

export interface KokoroVoiceInfo {
  id: string;
  name: string;
  language: string;
  gender: string;
}

export type KokoroInbound =
  | { type: 'load'; modelId: string; dtype: KokoroDtype; device: KokoroDevice }
  | { type: 'generate'; id: number; text: string; voice: string; speed: number };

export type KokoroOutbound =
  | { type: 'progress'; loaded: number; total: number; status: string }
  | { type: 'ready'; voices: KokoroVoiceInfo[] }
  | { type: 'error'; message: string }
  | { type: 'generated'; id: number; audio: Float32Array; sampleRate: number }
  | { type: 'generate-error'; id: number; message: string };
