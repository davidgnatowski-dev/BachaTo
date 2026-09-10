import {
  getCurrentSchedule,
  getInstructors,
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
import { SearchBar } from "@/components/SearchBar";
import { QuickFilterBar } from "@/components/QuickFilterBar";
import { Hero } from "@/components/Hero";
import { UpcomingClassesPreview } from "@/components/UpcomingClassesPreview";
import { PlanShowcase } from "@/components/PlanShowcase";
import { HomeEventsSection } from "@/components/HomeEventsSection";
import { HowItWorks } from "@/components/HowItWorks";
import { StatsTeaser } from "@/components/StatsTeaser";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { SCHOOL_NAMES } from "@/lib/schools";

export const dynamic = "force-dynamic";

export default async function Home() {
  const schedule = getCurrentSchedule();
  const upcomingEvents = getUpcomingEvents();
  const schools = SCHOOL_NAMES;
  const styles = Array.from(new Set(schedule.map((r) => r.danceStyle).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pl"));
  const user = await getCurrentUser();

  if (user) {
    const preferences = getUserPreferences(user.id);
    const dashboardPreferences = {
      ...user.preferences,
      levels: user.preferences.levels.length > 0 ? user.preferences.levels : preferences.levels,
      formats: user.preferences.formats.length > 0 ? user.preferences.formats : preferences.formats as typeof user.preferences.formats,
      days: user.preferences.days.length > 0 ? user.preferences.days : preferences.days,
      timeFrom: user.preferences.timeFrom ?? preferences.timeFrom,
    };
    const favorites = getUserFavorites(user.id);
    const initialFavorites = {
      likedClasses: favorites.filter((item) => item.itemType === "class" && item.kind === "liked").map((item) => item.itemId),
      likedEvents: favorites.filter((item) => item.itemType === "event" && item.kind === "liked").map((item) => item.itemId),
      plannedClasses: favorites.filter((item) => item.itemType === "class" && item.kind === "planned").map((item) => item.itemId),
      plannedEvents: favorites.filter((item) => item.itemType === "event" && item.kind === "planned").map((item) => item.itemId),
      plannedEventSessions: favorites.filter((item) => item.itemType === "event_session" && item.kind === "planned").map((item) => item.itemId),
    };
    const initialActivity = getUserActivity(user.id).map((entry) => ({
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
          customClasses={getUserClasses(user.id)}
          initialFavorites={initialFavorites}
          initialActivity={initialActivity}
          attendedEvents={getUserEventActivity(user.id).length}
          preferences={dashboardPreferences}
        />
      </div>
    );
  }

  const instructorCount = getInstructors().length;
  const eventCount = upcomingEvents.length;
  const classCount = schedule.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />
      <SearchBar />
      <QuickFilterBar schools={schools} styles={styles} />

      <Hero classCount={classCount} schoolCount={schools.length} eventCount={eventCount} />
      <HowItWorks />
      <UpcomingClassesPreview schedule={schedule} loggedIn={false} />
      <PlanShowcase schedule={schedule} />
      <HomeEventsSection events={upcomingEvents} loggedIn={false} />
      <StatsTeaser classCount={classCount} schoolCount={schools.length} instructorCount={instructorCount} eventCount={eventCount} />
    </div>
  );
}
