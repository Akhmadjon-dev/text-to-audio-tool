import { describe, it, expect } from 'vitest';
import { chunkText } from './chunker';

describe('chunkText', () => {
  it('returns empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
  });

  it('keeps a short document in a single chunk', () => {
    const chunks = chunkText('One. Two. Three.');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('One. Two. Three.');
  });

  it('assigns sequential indices', () => {
    const chunks = chunkText('One. Two. Three.', 8);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });

  it('never exceeds the max char limit (for normal sentences)', () => {
    const sentences = Array.from({ length: 20 }, (_, i) => `This is sentence number ${i}.`).join(
      ' ',
    );
    const max = 60;
    const chunks = chunkText(sentences, max);
    for (const c of chunks) expect(c.text.length).toBeLessThanOrEqual(max);
  });

  it('groups multiple short sentences into one chunk when they fit', () => {
    const chunks = chunkText('A. B. C. D.', 240);
    expect(chunks).toHaveLength(1);
  });

  it('splits a very long single sentence at a space, not mid-word', () => {
    const longSentence = `${'word '.repeat(100).trim()}.`;
    const chunks = chunkText(longSentence, 50);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      // no chunk should start or end by cutting through "word"
      expect(c.text).not.toMatch(/\bwor$/);
      expect(c.text).not.toMatch(/^ord\b/);
    }
  });

  it('preserves overall word order', () => {
    const input = 'Alpha one. Bravo two. Charlie three. Delta four.';
    const chunks = chunkText(input, 20);
    const rejoined = chunks.map((c) => c.text).join(' ');
    expect(rejoined).toContain('Alpha');
    const alphaIdx = rejoined.indexOf('Alpha');
    const deltaIdx = rejoined.indexOf('Delta');
    expect(alphaIdx).toBeLessThan(deltaIdx);
  });
});
