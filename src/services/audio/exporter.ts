import { encodeWav } from './wav';
import { encodeMp3 } from './mp3';

export type ExportFormat = 'wav' | 'mp3';

/** Wrap generated PCM as a downloadable Blob in the chosen format. */
export function audioToBlob(
  samples: Float32Array,
  sampleRate: number,
  format: ExportFormat,
): Blob {
  if (format === 'mp3') {
    return new Blob([encodeMp3(samples, sampleRate)], { type: 'audio/mpeg' });
  }
  return new Blob([encodeWav(samples, sampleRate)], { type: 'audio/wav' });
}

/** Make a filesystem-safe filename from a document title. */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .replace(/[^a-z0-9\-_. ]/gi, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  // Require at least one alphanumeric character, else fall back.
  return /[a-z0-9]/i.test(cleaned) ? cleaned : 'audio';
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
