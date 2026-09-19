import { getUpcomingEvents } from "@/lib/db";
import { Header } from "@/components/Header";
import { EventsV2Explorer } from "@/components/EventsV2Explorer";

export const dynamic = "force-dynamic";

export default function EventsV2Page() {
  const events = getUpcomingEvents();
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
      <Header />
      <EventsV2Explorer rows={events} />
    </div>
  );
}
