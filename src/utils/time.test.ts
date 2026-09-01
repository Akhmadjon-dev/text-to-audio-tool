import { describe, it, expect } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  it('formats seconds under a minute', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(45)).toBe('0:45');
  });
  it('formats minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(605)).toBe('10:05');
  });
  it('formats hours', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });
  it('handles zero and invalid input', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
