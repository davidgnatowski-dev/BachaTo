import Link from "next/link";
import type { InstructorProfile } from "@/lib/db";
import { pluralizeClasses, schoolTextClass } from "@/lib/schedule";
import { InstructorAvatar } from "@/components/InstructorAvatar";

export function InstructorCard({ instructor }: { instructor: InstructorProfile }) {
  const summary = instructor.bio ?? [
    instructor.styles.length > 0 ? `Prowadzi: ${instructor.styles.slice(0, 3).join(", ")}.` : undefined,
    instructor.levels.length > 0 ? `Poziomy: ${instructor.levels.slice(0, 3).join(", ")}.` : undefined,
  ].filter(Boolean).join(" ");

  return (
    <Link
      href={`/instruktorzy/${encodeURIComponent(instructor.name)}`}
      className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-zinc-600"
    >
      <div className="flex items-center gap-3">
        <InstructorAvatar name={instructor.name} photoUrl={instructor.photoUrl} sizeClassName="h-14 w-14" linked={false} />
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold leading-snug text-zinc-50">{instructor.name}</p>
          <p className="mt-0.5 text-xs">{instructor.schools.map((school, index) => <span key={school} className={schoolTextClass(school)}>{index > 0 && ", "}{school}</span>)}</p>
          <p className="mt-0.5 text-xs text-muted">
            {instructor.classCount} {pluralizeClasses(instructor.classCount)} w grafiku
          </p>
        </div>
      </div>
      {summary && <p className="line-clamp-3 whitespace-pre-line text-sm text-zinc-300">{summary}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-accent">Zobacz profil i grafik →</span>
        {instructor.profileUrl && <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">Dane szkoły</span>}
      </div>
    </Link>
  );
}
