import { describe, it, expect } from 'vitest';
import { concatFloat32, encodeWav, floatTo16BitPCM } from './wav';

const readString = (view: DataView, offset: number, len: number) =>
  Array.from({ length: len }, (_, i) => String.fromCharCode(view.getUint8(offset + i))).join('');

describe('concatFloat32', () => {
  it('joins chunks in order', () => {
    const out = concatFloat32([new Float32Array([1, 2]), new Float32Array([3])]);
    expect(Array.from(out)).toEqual([1, 2, 3]);
  });
  it('handles empty input', () => {
    expect(concatFloat32([]).length).toBe(0);
  });
});

describe('floatTo16BitPCM', () => {
  it('maps full-scale floats to int16 extremes', () => {
    const pcm = floatTo16BitPCM(new Float32Array([0, 1, -1]));
    expect(pcm[0]).toBe(0);
    expect(pcm[1]).toBe(32767);
    expect(pcm[2]).toBe(-32768);
  });
  it('clamps out-of-range values', () => {
    const pcm = floatTo16BitPCM(new Float32Array([2, -2]));
    expect(pcm[0]).toBe(32767);
    expect(pcm[1]).toBe(-32768);
  });
});

describe('encodeWav', () => {
  it('writes a valid RIFF/WAVE header', () => {
    const buffer = encodeWav(new Float32Array([0, 0.5, -0.5]), 24000);
    const view = new DataView(buffer);
    expect(readString(view, 0, 4)).toBe('RIFF');
    expect(readString(view, 8, 4)).toBe('WAVE');
    expect(readString(view, 12, 4)).toBe('fmt ');
    expect(readString(view, 36, 4)).toBe('data');
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(24000); // sample rate
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
  });

  it('sizes the buffer as 44-byte header + 2 bytes/sample', () => {
    const samples = new Float32Array(100);
    const buffer = encodeWav(samples, 24000);
    expect(buffer.byteLength).toBe(44 + 100 * 2);
    expect(new DataView(buffer).getUint32(40, true)).toBe(200); // data size
  });
});
