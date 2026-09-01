import { useCallback, useState } from 'react';
import { kokoroProvider } from '@/services/tts';
import { concatFloat32 } from '@/services/audio/wav';
import { audioToBlob, downloadBlob, sanitizeFilename, type ExportFormat } from '@/services/audio/exporter';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface ExportState {
  state: 'idle' | 'exporting' | 'error';
  done: number;
  total: number;
  message?: string;
}

/**
 * Export the current document to a downloadable audio file using the Kokoro
 * neural engine (the only engine that exposes an audio buffer). Generates each
 * chunk, concatenates, encodes to WAV/MP3, and triggers a download.
 */
export function useAudioExport() {
  const [status, setStatus] = useState<ExportState>({ state: 'idle', done: 0, total: 0 });
  const chunks = useDocumentStore((s) => s.chunks);
  const title = useDocumentStore((s) => s.document?.title ?? 'audio');
  const voiceId = useSettingsStore((s) => s.voiceId);
  const rate = useSettingsStore((s) => s.rate);

  const exportAudio = useCallback(
    async (format: ExportFormat) => {
      if (chunks.length === 0) return;
      setStatus({ state: 'exporting', done: 0, total: chunks.length });
      try {
        await kokoroProvider.ensureLoaded();
        const parts: Float32Array[] = [];
        let sampleRate = 24000;
        for (let i = 0; i < chunks.length; i++) {
          const gen = await kokoroProvider.generate(chunks[i].text, voiceId, rate);
          parts.push(gen.audio);
          sampleRate = gen.sampleRate;
          setStatus({ state: 'exporting', done: i + 1, total: chunks.length });
        }
        const blob = audioToBlob(concatFloat32(parts), sampleRate, format);
        downloadBlob(blob, `${sanitizeFilename(title)}.${format}`);
        setStatus({ state: 'idle', done: 0, total: 0 });
      } catch {
        setStatus({ state: 'error', done: 0, total: 0, message: 'Export failed. Please try again.' });
      }
    },
    [chunks, title, voiceId, rate],
  );

  const reset = useCallback(() => setStatus({ state: 'idle', done: 0, total: 0 }), []);

  return { ...status, exportAudio, reset };
}
