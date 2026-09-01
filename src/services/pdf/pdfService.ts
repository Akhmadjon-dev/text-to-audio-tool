import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { cleanText } from '@/utils/textClean';
import { stripHeadersFooters } from '@/utils/pdfText';

// PDF.js runs its parsing in this worker (offloads the main thread). Bundled by
// Vite and cached by the service worker, so extraction works fully offline.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB soft cap

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  pagesWithText: number;
}

export class ScannedPdfError extends Error {
  constructor() {
    super('This PDF has no extractable text — it looks scanned or image-only. OCR is required.');
    this.name = 'ScannedPdfError';
  }
}

/** Validate a file before processing. Returns an error message, or null if OK. */
export function validatePdf(file: File): string | null {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (!isPdf) return 'That doesn’t look like a PDF. Please choose a .pdf file.';
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_PDF_BYTES) {
    return `This PDF is larger than ${Math.round(MAX_PDF_BYTES / 1024 / 1024)} MB. Try a smaller file.`;
  }
  return null;
}

interface Line {
  y: number;
  height: number;
  text: string;
}

/** Turn a page's text items into ordered lines using their geometry. */
function itemsToLines(items: TextItem[]): Line[] {
  const glyphs = items
    .filter((it) => typeof it.str === 'string' && it.str.length > 0)
    .map((it) => ({
      str: it.str,
      x: it.transform[4],
      y: it.transform[5],
      w: it.width,
      h: it.height || Math.abs(it.transform[3]) || 12,
    }));
  if (glyphs.length === 0) return [];

  glyphs.sort((a, b) => b.y - a.y || a.x - b.x);
  const medianH = glyphs.map((g) => g.h).sort((a, b) => a - b)[Math.floor(glyphs.length / 2)] || 12;
  const yTolerance = Math.max(2, medianH * 0.5);

  const lines: Line[] = [];
  let current: { y: number; height: number; parts: { x: number; w: number; str: string }[] } | null =
    null;

  for (const g of glyphs) {
    if (!current || Math.abs(g.y - current.y) > yTolerance) {
      if (current) lines.push(finalizeLine(current));
      current = { y: g.y, height: g.h, parts: [{ x: g.x, w: g.w, str: g.str }] };
    } else {
      current.parts.push({ x: g.x, w: g.w, str: g.str });
    }
  }
  if (current) lines.push(finalizeLine(current));
  return lines;
}

function finalizeLine(line: {
  y: number;
  height: number;
  parts: { x: number; w: number; str: string }[];
}): Line {
  const parts = line.parts.sort((a, b) => a.x - b.x);
  let text = '';
  let prevEnd = -Infinity;
  const spaceGap = line.height * 0.25;
  for (const p of parts) {
    if (text && p.x - prevEnd > spaceGap && !text.endsWith(' ') && !p.str.startsWith(' ')) {
      text += ' ';
    }
    text += p.str;
    prevEnd = p.x + p.w;
  }
  return { y: line.y, height: line.height, text: text.trim() };
}

/** Join lines into text, inserting paragraph breaks at large vertical gaps. */
function linesToText(lines: Line[]): string {
  const out: string[] = [];
  let prevY: number | null = null;
  let prevH = 12;
  for (const line of lines) {
    if (!line.text) continue;
    if (prevY !== null) {
      const gap = prevY - line.y;
      out.push(gap > prevH * 1.6 ? '\n\n' : '\n');
    }
    out.push(line.text);
    prevY = line.y;
    prevH = line.height;
  }
  return out.join('');
}

/**
 * Extract readable text from a PDF, page by page. Reports progress and detects
 * scanned/image-only documents (no extractable text).
 */
export async function extractPdf(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<PdfExtractResult> {
  const data = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  const pageTexts: string[] = [];
  let pagesWithText = 0;

  try {
    for (let n = 1; n <= total; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      const items = content.items.filter((i): i is TextItem => 'str' in i);
      const lines = itemsToLines(items);
      const text = linesToText(lines);
      if (text.trim().length > 0) pagesWithText++;
      pageTexts.push(text);
      page.cleanup();
      onProgress?.(n, total);
      // Yield to the event loop so the UI stays responsive on large PDFs.
      await Promise.resolve();
    }
  } finally {
    await loadingTask.destroy();
  }

  if (pagesWithText === 0) throw new ScannedPdfError();

  const stripped = stripHeadersFooters(pageTexts);
  const combined = cleanText(stripped.join('\n\n'));

  return { text: combined, pageCount: total, pagesWithText };
}
