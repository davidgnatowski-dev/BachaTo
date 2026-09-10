import Link from "next/link";
import type { SchoolProfile } from "@/lib/db";
import { pluralizeClasses, schoolTextClass } from "@/lib/schedule";
import { PinIcon, PersonIcon, CalendarIcon } from "@/components/icons";

export function SchoolCard({ school }: { school: SchoolProfile }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div>
        <h2 className={`font-heading text-lg font-semibold ${schoolTextClass(school.name)}`}>{school.name}</h2>
        <p className="mt-1 text-sm text-zinc-300">{school.description}</p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          {school.classCount} {pluralizeClasses(school.classCount)} w grafiku
        </span>
        <span className="inline-flex items-center gap-1">
          <PersonIcon className="h-3.5 w-3.5" />
          {school.instructorCount} instruktorów
        </span>
      </div>

      {school.locations.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          {school.locations.map((loc) => (
            <span key={loc} className="inline-flex items-center gap-1">
              <PinIcon className="h-3.5 w-3.5" />
              {loc}
            </span>
          ))}
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-3">
        <Link
          href={`/szkoly/${encodeURIComponent(school.name)}`}
          className="inline-block w-fit rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          Zobacz profil szkoły →
        </Link>
        <a href={school.homepage} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:text-accent-peach">
          Strona szkoły ↗
        </a>
      </div>
    </div>
  );
}
