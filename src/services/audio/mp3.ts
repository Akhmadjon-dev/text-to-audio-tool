import { Mp3Encoder } from '@breezystack/lamejs';
import { floatTo16BitPCM } from './wav';

/**
 * Encode mono Float32 PCM as an MP3 (ArrayBuffer). Much smaller than WAV —
 * the practical format for downloading long audiobooks.
 */
export function encodeMp3(samples: Float32Array, sampleRate: number, kbps = 128): ArrayBuffer {
  const pcm = floatTo16BitPCM(samples);
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const blockSize = 1152; // MP3 frame size
  const parts: Uint8Array[] = [];

  for (let i = 0; i < pcm.length; i += blockSize) {
    const block = pcm.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(block);
    if (encoded.length > 0) parts.push(new Uint8Array(encoded));
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(new Uint8Array(tail));

  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out.buffer;
}
