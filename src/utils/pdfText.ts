/**
 * Pure helpers for cleaning text extracted from a PDF: detecting page numbers
 * and stripping repeated running headers/footers. Kept free of PDF.js so they
 * can be unit-tested with plain strings.
 */

/** True if a line is just a page number ("12", "- 12 -", "Page 3 of 10", "3/10"). */
export function isPageNumberLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return (
    /^\d{1,4}$/.test(t) ||
    /^[-–—]\s*\d{1,4}\s*[-–—]$/.test(t) ||
    /^page\s+\d+(\s*(of|\/)\s*\d+)?$/i.test(t) ||
    /^\d+\s*\/\s*\d+$/.test(t)
  );
}

function normalize(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ');
}

function firstNonEmpty(lines: string[]): number {
  return lines.findIndex((l) => l.trim().length > 0);
}
function lastNonEmpty(lines: string[]): number {
  for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim().length > 0) return i;
  return -1;
}

/**
 * Remove running headers/footers (the same top/bottom line repeated across many
 * pages) and standalone page-number lines. Each input string is one page's text
 * (lines separated by "\n"). Returns cleaned page texts.
 */
export function stripHeadersFooters(pages: string[]): string[] {
  const n = pages.length;
  if (n === 0) return pages;

  const linesPerPage = pages.map((p) => p.split('\n'));
  const threshold = Math.max(2, Math.ceil(n * 0.6));

  const tally = (pick: (lines: string[]) => number) => {
    const counts = new Map<string, number>();
    for (const lines of linesPerPage) {
      const idx = pick(lines);
      if (idx < 0) continue;
      const key = normalize(lines[idx]);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  };

  const headerCounts = tally(firstNonEmpty);
  const footerCounts = tally(lastNonEmpty);
  const isRepeating = (counts: Map<string, number>, line: string) =>
    (counts.get(normalize(line)) ?? 0) >= threshold;

  return linesPerPage.map((lines) => {
    const out = [...lines];
    const fi = firstNonEmpty(out);
    if (fi >= 0 && isRepeating(headerCounts, out[fi])) out[fi] = '';
    const li = lastNonEmpty(out);
    if (li >= 0 && li !== fi && isRepeating(footerCounts, out[li])) out[li] = '';
    return out
      .filter((line) => !isPageNumberLine(line))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  });
}
