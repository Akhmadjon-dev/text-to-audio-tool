import { usePlayback } from '@/hooks/usePlayback';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ReaderView } from './ReaderView';
import { PlayerBar } from '@/components/player/PlayerBar';
import type { DocumentRecord } from '@/types';
import type { Chunk } from '@/utils/chunker';

interface ReaderScreenProps {
  document: DocumentRecord;
  chunks: Chunk[];
}

/** The reading + listening view. Owns the single playback controller. */
export function ReaderScreen({ document, chunks }: ReaderScreenProps) {
  const playback = usePlayback();
  const highlight = useSettingsStore((s) => s.highlightSentence);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const skipSeconds = useSettingsStore((s) => s.skipSeconds);

  const isActive = playback.status === 'playing' || playback.status === 'paused';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <h2 className="mx-auto mb-4 max-w-2xl text-xl font-bold text-slate-900 dark:text-slate-100">
          {document.title}
        </h2>
        <ReaderView
          chunks={chunks}
          currentIndex={playback.currentIndex}
          isActive={isActive}
          highlight={highlight}
          fontScale={fontScale}
          onSeek={playback.seek}
        />
      </div>
      <PlayerBar playback={playback} skipSeconds={skipSeconds} />
    </div>
  );
}
