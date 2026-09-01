/**
 * Static catalog of Kokoro-82M v1.0 voices, so the voice picker works without
 * downloading the model. The model is fetched only when playback/export starts.
 */
export interface KokoroVoiceDef {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female';
}

export const DEFAULT_KOKORO_VOICE = 'af_heart';

export const KOKORO_VOICES: KokoroVoiceDef[] = [
  // American English — female
  { id: 'af_heart', name: 'Heart', lang: 'en-US', gender: 'female' },
  { id: 'af_bella', name: 'Bella', lang: 'en-US', gender: 'female' },
  { id: 'af_nicole', name: 'Nicole', lang: 'en-US', gender: 'female' },
  { id: 'af_aoede', name: 'Aoede', lang: 'en-US', gender: 'female' },
  { id: 'af_kore', name: 'Kore', lang: 'en-US', gender: 'female' },
  { id: 'af_sarah', name: 'Sarah', lang: 'en-US', gender: 'female' },
  { id: 'af_nova', name: 'Nova', lang: 'en-US', gender: 'female' },
  { id: 'af_sky', name: 'Sky', lang: 'en-US', gender: 'female' },
  // American English — male
  { id: 'am_michael', name: 'Michael', lang: 'en-US', gender: 'male' },
  { id: 'am_fenrir', name: 'Fenrir', lang: 'en-US', gender: 'male' },
  { id: 'am_puck', name: 'Puck', lang: 'en-US', gender: 'male' },
  { id: 'am_echo', name: 'Echo', lang: 'en-US', gender: 'male' },
  { id: 'am_eric', name: 'Eric', lang: 'en-US', gender: 'male' },
  { id: 'am_liam', name: 'Liam', lang: 'en-US', gender: 'male' },
  { id: 'am_onyx', name: 'Onyx', lang: 'en-US', gender: 'male' },
  { id: 'am_adam', name: 'Adam', lang: 'en-US', gender: 'male' },
  // British English
  { id: 'bf_emma', name: 'Emma', lang: 'en-GB', gender: 'female' },
  { id: 'bf_isabella', name: 'Isabella', lang: 'en-GB', gender: 'female' },
  { id: 'bf_alice', name: 'Alice', lang: 'en-GB', gender: 'female' },
  { id: 'bf_lily', name: 'Lily', lang: 'en-GB', gender: 'female' },
  { id: 'bm_george', name: 'George', lang: 'en-GB', gender: 'male' },
  { id: 'bm_daniel', name: 'Daniel', lang: 'en-GB', gender: 'male' },
  { id: 'bm_fable', name: 'Fable', lang: 'en-GB', gender: 'male' },
  { id: 'bm_lewis', name: 'Lewis', lang: 'en-GB', gender: 'male' },
  // Other languages (representative)
  { id: 'jf_alpha', name: 'Alpha', lang: 'ja-JP', gender: 'female' },
  { id: 'jm_kumo', name: 'Kumo', lang: 'ja-JP', gender: 'male' },
  { id: 'zf_xiaobei', name: 'Xiaobei', lang: 'zh-CN', gender: 'female' },
  { id: 'zm_yunjian', name: 'Yunjian', lang: 'zh-CN', gender: 'male' },
  { id: 'ef_dora', name: 'Dora', lang: 'es-ES', gender: 'female' },
  { id: 'em_alex', name: 'Alex', lang: 'es-ES', gender: 'male' },
  { id: 'ff_siwis', name: 'Siwis', lang: 'fr-FR', gender: 'female' },
  { id: 'if_sara', name: 'Sara', lang: 'it-IT', gender: 'female' },
  { id: 'im_nicola', name: 'Nicola', lang: 'it-IT', gender: 'male' },
  { id: 'pf_dora', name: 'Dora', lang: 'pt-BR', gender: 'female' },
  { id: 'pm_alex', name: 'Alex', lang: 'pt-BR', gender: 'male' },
  { id: 'hf_alpha', name: 'Alpha', lang: 'hi-IN', gender: 'female' },
  { id: 'hm_omega', name: 'Omega', lang: 'hi-IN', gender: 'male' },
];

export function isKokoroVoice(id: string | null): boolean {
  return id !== null && KOKORO_VOICES.some((v) => v.id === id);
}
