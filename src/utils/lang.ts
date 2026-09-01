import type { TTSVoice } from '@/services/tts/types';

let displayNames: Intl.DisplayNames | null = null;
try {
  displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
} catch {
  displayNames = null;
}

/** Human-readable language name from a BCP-47 tag, e.g. "en-US" -> "English". */
export function langLabel(tag: string): string {
  if (!tag) return 'Unknown';
  const base = tag.split('-')[0];
  try {
    const name = displayNames?.of(base);
    if (name && name !== base) return name;
  } catch {
    /* fall through */
  }
  return tag;
}

export interface VoiceGroup {
  lang: string;
  label: string;
  voices: TTSVoice[];
}

/** Group voices by their base language, sorted alphabetically by label. */
export function groupVoicesByLanguage(voices: TTSVoice[]): VoiceGroup[] {
  const map = new Map<string, TTSVoice[]>();
  for (const v of voices) {
    const base = (v.lang || 'und').split('-')[0];
    const list = map.get(base) ?? [];
    list.push(v);
    map.set(base, list);
  }
  return [...map.entries()]
    .map(([lang, vs]) => ({
      lang,
      label: langLabel(lang),
      voices: vs.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
