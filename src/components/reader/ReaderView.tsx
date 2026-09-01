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

// Group chunks into blocks so we can apply `content-visibility: auto` — the
// browser skips rendering/layout for off-screen blocks, keeping very large
// documents (thousands of chunks) responsive without a virtualization library.
const BLOCK_SIZE = 30;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
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
    activeRef.current?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [currentIndex, isActive, highlight]);

  const blockCount = Math.ceil(chunks.length / BLOCK_SIZE);

  return (
    <div
      className="mx-auto max-w-2xl leading-relaxed text-slate-800 dark:text-slate-200"
      style={{ fontSize: `${fontScale}rem` }}
    >
      {Array.from({ length: blockCount }, (_, b) => {
        const start = b * BLOCK_SIZE;
        const block = chunks.slice(start, start + BLOCK_SIZE);
        return (
          <p
            key={b}
            className="mb-3 whitespace-pre-wrap"
            style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}
          >
            {block.map((chunk) => {
              const i = chunk.index;
              const isCurrent = highlight && isActive && i === currentIndex;
              return (
                <button
                  key={i}
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
        );
      })}
    </div>
  );
}
