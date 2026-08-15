import Link from "next/link";
import type { InstructorProfile } from "@/lib/db";
import { PersonIcon } from "@/components/icons";
import { pluralizeClasses } from "@/lib/schedule";

export function InstructorCard({ instructor }: { instructor: InstructorProfile }) {
  return (
    <Link
      href={`/instruktorzy/${encodeURIComponent(instructor.name)}`}
      className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-colors hover:border-zinc-600"
    >
      <div className="flex items-center gap-3">
        {instructor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
          <img src={instructor.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-muted">
            <PersonIcon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold leading-snug text-zinc-50">{instructor.name}</p>
          <p className="mt-0.5 text-xs text-violet">{instructor.schools.join(", ")}</p>
          <p className="mt-0.5 text-xs text-muted">
            {instructor.classCount} {pluralizeClasses(instructor.classCount)} w grafiku
          </p>
        </div>
      </div>
      {instructor.bio && <p className="line-clamp-3 whitespace-pre-line text-sm text-zinc-300">{instructor.bio}</p>}
    </Link>
  );
}
