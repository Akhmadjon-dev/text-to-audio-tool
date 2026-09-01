import { useEffect, useRef } from 'react';
import type { Chunk } from '@/utils/chunker';

interface ReaderViewProps {
  chunks: Chunk[];
  currentIndex: number;
  isActive: boolean;
  highlight: boolean;
  fontScale: number;
  onSeek: (index: number) => void;
}

/**
 * Renders the document as a flow of speech chunks. The chunk currently being
 * spoken is highlighted (sentence/paragraph-level — honest to what the engine
 * actually reads). Clicking any chunk seeks playback there.
 */
export function ReaderView({
  chunks,
  currentIndex,
  isActive,
  highlight,
  fontScale,
  onSeek,
}: ReaderViewProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isActive || !highlight) return;
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [currentIndex, isActive, highlight]);

  return (
    <div
      className="mx-auto max-w-2xl leading-relaxed text-slate-800 dark:text-slate-200"
      style={{ fontSize: `${fontScale}rem` }}
    >
      <p className="whitespace-pre-wrap">
        {chunks.map((chunk, i) => {
          const isCurrent = highlight && isActive && i === currentIndex;
          return (
            <button
              key={chunk.index}
              ref={isCurrent ? activeRef : undefined}
              type="button"
              onClick={() => onSeek(i)}
              aria-current={isCurrent ? 'true' : undefined}
              className={`cursor-pointer rounded px-0.5 text-left transition-colors ${
                isCurrent
                  ? 'bg-brand-200 text-slate-900 dark:bg-brand-600/40 dark:text-white'
                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-700/50'
              }`}
            >
              {chunk.text}{' '}
            </button>
          );
        })}
      </p>
    </div>
  );
}
