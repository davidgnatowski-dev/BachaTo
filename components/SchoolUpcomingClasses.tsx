import Link from "next/link";
import type { ClassRow } from "@/lib/types";
import type { UpcomingClass } from "@/lib/schedule";
import { UpcomingClassList } from "@/components/UpcomingClassList";

const PREVIEW_COUNT = 6;

/**
 * "Co mogę tutaj zatańczyć i kiedy?" is the first question a visitor has, so
 * this sits right under the hero. Reuses the same UpcomingClassList (and the
 * ClassDetailModal it opens on click) as the instructor profile and the
 * schedule page — no separate class-card implementation for this screen.
 */
export function SchoolUpcomingClasses({
  schoolName,
  items,
  allRows,
}: {
  schoolName: string;
  items: UpcomingClass[];
  allRows: ClassRow[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Najbliższe zajęcia</h2>
      <div className="rounded-xl border border-line bg-zinc-900/60 px-4">
        <UpcomingClassList items={items.slice(0, PREVIEW_COUNT)} allRows={allRows} />
      </div>
      <Link href={`/grafik?school=${encodeURIComponent(schoolName)}`} className="text-sm font-semibold text-accent hover:text-accent-peach">
        Zobacz pełny grafik →
      </Link>
    </section>
  );
}
