/** Core shared types for Local Reader. */

export type SourceKind = 'text' | 'pdf';

export interface DocumentRecord {
  id: string;
  title: string;
  source: SourceKind;
  /** Cleaned, reader-ready plain text. */
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReadingProgress {
  /** Matches DocumentRecord.id */
  docId: string;
  /** Index into the chunk queue for the document. */
  chunkIndex: number;
  /** Character offset within the full document text (approx position). */
  charOffset: number;
  updatedAt: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type TTSEngine = 'browser' | 'kokoro';

export interface Settings {
  engine: TTSEngine;
  voiceId: string | null;
  lang: string | null;
  rate: number; // 0.5 – 3
  skipSeconds: number;
  theme: ThemeMode;
  highlightSentence: boolean;
  fontScale: number;
}

export const DEFAULT_SETTINGS: Settings = {
  engine: 'browser',
  voiceId: null,
  lang: null,
  rate: 1,
  skipSeconds: 10,
  theme: 'system',
  highlightSentence: true,
  fontScale: 1,
};
