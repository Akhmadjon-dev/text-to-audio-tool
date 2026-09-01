import { describe, it, expect } from 'vitest';
import { splitSentences } from './sentenceSplit';

describe('splitSentences', () => {
  it('splits simple sentences', () => {
    expect(splitSentences('Hello world. How are you? I am fine!')).toEqual([
      'Hello world.',
      'How are you?',
      'I am fine!',
    ]);
  });

  it('does not split on decimal numbers', () => {
    expect(splitSentences('Pi is 3.14 roughly. Yes.')).toEqual(['Pi is 3.14 roughly.', 'Yes.']);
  });

  it('does not split on common abbreviations', () => {
    expect(splitSentences('Dr. Smith went home. He slept.')).toEqual([
      'Dr. Smith went home.',
      'He slept.',
    ]);
  });

  it('does not split on single-letter initials', () => {
    const out = splitSentences('J. R. R. Tolkien wrote books. He was English.');
    expect(out).toEqual(['J. R. R. Tolkien wrote books.', 'He was English.']);
  });

  it('respects paragraph breaks', () => {
    expect(splitSentences('First para.\n\nSecond para.')).toEqual(['First para.', 'Second para.']);
  });

  it('handles trailing text with no terminator', () => {
    expect(splitSentences('A complete one. And an incomplete one')).toEqual([
      'A complete one.',
      'And an incomplete one',
    ]);
  });

  it('keeps closing quotes with the sentence', () => {
    const out = splitSentences('He said "hello." Then he left.');
    expect(out[0]).toContain('hello.');
    expect(out).toHaveLength(2);
  });

  it('returns empty array for blank input', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});
