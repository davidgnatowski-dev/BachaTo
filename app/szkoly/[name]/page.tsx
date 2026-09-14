import { notFound } from "next/navigation";
import type { School } from "@/lib/types";
import { getCurrentSchedule, getUpcomingEvents, getUserActivity } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SCHOOL_INFO, SCHOOL_NAMES } from "@/lib/schools";
import { splitInstructors, nextOccurrences, schoolAddress } from "@/lib/schedule";
import { computeActivityStats } from "@/lib/activityStats";
import { Header } from "@/components/Header";
import { SchoolHero } from "@/components/SchoolHero";
import { SchoolUpcomingClasses } from "@/components/SchoolUpcomingClasses";
import { SchoolUpcomingEvents } from "@/components/SchoolUpcomingEvents";
import { SchoolInstructors, type SchoolInstructorSummary } from "@/components/SchoolInstructors";
import { UserSchoolActivity } from "@/components/UserSchoolActivity";
import { SchoolAbout } from "@/components/SchoolAbout";
import { DanceStyleChips } from "@/components/DanceStyleChips";
import { SchoolAmenities } from "@/components/SchoolAmenities";
import { SchoolContact } from "@/components/SchoolContact";
import { PricingCard } from "@/components/PricingCard";

export const dynamic = "force-dynamic";

function assertSchool(value: string): asserts value is School {
  if (!SCHOOL_NAMES.includes(value as School)) notFound();
}

export default async function SchoolProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  assertSchool(name);

  const schedule = getCurrentSchedule();
  const classes = schedule.filter((r) => r.school === name);
  const info = SCHOOL_INFO[name];
  const address = schoolAddress(name);
  const upcomingClasses = nextOccurrences(classes, new Date(), 50);
  const upcomingEvents = getUpcomingEvents().filter((e) => e.organizer === name);
  const danceStyles = Array.from(new Set(classes.map((c) => c.danceStyle).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pl"));

  const instructorMap = new Map<string, { photoUrl?: string; styleCounts: Map<string, number> }>();
  for (const row of classes) {
    for (const instructorName of splitInstructors(row.instructor)) {
      let entry = instructorMap.get(instructorName);
      if (!entry) {
        entry = { styleCounts: new Map() };
        instructorMap.set(instructorName, entry);
      }
      if (!entry.photoUrl && row.instructorPhotos?.[instructorName]) entry.photoUrl = row.instructorPhotos[instructorName];
      entry.styleCounts.set(row.danceStyle, (entry.styleCounts.get(row.danceStyle) ?? 0) + 1);
    }
  }
  const instructors: SchoolInstructorSummary[] = Array.from(instructorMap.entries())
    .map(([instructorName, entry]) => {
      let primaryStyle: string | undefined;
      let max = 0;
      for (const [style, count] of entry.styleCounts) {
        if (count > max) {
          max = count;
          primaryStyle = style;
        }
      }
      return { name: instructorName, photoUrl: entry.photoUrl, primaryStyle };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pl"));

  const user = await getCurrentUser();
  const activityStats = user ? computeActivityStats((await getUserActivity(user.id)).filter((e) => e.school === name && !e.autoMarked)) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <Header />

      <SchoolHero school={name} address={address} styles={danceStyles} logoUrl={info.logoUrl} coverImageUrl={info.coverImageUrl} />

      {/* Single column on mobile/tablet; ~65/35 split from lg up — same grid pattern as the homepage. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[7fr_3fr]">
        <div className="flex min-w-0 flex-col gap-8">
          <SchoolUpcomingClasses schoolName={name} items={upcomingClasses} allRows={schedule} />
          <SchoolUpcomingEvents schoolName={name} events={upcomingEvents} />
          <SchoolInstructors instructors={instructors} />
        </div>

        <div className="flex min-w-0 flex-col gap-8">
          <PricingCard school={name} />
          <SchoolAbout description={info.description} />
          <DanceStyleChips styles={danceStyles} />
          <SchoolAmenities amenities={info.amenities} />
          <SchoolContact
            address={address}
            website={info.homepage}
            phone={info.phone}
            email={info.email}
            instagram={info.instagram}
            facebook={info.facebook}
            tiktok={info.tiktok}
          />
          {activityStats && <UserSchoolActivity stats={activityStats} />}
        </div>
      </div>
    </div>
  );
}
