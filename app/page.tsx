import { getCurrentSchedule, getUpcomingEvents } from "@/lib/db";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { QuickFilterBar } from "@/components/QuickFilterBar";
import { TabNav } from "@/components/TabNav";
import { Hero } from "@/components/Hero";
import { UpcomingEventsPreview } from "@/components/UpcomingEventsPreview";
import { UpcomingClassesPreview } from "@/components/UpcomingClassesPreview";
import { MyPlanPanel } from "@/components/MyPlanPanel";
import { MonthCalendar } from "@/components/MonthCalendar";
import { PodsumowanieBanner } from "@/components/PodsumowanieBanner";
import type { School } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function Home() {
  const schedule = getCurrentSchedule();
  const upcomingEvents = getUpcomingEvents();
  const schools = Array.from(new Set(schedule.map((r) => r.school))).sort((a, b) => a.localeCompare(b, "pl")) as School[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />
      <SearchBar />
      <QuickFilterBar schools={schools} />
      <TabNav active="wszystkie" />
      <Hero />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_3fr]">
        <div className="flex flex-col gap-6">
          <UpcomingEventsPreview events={upcomingEvents} />
          <UpcomingClassesPreview schedule={schedule} />
        </div>
        <div className="flex flex-col gap-6">
          <MyPlanPanel schedule={schedule} events={upcomingEvents} />
          <MonthCalendar events={upcomingEvents} />
        </div>
      </div>

      <PodsumowanieBanner />
    </div>
  );
}
