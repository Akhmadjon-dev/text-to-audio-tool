import { useMemo } from 'react';
import { IconButton } from '@/components/common/IconButton';
import { SpeedControl } from './SpeedControl';
import { VoicePicker } from './VoicePicker';
import { ExportButton } from './ExportButton';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoices } from '@/hooks/useVoices';
import { getProvider } from '@/services/tts';
import { formatTime } from '@/utils/time';
import type { PlaybackApi } from '@/hooks/usePlayback';

interface PlayerBarProps {
  playback: PlaybackApi;
  skipSeconds: number;
}

export function PlayerBar({ playback, skipSeconds }: PlayerBarProps) {
  const engine = useSettingsStore((s) => s.engine);
  const rate = useSettingsStore((s) => s.rate);
  const voiceId = useSettingsStore((s) => s.voiceId);
  const update = useSettingsStore((s) => s.update);

  const provider = useMemo(() => getProvider(engine), [engine]);
  const { groups, loading } = useVoices(provider);
  const canExport = provider.capabilities.canExport;

  const { status, currentIndex, totalChunks, elapsedSeconds, totalSeconds, isPlaying } = playback;
  const maxIndex = Math.max(0, totalChunks - 1);

  return (
    <div className="border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 py-3">
        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="w-14 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {formatTime(elapsedSeconds)}
          </span>
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={Math.min(currentIndex, maxIndex)}
            onChange={(e) => playback.seek(Number(e.target.value))}
            aria-label="Reading position"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600 dark:bg-slate-700"
          />
          <span className="w-14 text-xs tabular-nums text-slate-500 dark:text-slate-400">
            {formatTime(totalSeconds)}
          </span>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          <IconButton label="Previous section" onClick={playback.prev} disabled={currentIndex <= 0}>
            ⏮
          </IconButton>
          <IconButton label={`Back ${skipSeconds} seconds`} onClick={playback.skipBack}>
            ⏪
          </IconButton>
          <IconButton
            label={isPlaying ? 'Pause' : 'Play'}
            variant="solid"
            size="lg"
            onClick={playback.toggle}
            disabled={totalChunks === 0}
          >
            {isPlaying ? '⏸' : '▶'}
          </IconButton>
          <IconButton label={`Forward ${skipSeconds} seconds`} onClick={playback.skipForward}>
            ⏩
          </IconButton>
          <IconButton
            label="Next section"
            onClick={playback.next}
            disabled={currentIndex >= maxIndex}
          >
            ⏭
          </IconButton>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SpeedControl rate={rate} onChange={(r) => update({ rate: r })} />
            <VoicePicker
              groups={groups}
              loading={loading}
              voiceId={voiceId}
              onChange={(id, lang) => update({ voiceId: id, lang })}
            />
          </div>
          <div className="flex items-center gap-2">
            {canExport && totalChunks > 0 && <ExportButton />}
            <IconButton
              label="Restart from beginning"
              onClick={playback.restart}
              disabled={totalChunks === 0}
            >
              ↺
            </IconButton>
            <IconButton label="Stop" onClick={playback.stop} disabled={status === 'idle'}>
              ⏹
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
