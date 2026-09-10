import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import { nextOccurrences, schoolTextClass } from "@/lib/schedule";
import { CheckIcon } from "@/components/icons";

const SHORT_DAY_LABELS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const PREVIEW_COUNT = 3;

/**
 * Marketing module for anonymous visitors — explains the app's core loop and
 * sells account creation. The "Mój plan" panel on the right is illustrative
 * (real upcoming classes, decorative checkmarks) and explicitly labeled as a
 * preview so it's never mistaken for the visitor's own saved plan.
 */
export function PlanShowcase({ schedule }: { schedule: ClassRow[] }) {
  const today = new Date();
  const todayWeekday = ((today.getDay() + 6) % 7) + 1; // 1 = Monday .. 7 = Sunday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (todayWeekday - 1));
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const previewClasses = nextOccurrences(schedule, today, PREVIEW_COUNT);

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-line bg-zinc-900/60 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
      <div className="flex flex-col gap-3 lg:max-w-sm">
        <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
          Stwórz swój <span className="text-accent">plan</span> zajęć
        </h2>
        <p className="text-sm text-muted">
          Dodawaj zajęcia z różnych szkół, układaj własny plan i wracaj do niego kiedy chcesz.
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <Link
            href="/rejestracja"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Załóż darmowe konto
          </Link>
          <Link
            href="/logowanie"
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-foreground/80 hover:border-zinc-500"
          >
            Mam już konto
          </Link>
        </div>
      </div>

      {previewClasses.length > 0 && (
        <div className="w-full max-w-sm shrink-0 rounded-xl border border-line bg-black/30 p-4">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Mój plan</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">Podgląd</span>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px]">
            {weekDates.map((d, i) => {
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-muted">{SHORT_DAY_LABELS[i]}</span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                      isToday ? "bg-violet text-white" : "text-zinc-300"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col divide-y divide-line border-t border-line">
            {previewClasses.map(({ row }) => (
              <div key={`${row.school}-${row.id}`} className="flex items-center gap-3 py-2.5 first:pt-3">
                <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-accent">{row.startTime}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{row.title}</p>
                  <p className={`truncate text-xs ${schoolTextClass(row.school)}`}>{row.school}</p>
                </div>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/20 text-violet">
                  <CheckIcon className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
