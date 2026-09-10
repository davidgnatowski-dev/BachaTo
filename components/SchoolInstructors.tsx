import Link from "next/link";
import { PersonIcon } from "@/components/icons";

export interface SchoolInstructorSummary {
  name: string;
  photoUrl?: string;
  primaryStyle?: string;
}

/** Hidden entirely when the school has no instructors currently in the schedule. */
export function SchoolInstructors({ instructors }: { instructors: SchoolInstructorSummary[] }) {
  if (instructors.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Instruktorzy</h2>
      <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {instructors.map((instructor) => (
          <Link
            key={instructor.name}
            href={`/instruktorzy/${encodeURIComponent(instructor.name)}`}
            className="flex w-32 shrink-0 flex-col items-center gap-2.5 text-center transition-opacity hover:opacity-80"
          >
            {instructor.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
              <img src={instructor.photoUrl} alt="" className="h-[90px] w-[90px] rounded-full object-cover" />
            ) : (
              <span className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-zinc-800 text-muted">
                <PersonIcon className="h-9 w-9" />
              </span>
            )}
            <div className="min-w-0">
              <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-foreground">{instructor.name}</p>
              {instructor.primaryStyle && (
                <p className="line-clamp-2 break-words text-xs leading-snug text-violet">{instructor.primaryStyle}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
