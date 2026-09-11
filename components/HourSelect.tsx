"use client";

/** Whole hours covering the real spread of class start times (10:00–22:15). */
export const HOUR_OPTIONS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

const SELECT_CLASS =
  "rounded-full border border-line bg-black/40 px-3 py-1.5 text-sm text-zinc-100 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

/**
 * A preset-hour dropdown ("Dowolna" + whole hours) with a "×" button that
 * shows up once a value is picked, so clearing it is always one click —
 * never fiddling with a native time input's tiny built-in clear icon.
 * Shared by both places the schedule's hour filter appears (the /grafik
 * filters and the onboarding survey) so they behave identically.
 */
export function HourSelect({
  label,
  value,
  onChange,
  options = HOUR_OPTIONS,
  placeholder = "Dowolna",
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  options?: string[];
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      <span className="flex items-center gap-1.5">
        <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} className={SELECT_CLASS}>
          <option value="">{placeholder}</option>
          {options.map((t) => (
            <option key={t} value={t}>
              {Number(t.slice(0, 2))}
            </option>
          ))}
        </select>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Wyczyść: ${label}`}
            title="Wyczyść"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:border-zinc-500 hover:text-zinc-100"
          >
            ×
          </button>
        )}
      </span>
    </label>
  );
}
