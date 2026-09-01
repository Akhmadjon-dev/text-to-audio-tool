import { describe, it, expect } from 'vitest';
import { cleanText, countWords } from './textClean';

describe('cleanText', () => {
  it('returns empty string for empty input', () => {
    expect(cleanText('')).toBe('');
  });

  it('joins soft-wrapped lines within a paragraph', () => {
    const input = 'This is a line\nthat was soft wrapped.';
    expect(cleanText(input)).toBe('This is a line that was soft wrapped.');
  });

  it('preserves paragraph breaks', () => {
    const input = 'First paragraph.\n\nSecond paragraph.';
    expect(cleanText(input)).toBe('First paragraph.\n\nSecond paragraph.');
  });

  it('collapses 3+ newlines into a single paragraph break', () => {
    expect(cleanText('A.\n\n\n\nB.')).toBe('A.\n\nB.');
  });

  it('repairs hyphenated line breaks', () => {
    expect(cleanText('exam-\nple word')).toBe('example word');
  });

  it('normalizes non-breaking spaces and collapses runs of spaces', () => {
    const input = 'a  b   c';
    expect(cleanText(input)).toBe('a b c');
  });

  it('handles CRLF line endings', () => {
    expect(cleanText('a\r\nb')).toBe('a b');
  });

  it('trims leading/trailing whitespace', () => {
    expect(cleanText('   hello   ')).toBe('hello');
  });
});

describe('countWords', () => {
  it('counts words separated by whitespace', () => {
    expect(countWords('one two three')).toBe(3);
  });
  it('returns 0 for empty/blank input', () => {
    expect(countWords('   ')).toBe(0);
  });
  it('ignores extra whitespace', () => {
    expect(countWords('  a   b  ')).toBe(2);
  });
});
