import {
  getCurrentSchedule,
  getUpcomingEvents,
  getUserActivity,
  getUserClasses,
  getUserEventActivity,
  getUserFavorites,
  getUserPreferences,
} from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { OnboardingSurveyModal } from "@/components/OnboardingSurveyModal";
import { Header } from "@/components/Header";
import { HomeJourney } from "@/components/HomeJourney";
import { SearchBar } from "@/components/SearchBar";
import { UpcomingClassesPreview } from "@/components/UpcomingClassesPreview";
import { HomeEventsSection } from "@/components/HomeEventsSection";
import { HomePlaylists } from "@/components/HomePlaylists";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { UserDashboard } from "@/components/dashboard/UserDashboard";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const schedule = getCurrentSchedule();
  const upcomingEvents = getUpcomingEvents();
  const { preview } = await searchParams;
  const user = await getCurrentUser();

  if (user && preview !== "landing") {
    const [preferences, favorites, activity, customClasses, eventActivity] = await Promise.all([
      getUserPreferences(user.id),
      getUserFavorites(user.id),
      getUserActivity(user.id),
      getUserClasses(user.id),
      getUserEventActivity(user.id),
    ]);
    const dashboardPreferences = {
      ...user.preferences,
      levels: user.preferences.levels.length > 0 ? user.preferences.levels : preferences.levels,
      formats: user.preferences.formats.length > 0 ? user.preferences.formats : preferences.formats as typeof user.preferences.formats,
      days: user.preferences.days.length > 0 ? user.preferences.days : preferences.days,
      timeFrom: user.preferences.timeFrom ?? preferences.timeFrom,
    };
    const initialFavorites = {
      likedClasses: favorites.filter((item) => item.itemType === "class" && item.kind === "liked").map((item) => item.itemId),
      likedEvents: favorites.filter((item) => item.itemType === "event" && item.kind === "liked").map((item) => item.itemId),
      plannedClasses: favorites.filter((item) => item.itemType === "class" && item.kind === "planned").map((item) => item.itemId),
      plannedEvents: favorites.filter((item) => item.itemType === "event" && item.kind === "planned").map((item) => item.itemId),
      plannedEventSessions: favorites.filter((item) => item.itemType === "event_session" && item.kind === "planned").map((item) => item.itemId),
    };
    const initialActivity = activity.map((entry) => ({
      ...entry,
      instructor: entry.instructor ?? undefined,
      level: entry.level ?? undefined,
      danceStyle: entry.danceStyle ?? undefined,
      durationMinutes: entry.durationMinutes ?? undefined,
      rating: entry.rating ?? undefined,
      note: entry.note ?? undefined,
      activityType: entry.activityType ?? undefined,
      type: "class" as const,
    }));

    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader name={user.name} avatarEmoji={user.avatarEmoji} avatarUrl={user.avatarUrl} />
        {!preferences.surveyDoneAt && <OnboardingSurveyModal />}
        <UserDashboard
          schedule={schedule}
          events={upcomingEvents}
          customClasses={customClasses}
          initialFavorites={initialFavorites}
          initialActivity={initialActivity}
          attendedEvents={eventActivity.length}
          preferences={dashboardPreferences}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8">
      <Header />
      <HomeJourney />
      <div className="flex flex-col gap-6 sm:gap-8">
        <section id="nadchodzacy-grafik" className="flex scroll-mt-4 flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Sprawdź, co tańczymy</p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-white">Nadchodzący grafik</h2>
          </div>
          <SearchBar />
          <UpcomingClassesPreview schedule={schedule} loggedIn={false} />
        </section>
        <HomeEventsSection events={upcomingEvents} loggedIn={false} />
        <HomePlaylists />
      </div>
    </div>
  );
}
