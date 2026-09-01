/**
 * Normalize raw text (pasted or extracted from a PDF) into clean, readable
 * prose suitable for TTS. Preserves paragraph breaks; joins soft-wrapped lines;
 * repairs hyphenated line breaks; collapses redundant whitespace.
 */

// Unicode whitespace to normalize to a regular space: NBSP, the en/em/thin/hair
// space range, zero-width space, narrow/medium math spaces, ideographic space, BOM.
// Built from code points so the source stays pure-ASCII and can't be mangled.
const SPACE_CODE_POINTS = [
  0x00a0, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
  0x200b, 0x202f, 0x205f, 0x3000, 0xfeff,
];
const UNICODE_SPACES = new RegExp(
  '[' + SPACE_CODE_POINTS.map((c) => String.fromCharCode(c)).join('') + ']',
  'g',
);
// Private-use placeholder (cannot occur in real text) to protect paragraph breaks.
const PARA = String.fromCharCode(0xe000);

export function cleanText(raw: string): string {
  if (!raw) return '';

  let t = raw.replace(/\r\n?/g, '\n');

  // Normalize unicode spaces to a regular space.
  t = t.replace(UNICODE_SPACES, ' ');

  // Repair hyphenated line breaks: "exam-\nple" -> "example".
  t = t.replace(/([A-Za-zÀ-ÿ])-\n([a-zà-ÿ])/g, '$1$2');

  // Protect paragraph breaks (2+ newlines), collapse soft-wrap single newlines
  // into spaces, then restore the paragraph breaks.
  t = t.replace(/\n{2,}/g, PARA);
  t = t.replace(/\n+/g, ' ');
  t = t.split(PARA).join('\n\n');

  // Collapse runs of spaces/tabs.
  t = t.replace(/[ \t]{2,}/g, ' ');

  // Trim each line.
  t = t
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

  // Collapse 3+ newlines down to a single paragraph break.
  t = t.replace(/\n{3,}/g, '\n\n');

  return t.trim();
}

/** Rough word count used for time estimates and UI. */
export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}
