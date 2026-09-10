import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { EventCard } from "@/components/EventCard";

const PREVIEW_COUNT = 6;

/** Hidden entirely when the school has no upcoming events — never renders an empty section. */
export function SchoolUpcomingEvents({ schoolName, events }: { schoolName: string; events: EventRow[] }) {
  if (events.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Nadchodzące wydarzenia</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {events.slice(0, PREVIEW_COUNT).map((row) => (
          <EventCard key={`${row.source}-${row.id}`} row={row} />
        ))}
      </div>
      <Link href={`/eventy?q=${encodeURIComponent(schoolName)}`} className="text-sm font-semibold text-accent hover:text-accent-peach">
        Wszystkie wydarzenia →
      </Link>
    </section>
  );
}
