import { create } from 'zustand';
import { DEFAULT_SETTINGS, type Settings } from '@/types';
import { loadSettings, saveSettings } from '@/services/storage/db';

const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

function pickSettings(state: Settings): Settings {
  return Object.fromEntries(SETTINGS_KEYS.map((k) => [k, state[k]])) as unknown as Settings;
}

interface SettingsState extends Settings {
  hydrated: boolean;
  /** Load persisted settings from IndexedDB into the store. */
  hydrate: () => Promise<void>;
  /** Patch settings, persist to IndexedDB, and apply side effects (e.g. theme). */
  update: (patch: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    const stored = await loadSettings();
    if (stored) set({ ...stored });
    set({ hydrated: true });
  },

  update: (patch) => {
    set(patch);
    void saveSettings(pickSettings(get()));
  },
}));
