import type { VoiceGroup } from '@/utils/lang';

interface VoicePickerProps {
  groups: VoiceGroup[];
  loading: boolean;
  voiceId: string | null;
  onChange: (voiceId: string, lang: string) => void;
}

/**
 * Voice selector populated dynamically from the device's actual voices,
 * grouped by language. Never hardcodes voices that may not exist.
 */
export function VoicePicker({ groups, loading, voiceId, onChange }: VoicePickerProps) {
  const hasVoices = groups.length > 0;

  if (loading) {
    return <span className="text-sm text-slate-500 dark:text-slate-400">Loading voices…</span>;
  }
  if (!hasVoices) {
    return (
      <span className="text-sm text-amber-600 dark:text-amber-400">
        No voices found on this device
      </span>
    );
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
      <span className="sr-only">Voice</span>
      <span aria-hidden>🗣️</span>
      <select
        value={voiceId ?? ''}
        onChange={(e) => {
          const id = e.target.value;
          const voice = groups.flatMap((g) => g.voices).find((v) => v.id === id);
          if (voice) onChange(voice.id, voice.lang);
        }}
        aria-label="Voice"
        className="max-w-44 rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        {voiceId === null && <option value="">System default</option>}
        {groups.map((group) => (
          <optgroup key={group.lang} label={`${group.label} (${group.voices.length})`}>
            {group.voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.localService ? '' : ' — online'}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
