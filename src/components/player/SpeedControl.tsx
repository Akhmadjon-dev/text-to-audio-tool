interface SpeedControlProps {
  rate: number;
  onChange: (rate: number) => void;
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

/** Playback speed selector. Includes the current rate even if it's custom. */
export function SpeedControl({ rate, onChange }: SpeedControlProps) {
  const options = SPEED_PRESETS.includes(rate) ? SPEED_PRESETS : [...SPEED_PRESETS, rate].sort((a, b) => a - b);
  return (
    <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
      <span className="sr-only">Playback speed</span>
      <span aria-hidden>⏩</span>
      <select
        value={rate}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Playback speed"
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {s}×
          </option>
        ))}
      </select>
    </label>
  );
}
