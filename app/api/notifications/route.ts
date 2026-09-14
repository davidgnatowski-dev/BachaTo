import { getCurrentUser } from "@/lib/auth";
import { getCurrentSchedule, getUpcomingEvents, getUserFavorites, getUserNotificationPreferences } from "@/lib/db";
import { nextOccurrences } from "@/lib/schedule";
import { toLocalIsoDate } from "@/lib/format";
import { splitInstructors } from "@/lib/schedule";
import { eventHref } from "@/lib/events";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json([], { status: 200 });

  const preferences = await getUserNotificationPreferences(user.id);
  const favorites = await getUserFavorites(user.id);
  const plannedClasses = new Set(favorites.filter((item) => item.itemType === "class" && item.kind === "planned").map((item) => item.itemId));
  const plannedEvents = new Set(favorites.filter((item) => item.itemType === "event" && item.kind === "planned").map((item) => item.itemId));
  const likedClasses = favorites.filter((item) => item.itemType === "class" && item.kind === "liked").length;
  const followedSchools = new Set(favorites.filter((item) => item.itemType === "school" && item.kind === "followed").map((item) => item.itemId));
  const followedInstructors = new Set(favorites.filter((item) => item.itemType === "instructor" && item.kind === "followed").map((item) => item.itemId));
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86400000);

  const classNotifications = nextOccurrences(
    getCurrentSchedule().filter((row) => plannedClasses.has(`${row.school}-${row.id}`)),
    now,
    12
  )
    .filter(({ when }) => when <= inSevenDays)
    .slice(0, 5)
    .map(({ row, when }) => {
      const day = toLocalIsoDate(when) === toLocalIsoDate(now)
        ? "Dzisiaj"
        : toLocalIsoDate(when) === toLocalIsoDate(new Date(now.getTime() + 86400000))
          ? "Jutro"
          : when.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" });
      return {
        id: `class-${row.school}-${row.id}-${toLocalIsoDate(when)}`,
        title: `${day} o ${row.startTime ?? "—"}`,
        body: `${row.title} · ${row.school}`,
        href: `/#moj-plan`,
        kind: "class",
        notifyAt: new Date(when.getTime() - preferences.reminderMinutes * 60000).toISOString(),
      };
    });

  const eventNotifications = getUpcomingEvents()
    .filter((event) => plannedEvents.has(`${event.source}-${event.id}`))
    .filter((event) => new Date(`${event.startDate}T00:00:00`) <= new Date(now.getTime() + 14 * 86400000))
    .slice(0, 3)
    .map((event) => ({
      id: `event-${event.source}-${event.id}-${event.startDate}`,
      title: new Date(`${event.startDate}T12:00:00`).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "short" }),
      body: event.title,
      href: eventHref(event),
      kind: "event",
      notifyAt: new Date(new Date(`${event.startDate}T10:00:00`).getTime() - preferences.reminderMinutes * 60000).toISOString(),
    }));

  const followedNotifications = nextOccurrences(
    getCurrentSchedule().filter((row) => !plannedClasses.has(`${row.school}-${row.id}`) && (followedSchools.has(row.school) || splitInstructors(row.instructor).some((name) => followedInstructors.has(name)))),
    now,
    20
  ).filter(({ when }) => when <= inSevenDays).slice(0, 3).map(({ row, when }) => ({
    id: `follow-${row.school}-${row.id}-${toLocalIsoDate(when)}`,
    title: followedSchools.has(row.school) ? `Obserwowana szkoła · ${row.school}` : "Obserwowany instruktor",
    body: `${when.toLocaleDateString("pl-PL", { weekday: "short" })} ${row.startTime ?? "—"} · ${row.title}${row.instructor ? ` · ${row.instructor}` : ""}`,
    href: `/grafik?school=${encodeURIComponent(row.school)}`,
    kind: "follow",
    notifyAt: new Date(when.getTime() - preferences.reminderMinutes * 60000).toISOString(),
  }));

  const notifications: Array<{ id: string; title: string; body: string; href: string; kind: string; notifyAt?: string | null }> = [
    ...(preferences.plannedClasses ? classNotifications : []),
    ...(preferences.plannedEvents ? eventNotifications : []),
    ...(preferences.followed ? followedNotifications : []),
  ];
  if (notifications.length === 0) {
    const allDisabled = !preferences.plannedClasses && !preferences.plannedEvents && !preferences.followed;
    notifications.push({
      id: allDisabled ? "notifications-disabled" : plannedClasses.size + plannedEvents.size > 0 ? "plan-no-nearby" : "plan-empty",
      title: allDisabled ? "Powiadomienia są wyłączone" : plannedClasses.size + plannedEvents.size > 0 ? "Spokojny tydzień" : "Twój plan czeka",
      body: allDisabled ? "Możesz wybrać przypomnienia w ustawieniach konta." : plannedClasses.size + plannedEvents.size > 0
        ? "Nie masz zapisanych terminów w najbliższych dniach."
        : likedClasses > 0 ? "Dodaj polubione zajęcia do planu." : "Znajdź pierwsze zajęcia i dodaj je do planu.",
      href: allDisabled ? "/konto#powiadomienia" : plannedClasses.size + plannedEvents.size > 0 ? "/#moj-plan" : likedClasses > 0 ? "/#ulubione" : "/grafik",
      kind: "info",
      notifyAt: null,
    });
  }

  return Response.json(notifications);
}
