import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from './exporter';

describe('sanitizeFilename', () => {
  it('keeps safe characters', () => {
    expect(sanitizeFilename('My Book 1.0')).toBe('My Book 1.0');
  });
  it('replaces unsafe characters', () => {
    expect(sanitizeFilename('a/b:c*?')).toBe('a_b_c__');
  });
  it('falls back when empty', () => {
    expect(sanitizeFilename('///')).toBe('audio');
    expect(sanitizeFilename('')).toBe('audio');
  });
  it('truncates very long names', () => {
    expect(sanitizeFilename('x'.repeat(200)).length).toBeLessThanOrEqual(80);
  });
});
