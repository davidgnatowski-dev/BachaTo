import { notFound } from "next/navigation";
import Link from "next/link";
import type { School } from "@/lib/types";
import { getCurrentSchedule } from "@/lib/db";
import { SCHOOL_INFO, SCHOOL_PRICING } from "@/lib/schools";
import { splitInstructors, nextOccurrences, pluralizeClasses } from "@/lib/schedule";
import { Header } from "@/components/Header";
import { UpcomingClassList } from "@/components/UpcomingClassList";

export const dynamic = "force-dynamic";

const SCHOOLS: School[] = ["Abra Studio", "Salsa Libre", "Warsaw Salsa Club"];

function assertSchool(value: string): asserts value is School {
  if (!SCHOOLS.includes(value as School)) notFound();
}

export default async function SchoolProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  assertSchool(name);

  const schedule = getCurrentSchedule();
  const classes = schedule.filter((r) => r.school === name);
  if (classes.length === 0) notFound();

  const info = SCHOOL_INFO[name];
  const pricing = SCHOOL_PRICING[name];
  const locations = Array.from(
    new Set(classes.map((c) => c.location).filter((l): l is string => typeof l === "string" && !l.toLowerCase().includes("odwołane")))
  );
  const instructorCount = new Set(classes.flatMap((c) => splitInstructors(c.instructor))).size;
  const upcoming = nextOccurrences(classes, new Date(), 50);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">{name}</h1>
        <p className="mt-1 text-sm text-zinc-300">{info.description}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <span>
          {classes.length} {pluralizeClasses(classes.length)} w grafiku
        </span>
        <span>{instructorCount} instruktorów</span>
        {locations.map((loc) => (
          <span key={loc}>{loc}</span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={info.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Strona szkoły ↗
        </a>
        <Link
          href={`/grafik?school=${encodeURIComponent(name)}`}
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-zinc-500"
        >
          Pełny grafik szkoły →
        </Link>
        {pricing && (
          <a href={pricing.pricingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:text-accent-peach">
            od {pricing.fromPrice} · cennik →
          </a>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Najbliższe zajęcia</h2>
        <UpcomingClassList items={upcoming} allRows={schedule} />
      </section>

      <p className="text-xs text-muted">Instagram / Facebook pojawią się tutaj, gdy szkoła zacznie udostępniać te dane.</p>
    </div>
  );
}
