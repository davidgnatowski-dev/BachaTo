import { getCurrentSchedule, getInstructors, getSchoolProfiles, getUpcomingEvents } from "@/lib/db";
import { eventHref, formatEventDateRange } from "@/lib/events";
import { nextOccurrences } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export interface SearchSuggestion {
  id: string;
  label: string;
  meta: string;
  href: string;
  kind: "class" | "event" | "instructor" | "school";
}

function includes(value: string, query: string) {
  return value.toLocaleLowerCase("pl").includes(query);
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().toLocaleLowerCase("pl") ?? "";
  if (query.length < 2) return Response.json([]);

  const classRows = getCurrentSchedule().filter((row) =>
    includes(`${row.title} ${row.instructor ?? ""} ${row.school} ${row.danceStyle}`, query)
  );
  const classes: SearchSuggestion[] = nextOccurrences(classRows, new Date(), 4).map(({ row, when }) => ({
    id: `class-${row.school}-${row.id}`,
    label: row.title,
    meta: `${when.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })} · ${row.startTime ?? "?"} · ${row.school}${row.instructor ? ` · ${row.instructor}` : ""}`,
    href: `/grafik?q=${encodeURIComponent(row.title)}&school=${encodeURIComponent(row.school)}`,
    kind: "class",
  }));

  const events: SearchSuggestion[] = getUpcomingEvents()
    .filter((event) => includes(`${event.title} ${event.city ?? ""} ${event.organizer ?? ""}`, query))
    .slice(0, 3)
    .map((event) => ({
      id: `event-${event.source}-${event.id}`,
      label: event.title,
      meta: `${formatEventDateRange(event)}${event.city ? ` · ${event.city}` : ""}`,
      href: eventHref(event),
      kind: "event",
    }));

  const instructors: SearchSuggestion[] = getInstructors()
    .filter((instructor) => includes(instructor.name, query))
    .slice(0, 2)
    .map((instructor) => ({
      id: `instructor-${instructor.name}`,
      label: instructor.name,
      meta: `Instruktor · ${instructor.schools.join(", ")}`,
      href: `/instruktorzy/${encodeURIComponent(instructor.name)}`,
      kind: "instructor",
    }));

  const schools: SearchSuggestion[] = getSchoolProfiles()
    .filter((school) => includes(school.name, query))
    .slice(0, 2)
    .map((school) => ({
      id: `school-${school.name}`,
      label: school.name,
      meta: `Szkoła tańca · Warszawa`,
      href: `/szkoly/${encodeURIComponent(school.name)}`,
      kind: "school",
    }));

  return Response.json([...classes, ...events, ...instructors, ...schools].slice(0, 8));
}
