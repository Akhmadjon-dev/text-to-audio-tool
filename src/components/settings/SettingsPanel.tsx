import { useMemo, useState } from 'react';
import { Drawer } from '@/components/common/Drawer';
import { SpeedControl } from '@/components/player/SpeedControl';
import { VoicePicker } from '@/components/player/VoicePicker';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useVoices } from '@/hooks/useVoices';
import { useDocumentLibrary } from '@/hooks/useDocumentLibrary';
import { getProvider } from '@/services/tts';
import { getStoredTheme, setTheme, type ThemeMode } from '@/features/settings/theme';
import { wipeAllLocalData } from '@/features/settings/reset';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const SKIP_OPTIONS = [5, 10, 15, 30, 60];
const THEMES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '☀️ Light' },
  { value: 'dark', label: '🌙 Dark' },
  { value: 'system', label: '🖥️ System' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </div>
  );
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const engine = useSettingsStore((s) => s.engine);
  const rate = useSettingsStore((s) => s.rate);
  const voiceId = useSettingsStore((s) => s.voiceId);
  const skipSeconds = useSettingsStore((s) => s.skipSeconds);
  const fontScale = useSettingsStore((s) => s.fontScale);
  const highlight = useSettingsStore((s) => s.highlightSentence);
  const update = useSettingsStore((s) => s.update);

  const provider = useMemo(() => getProvider(engine), [engine]);
  const { groups, loading } = useVoices(provider);
  const { docs } = useDocumentLibrary();

  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [confirmWipe, setConfirmWipe] = useState(false);

  const onWipe = async () => {
    await wipeAllLocalData();
    window.location.reload();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Settings">
      <Section title="Playback">
        <Row label="Voice">
          <VoicePicker
            groups={groups}
            loading={loading}
            voiceId={voiceId}
            onChange={(id, lang) => update({ voiceId: id, lang })}
          />
        </Row>
        <Row label="Speed">
          <SpeedControl rate={rate} onChange={(r) => update({ rate: r })} />
        </Row>
        <Row label="Skip duration">
          <select
            value={skipSeconds}
            onChange={(e) => update({ skipSeconds: Number(e.target.value) })}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
          >
            {SKIP_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}s
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Reading">
        <Row label={`Font size (${Math.round(fontScale * 100)}%)`}>
          <input
            type="range"
            min={0.85}
            max={1.6}
            step={0.05}
            value={fontScale}
            onChange={(e) => update({ fontScale: Number(e.target.value) })}
            aria-label="Font size"
            className="w-40 accent-brand-600"
          />
        </Row>
        <Row label="Highlight current sentence">
          <button
            type="button"
            role="switch"
            aria-checked={highlight}
            onClick={() => update({ highlightSentence: !highlight })}
            className={`relative h-6 w-11 rounded-full transition ${
              highlight ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                highlight ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </Row>
        <Row label="Theme">
          <div className="flex gap-1">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setTheme(t.value);
                  setThemeState(t.value);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  theme === t.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Storage & privacy">
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          🔒 Your documents stay on your device. Nothing is uploaded to a server. No analytics, no
          tracking.
        </p>
        <Row label="Saved documents">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {docs.length}
          </span>
        </Row>
        {confirmWipe ? (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/40">
            <span className="text-sm text-red-700 dark:text-red-300">Delete everything?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmWipe(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onWipe}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete all
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmWipe(true)}
            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Clear all local data
          </button>
        )}
      </Section>
    </Drawer>
  );
}
