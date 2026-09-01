/**
 * Pragmatic sentence splitter. Not linguistically perfect — its only job is to
 * find natural pause boundaries for TTS chunking. Handles common abbreviations,
 * decimals, and single-letter initials so we don't split mid-thought.
 */

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'fig', 'no',
  'vol', 'inc', 'ltd', 'co', 'corp', 'dept', 'gen', 'sen', 'rep', 'gov', 'col',
  'capt', 'sgt', 'lt', 'cmd', 'rev', 'hon', 'pres', 'assn', 'univ', 'approx',
  'appt', 'apt', 'dept', 'est', 'min', 'max', 'e.g', 'i.e', 'a.m', 'p.m',
]);

const TERMINATORS = new Set(['.', '!', '?']);
const CLOSERS = new Set(['"', "'", ')', ']', '”', '’']);
const SENTENCE_START = /[A-Z0-9"'([“‘À-Ü]/;

function isAbbreviationOrDecimal(text: string, dotIndex: number, sentenceStart: number): boolean {
  // Decimal number: digit on both sides of the dot (e.g. "3.14").
  const prev = text[dotIndex - 1] ?? '';
  const next = text[dotIndex + 1] ?? '';
  if (/\d/.test(prev) && /\d/.test(next)) return true;

  // The token ending at the dot.
  const before = text.slice(sentenceStart, dotIndex);
  const match = before.match(/(\S+)$/);
  if (!match) return false;
  const word = match[1].toLowerCase().replace(/[^a-z.]/g, '');

  // Single-letter initial, e.g. "J. R. R. Tolkien".
  if (word.length === 1) return true;
  if (ABBREVIATIONS.has(word) || ABBREVIATIONS.has(word.replace(/\.$/, ''))) return true;
  return false;
}

function splitParagraph(p: string): string[] {
  const out: string[] = [];
  let start = 0;

  for (let i = 0; i < p.length; i++) {
    if (!TERMINATORS.has(p[i])) continue;

    // Absorb consecutive terminators ("?!", "...") and trailing closers.
    let j = i;
    while (j + 1 < p.length && TERMINATORS.has(p[j + 1])) j++;
    while (j + 1 < p.length && CLOSERS.has(p[j + 1])) j++;

    // End of paragraph.
    if (j + 1 >= p.length) {
      out.push(p.slice(start, j + 1).trim());
      start = j + 1;
      break;
    }

    // Must be followed by whitespace to count as a boundary.
    if (!/\s/.test(p[j + 1])) {
      i = j;
      continue;
    }

    // Skip false positives (abbreviations, decimals, initials).
    if (p[i] === '.' && isAbbreviationOrDecimal(p, i, start)) {
      i = j;
      continue;
    }

    // Peek at the next non-space char — real sentences start with a capital,
    // digit, or opening quote/bracket.
    let k = j + 1;
    while (k < p.length && /\s/.test(p[k])) k++;
    if (k < p.length && SENTENCE_START.test(p[k])) {
      out.push(p.slice(start, j + 1).trim());
      start = k;
      i = k - 1;
    } else {
      i = j;
    }
  }

  if (start < p.length) {
    const tail = p.slice(start).trim();
    if (tail) out.push(tail);
  }
  return out;
}

/** Split cleaned text into sentences, respecting paragraph breaks. */
export function splitSentences(text: string): string[] {
  const result: string[] = [];
  for (const para of text.split(/\n{2,}/)) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    result.push(...splitParagraph(trimmed));
  }
  return result.filter(Boolean);
}
