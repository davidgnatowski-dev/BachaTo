import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentSchedule } from "@/lib/db";
import { splitInstructors, nextOccurrences, pluralizeClasses } from "@/lib/schedule";
import { Header } from "@/components/Header";
import { UpcomingClassList } from "@/components/UpcomingClassList";
import { PersonIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function InstructorProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const schedule = getCurrentSchedule();
  const classes = schedule.filter((r) => splitInstructors(r.instructor).includes(name));
  if (classes.length === 0) notFound();

  const schools = Array.from(new Set(classes.map((c) => c.school))).sort((a, b) => a.localeCompare(b, "pl"));
  const styles = Array.from(new Set(classes.map((c) => c.danceStyle).filter(Boolean)));
  const levels = Array.from(new Set(classes.map((c) => c.level).filter((l): l is string => Boolean(l))));
  const photoUrl = classes.map((c) => c.instructorPhotos?.[name]).find(Boolean);
  const bio = classes.find((c) => c.instructorBio && splitInstructors(c.instructor).length === 1)?.instructorBio;
  const upcoming = nextOccurrences(classes, new Date(), 50);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <div className="flex items-start gap-4">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable remote host per school
          <img src={photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-muted">
            <PersonIcon className="h-8 w-8" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">{name}</h1>
          <p className="mt-0.5 text-sm font-medium text-violet">
            {schools.map((s, i) => (
              <span key={s}>
                {i > 0 && ", "}
                <Link href={`/szkoly/${encodeURIComponent(s)}`} className="hover:text-violet/80">
                  {s}
                </Link>
              </span>
            ))}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {classes.length} {pluralizeClasses(classes.length)} w grafiku
          </p>
        </div>
      </div>

      {bio && <p className="whitespace-pre-line text-sm text-zinc-300">{bio}</p>}

      {(levels.length > 0 || styles.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {levels.map((l) => (
            <span key={l} className="rounded-full border border-violet/40 px-2 py-0.5 text-xs text-violet">
              {l}
            </span>
          ))}
          {styles.map((s) => (
            <span key={s} className="rounded-full bg-zinc-800/60 px-2 py-0.5 text-xs text-zinc-400">
              {s}
            </span>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Nadchodzące zajęcia</h2>
        <UpcomingClassList items={upcoming} allRows={schedule} />
      </section>

      <p className="text-xs text-muted">
        Social media i rozszerzony publiczny profil pojawią się tutaj, gdy szkoły zaczną udostępniać te dane.
      </p>
    </div>
  );
}
