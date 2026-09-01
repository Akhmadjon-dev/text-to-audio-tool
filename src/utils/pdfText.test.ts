import { describe, it, expect } from 'vitest';
import { isPageNumberLine, stripHeadersFooters } from './pdfText';

describe('isPageNumberLine', () => {
  it('detects bare numbers', () => {
    expect(isPageNumberLine('12')).toBe(true);
    expect(isPageNumberLine('  7  ')).toBe(true);
  });
  it('detects decorated and "Page N" forms', () => {
    expect(isPageNumberLine('- 12 -')).toBe(true);
    expect(isPageNumberLine('Page 3 of 10')).toBe(true);
    expect(isPageNumberLine('3/10')).toBe(true);
  });
  it('does not flag normal text', () => {
    expect(isPageNumberLine('Chapter 12: The End')).toBe(false);
    expect(isPageNumberLine('')).toBe(false);
  });
});

describe('stripHeadersFooters', () => {
  it('removes a header repeated across pages', () => {
    const pages = [
      'My Book Title\nReal content of page one.',
      'My Book Title\nReal content of page two.',
      'My Book Title\nReal content of page three.',
    ];
    const out = stripHeadersFooters(pages);
    expect(out.join('\n')).not.toContain('My Book Title');
    expect(out[0]).toContain('Real content of page one.');
  });

  it('removes footers that are page numbers', () => {
    const pages = ['Body one.\n1', 'Body two.\n2', 'Body three.\n3'];
    const out = stripHeadersFooters(pages);
    expect(out.join('\n')).not.toMatch(/^\d$/m);
    expect(out[1]).toContain('Body two.');
  });

  it('keeps content that only looks similar but does not repeat enough', () => {
    const pages = ['Unique header A\nBody one.', 'Different header B\nBody two.'];
    const out = stripHeadersFooters(pages);
    expect(out[0]).toContain('Unique header A');
  });

  it('returns input unchanged for a single page (cannot detect repetition)', () => {
    const out = stripHeadersFooters(['Title\nSome body text.']);
    expect(out[0]).toContain('Title');
    expect(out[0]).toContain('Some body text.');
  });
});
