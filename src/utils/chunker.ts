import { splitSentences } from './sentenceSplit';

export interface Chunk {
  /** Position in the queue. */
  index: number;
  /** Text spoken for this chunk (one or more whole sentences). */
  text: string;
}

/** Default max characters per chunk — safely under Web Speech engine limits. */
export const DEFAULT_MAX_CHARS = 240;

/**
 * Break a very long single sentence into speech-safe pieces, preferring clause
 * punctuation, then spaces, never mid-word (unless a single "word" is itself
 * longer than the limit).
 */
function splitLongSentence(sentence: string, maxChars: number): string[] {
  const parts: string[] = [];
  let rest = sentence.trim();

  while (rest.length > maxChars) {
    let cut = -1;
    for (const punct of [';', ':', ',', '—', '-']) {
      const idx = rest.lastIndexOf(punct + ' ', maxChars);
      if (idx > cut) cut = idx + 1;
    }
    if (cut <= 0) cut = rest.lastIndexOf(' ', maxChars);
    if (cut <= 0) cut = maxChars; // no break point — hard cut a very long token

    parts.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) parts.push(rest);
  return parts;
}

/**
 * Group sentences into ordered, speech-safe chunks. Keeps whole sentences
 * together where possible; splits only sentences that exceed the limit.
 */
export function chunkText(text: string, maxChars = DEFAULT_MAX_CHARS): Chunk[] {
  const sentences = splitSentences(text);
  const raw: string[] = [];
  let current = '';

  const flush = () => {
    if (current) {
      raw.push(current);
      current = '';
    }
  };

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    if (s.length > maxChars) {
      flush();
      raw.push(...splitLongSentence(s, maxChars));
      continue;
    }

    if (current && current.length + 1 + s.length > maxChars) {
      flush();
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  flush();

  return raw.map((chunkText, index) => ({ index, text: chunkText }));
}
