import type { EventCategory, EventRow } from "./types";

/** Every non-school scrape_runs source that feeds the events pages — used both to display per-source status and to exclude these from any "schools" listing. */
export const EVENT_SOURCES = ["Tensy", "Społeczność", "Szkoły"] as const;

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  festival: "Festiwal",
  trip: "Wyjazd",
  social: "Social / impreza",
  competition: "Zawody",
};

export const CATEGORY_ORDER: EventCategory[] = ["festival", "trip", "social", "competition"];

export const CATEGORY_SECTION_TITLES: Record<EventCategory, string> = {
  festival: "Festiwale",
  trip: "Wyjazdy i obozy",
  social: "Socjale i imprezy",
  competition: "Zawody",
};

const CATEGORY_STYLES: Record<EventCategory, { bg: string; text: string; ring: string }> = {
  festival: { bg: "bg-fuchsia-950/60", text: "text-fuchsia-400", ring: "ring-fuchsia-800/60" },
  trip: { bg: "bg-emerald-950/60", text: "text-emerald-400", ring: "ring-emerald-800/60" },
  social: { bg: "bg-orange-950/60", text: "text-orange-400", ring: "ring-orange-800/60" },
  competition: { bg: "bg-sky-950/60", text: "text-sky-400", ring: "ring-sky-800/60" },
};

export function categoryStyle(category: EventCategory) {
  return CATEGORY_STYLES[category];
}

function formatDatePl(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** "14–16.08.2026" for multi-day events spanning the same month, "13.08.2026" for single-day. */
export function formatEventDateRange(row: Pick<EventRow, "startDate" | "endDate">): string {
  if (!row.endDate || row.endDate === row.startDate) return formatDatePl(row.startDate);

  const [sy, sm, sd] = row.startDate.split("-");
  const [ey, em, ed] = row.endDate.split("-");
  if (sy === ey && sm === em) return `${sd}–${ed}.${sm}.${sy}`;
  if (sy === ey) return `${sd}.${sm}–${ed}.${em}.${sy}`;
  return `${formatDatePl(row.startDate)} – ${formatDatePl(row.endDate)}`;
}

/**
 * A Google Calendar "quick add" link — no login/OAuth on our side, no API
 * keys, no token storage. It opens Calendar's own add-event screen
 * pre-filled, in whichever Google account the visitor is already signed
 * into in their browser; they still hit Calendar's own "Save" button.
 */
export function googleCalendarUrl(
  row: Pick<EventRow, "title" | "startDate" | "endDate" | "description" | "venue" | "address" | "city" | "sourceUrl">
): string {
  const start = row.startDate.replaceAll("-", "");
  // Pure UTC calendar-date arithmetic — a local-time Date here would let
  // toISOString() shift the +1 day back across midnight in timezones ahead
  // of UTC (e.g. Poland), silently dropping the last day of the event.
  const [ey, em, ed] = (row.endDate ?? row.startDate).split("-").map(Number);
  const endExclusive = new Date(Date.UTC(ey, em - 1, ed + 1));
  const end = endExclusive.toISOString().slice(0, 10).replaceAll("-", "");

  const location = [row.venue, row.address, row.city].filter(Boolean).join(", ");
  const details = [row.description, row.sourceUrl].filter(Boolean).join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: row.title,
    dates: `${start}/${end}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function groupByCategory(rows: EventRow[]): Map<EventCategory, EventRow[]> {
  const groups = new Map<EventCategory, EventRow[]>();
  for (const row of rows) {
    if (!groups.has(row.category)) groups.set(row.category, []);
    groups.get(row.category)!.push(row);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  return groups;
}

/**
 * Loose title+date dedup key — different sources rarely agree on exact
 * title strings for the same real-world event ("Bachata Libre Competition"
 * on Tensy vs "Bachata Libre Competition 2027" on the school's own site), so
 * this strips punctuation and trailing edition years before comparing.
 */
export function eventDedupKey(title: string, startDate: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/\b20\d{2}\b/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${normalized}|${startDate}`;
}

/** Polish plural forms for "wydarzenie" (event): 1 / 2-4 / 5+. */
export function pluralizeEvents(n: number): string {
  if (n === 1) return "wydarzenie";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "wydarzenia";
  return "wydarzeń";
}
