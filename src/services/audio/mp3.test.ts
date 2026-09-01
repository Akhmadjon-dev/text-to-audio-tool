import { describe, it, expect } from 'vitest';
import { encodeMp3 } from './mp3';

describe('encodeMp3', () => {
  it('produces a non-empty MP3 with a valid frame sync', () => {
    // 0.1s of a 440Hz sine at 24kHz.
    const sampleRate = 24000;
    const samples = new Float32Array(sampleRate / 10);
    for (let i = 0; i < samples.length; i++) {
      samples[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
    }
    const mp3 = encodeMp3(samples, sampleRate);
    const bytes = new Uint8Array(mp3);
    expect(bytes.length).toBeGreaterThan(0);
    // MP3 frames begin with the 11-bit sync word: first byte 0xFF, next byte 0xE0..0xFF.
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1] & 0xe0).toBe(0xe0);
  });

  it('handles silence without throwing', () => {
    const mp3 = encodeMp3(new Float32Array(2048), 24000);
    expect(mp3.byteLength).toBeGreaterThan(0);
  });
});
