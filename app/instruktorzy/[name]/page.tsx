import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentSchedule, getInstructors } from "@/lib/db";
import { splitInstructors, nextOccurrences, pluralizeClasses, schoolTextClass } from "@/lib/schedule";
import { Header } from "@/components/Header";
import { UpcomingClassList } from "@/components/UpcomingClassList";
import { PersonIcon } from "@/components/icons";
import { InstructorFollowButton } from "@/components/InstructorFollowButton";

export const dynamic = "force-dynamic";

export default async function InstructorProfilePage({ params }: { params: Promise<{ name: string }> }) {
  const { name: rawName } = await params;
  const name = decodeURIComponent(rawName);
  const schedule = getCurrentSchedule();
  const classes = schedule.filter((r) => splitInstructors(r.instructor).includes(name));
  if (classes.length === 0) notFound();
  const profile = getInstructors().find((item) => item.name === name);

  const schools = Array.from(new Set(classes.map((c) => c.school))).sort((a, b) => a.localeCompare(b, "pl"));
  const styles = Array.from(new Set(classes.map((c) => c.danceStyle).filter(Boolean)));
  const levels = Array.from(new Set(classes.map((c) => c.level).filter((l): l is string => Boolean(l))));
  const photoUrl = profile?.photoUrl ?? classes.map((c) => c.instructorPhotos?.[name]).find(Boolean);
  const classBio = classes.find((item) => item.instructorBio)?.instructorBio;
  const bio = profile?.bio ?? classBio;
  const fallbackBio = [
    styles.length > 0 ? `${name} prowadzi zajęcia: ${styles.join(", ")}.` : undefined,
    levels.length > 0 ? `W grafiku znajdziesz grupy na poziomach: ${levels.join(", ")}.` : undefined,
  ].filter(Boolean).join(" ");
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
          <p className="mt-0.5 text-sm font-medium">
            {schools.map((s, i) => (
              <span key={s}>
                {i > 0 && ", "}
                <Link href={`/szkoly/${encodeURIComponent(s)}`} className={`${schoolTextClass(s)} hover:opacity-80`}>
                  {s}
                </Link>
              </span>
            ))}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {classes.length} {pluralizeClasses(classes.length)} w grafiku
          </p>
          <InstructorFollowButton name={name} />
        </div>
      </div>

      <section className="rounded-xl border border-line bg-zinc-900/60 p-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">O instruktorze</h2>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{bio || fallbackBio}</p>
        {profile?.profileUrl && (
          <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-semibold text-accent hover:text-accent-peach">
            Oficjalny profil na stronie szkoły ↗
          </a>
        )}
      </section>

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Aktualny grafik zajęć</h2>
          <span className="text-xs text-muted">{upcoming.length} najbliższych terminów</span>
        </div>
        <UpcomingClassList items={upcoming} allRows={schedule} />
      </section>

      <div className="flex flex-wrap gap-3 text-xs">
        <Link href={`/grafik?instructor=${encodeURIComponent(name)}`} className="font-semibold text-accent hover:text-accent-peach">
          Wszystkie zajęcia {name} →
        </Link>
        {schools.map((school) => (
          <Link key={school} href={`/grafik?school=${encodeURIComponent(school)}`} className={`font-semibold hover:opacity-80 ${schoolTextClass(school)}`}>
            Pełny grafik: {school} →
          </Link>
        ))}
      </div>
    </div>
  );
}
