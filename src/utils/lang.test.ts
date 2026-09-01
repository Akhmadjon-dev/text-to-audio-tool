import { describe, it, expect } from 'vitest';
import { langLabel, groupVoicesByLanguage } from './lang';
import type { TTSVoice } from '@/services/tts/types';

const voice = (name: string, lang: string): TTSVoice => ({
  id: `${name}-${lang}`,
  name,
  lang,
  localService: true,
  engine: 'browser',
});

describe('langLabel', () => {
  it('maps a BCP-47 tag to a language name', () => {
    expect(langLabel('en-US')).toBe('English');
    expect(langLabel('fr-FR')).toBe('French');
  });
  it('handles bare language codes', () => {
    expect(langLabel('de')).toBe('German');
  });
  it('returns a fallback for empty input', () => {
    expect(langLabel('')).toBe('Unknown');
  });
});

describe('groupVoicesByLanguage', () => {
  it('groups voices by base language', () => {
    const groups = groupVoicesByLanguage([
      voice('Zira', 'en-US'),
      voice('Amelie', 'fr-FR'),
      voice('David', 'en-GB'),
    ]);
    const en = groups.find((g) => g.lang === 'en');
    expect(en?.voices).toHaveLength(2);
    expect(groups.map((g) => g.lang).sort()).toEqual(['en', 'fr']);
  });

  it('sorts voices alphabetically within a group', () => {
    const groups = groupVoicesByLanguage([voice('Zed', 'en-US'), voice('Abe', 'en-US')]);
    expect(groups[0].voices.map((v) => v.name)).toEqual(['Abe', 'Zed']);
  });

  it('returns an empty array for no voices', () => {
    expect(groupVoicesByLanguage([])).toEqual([]);
  });
});
