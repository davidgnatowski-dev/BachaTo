import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getRecentPlannedEvents, getUserActivity, getUserEventActivity, getUserEventProgramActivity, getUserFavorites, type UserFavoriteRow } from "@/lib/db";
import { computeActivityStats, confirmedActivityOnly } from "@/lib/activityStats";
import { computeBadges, weekStreak, DEFAULT_WEEKLY_GOAL } from "@/lib/badges";
import { BadgesGrid } from "@/components/BadgesGrid";
import { SummaryNarrative } from "@/components/SummaryNarrative";
import { CATEGORY_LABELS, eventHref, isDancePracticeEvent } from "@/lib/events";
import { classifyLevel, levelStyle, LEVEL_BUCKET_ICONS } from "@/lib/level";
import { Header } from "@/components/Header";
import { LocalStatsSummary } from "@/components/LocalStatsSummary";
import { ActivityList } from "@/components/ActivityList";
import { YearSummaryCard } from "@/components/YearSummaryCard";
import { EventAttendanceButton } from "@/components/EventAttendanceButton";

export const dynamic = "force-dynamic";

function countFavorites(rows: UserFavoriteRow[]) {
  const counts = { likedClasses: 0, likedEvents: 0, plannedClasses: 0, plannedEvents: 0, plannedSessions: 0 };
  for (const r of rows) {
    if (r.itemType === "class" && r.kind === "liked") counts.likedClasses++;
    else if (r.itemType === "event" && r.kind === "liked") counts.likedEvents++;
    else if (r.itemType === "class" && r.kind === "planned") counts.plannedClasses++;
    else if (r.itemType === "event" && r.kind === "planned") counts.plannedEvents++;
    else if (r.itemType === "event_session" && r.kind === "planned") counts.plannedSessions++;
  }
  return counts;
}

export default async function PodsumowaniePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Twoje podsumowanie</h1>
          <p className="mt-1 text-sm text-muted">
            Zajęcia, wydarzenia i praktyka taneczna w jednym miejscu — liczone z aktywności, które potwierdzisz po ich rozpoczęciu.
          </p>
        </div>
        <Link
          href="/konto/dodaj-aktywnosc"
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark"
        >
          + Dodaj aktywność
        </Link>
      </header>

      {!user && (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-200">
            Statystyki poniżej liczone są tylko z tej przeglądarki. Załóż konto, żeby zapisać je na stałe i widzieć na
            każdym urządzeniu.
          </p>
          <div className="flex shrink-0 gap-2">
            <Link href="/rejestracja" className="rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark">
              Załóż konto
            </Link>
            <Link href="/logowanie" className="rounded-full border border-line px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500">
              Zaloguj się
            </Link>
          </div>
        </div>
      )}

      {user ? <AccountStats userId={user.id} /> : <LocalStatsSummary />}
    </div>
  );
}

function AccountStats({ userId }: { userId: number }) {
  const activityAll = getUserActivity(userId);
  // Provisional (auto-marked, unconfirmed) attendances still show in the list
  // below so the user can confirm them — but they don't count in any stat.
  const activity = confirmedActivityOnly(activityAll);
  const eventActivity = getUserEventActivity(userId);
  const programActivity = getUserEventProgramActivity(userId);
  const workshopMinutes = programActivity.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  const workshopHours = Math.round((workshopMinutes / 60) * 10) / 10;
  const attendedEventKeys = new Set(eventActivity.map((entry) => entry.eventKey));
  const eventsToConfirm = getRecentPlannedEvents(userId).filter((event) => !attendedEventKeys.has(`${event.source}-${event.id}`));
  const favorites = getUserFavorites(userId);
  const stats = computeActivityStats(activity);
  const favCounts = countFavorites(favorites);
  const levelBucket = stats.favoriteLevel ? classifyLevel(stats.favoriteLevel) : undefined;
  const levelColors = levelBucket ? levelStyle(levelBucket) : undefined;
  const year = new Date().getFullYear();
  const yearPrefix = `${year}-`;
  // Everything on the year card must be scoped to the same year — classes,
  // dance hours, workshop hours, events and practices alike.
  const yearStats = computeActivityStats(activity.filter((entry) => entry.dateIso.startsWith(yearPrefix)));
  const eventActivityYear = eventActivity.filter((entry) => entry.dateIso.startsWith(yearPrefix));
  const programActivityYear = programActivity.filter((entry) => entry.dateIso.startsWith(yearPrefix));
  const workshopHoursYear = Math.round((programActivityYear.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0) / 60) * 10) / 10;
  const practiceCountYear = eventActivityYear.filter(isDancePracticeEvent).length;
  const practiceCount = eventActivity.filter(isDancePracticeEvent).length;
  const festivalAndTripCount = eventActivity.filter((entry) => entry.category === "festival" || entry.category === "trip").length;
  const eventCities = new Set(eventActivity.map((entry) => entry.city).filter(Boolean)).size;

  // --- Narrative + badges + this-month + weekly goal ---
  const activityDates = activity.map((entry) => entry.dateIso);
  const streak = weekStreak(activityDates);
  const lifetimeHours = Math.round((stats.totalHours + workshopHours) * 10) / 10;
  const badges = computeBadges({
    activityDates,
    totalHours: lifetimeHours,
    schoolCount: new Set(activity.map((entry) => entry.school).filter(Boolean)).size,
    eventCount: eventActivity.length,
    streak,
  });
  const now = new Date();
  const monthPrefix = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthActivity = activity.filter((entry) => entry.dateIso.startsWith(monthPrefix));
  const monthStats = computeActivityStats(monthActivity, now);
  const monthEventCount = eventActivity.filter((entry) => entry.dateIso.startsWith(monthPrefix)).length;
  const monthLabel = now.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  const goalDone = stats.thisWeekCount;

  return (
    <div className="flex flex-col gap-6">
      <YearSummaryCard year={year} classes={yearStats.totalClasses} hours={Math.round((yearStats.totalHours + workshopHoursYear) * 10) / 10} events={eventActivityYear.length} practice={practiceCountYear} school={yearStats.favoriteSchool} instructor={yearStats.favoriteInstructor} style={yearStats.favoriteDanceStyle} />

      <SummaryNarrative
        totalActivities={stats.totalClasses}
        totalHours={lifetimeHours}
        favoriteInstructor={stats.favoriteInstructor}
        favoriteSchool={stats.favoriteSchool}
        streak={streak}
      />
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted">Łącznie w historii</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Godziny tańca", value: stats.totalHours },
          { label: "Godziny warsztatów", value: workshopHours },
          { label: "Odbyte zajęcia", value: stats.totalClasses },
          { label: "Ten miesiąc", value: stats.thisMonthCount },
          { label: "Ten tydzień", value: stats.thisWeekCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-zinc-900/60 p-4 text-center">
            <p className="font-heading text-2xl font-bold text-accent">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-zinc-900/45 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Cel tygodnia</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-heading text-3xl font-bold text-zinc-50">{goalDone}</span>
            <span className="pb-1 text-sm text-muted">/ {DEFAULT_WEEKLY_GOAL} aktywności</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.min(100, Math.round((goalDone / DEFAULT_WEEKLY_GOAL) * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            {goalDone >= DEFAULT_WEEKLY_GOAL ? "Cel osiągnięty w tym tygodniu 🎉" : `Jeszcze ${DEFAULT_WEEKLY_GOAL - goalDone}, żeby domknąć tydzień.`}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-zinc-900/45 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Ten miesiąc · {monthLabel}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { value: monthStats.totalClasses, label: "aktywności" },
              { value: monthStats.totalHours, label: "godzin" },
              { value: monthEventCount, label: "wydarzeń" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-zinc-950/50 p-2.5">
                <p className="font-heading text-xl font-bold text-accent">{s.value}</p>
                <p className="mt-0.5 text-[10px] text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          {monthStats.favoriteInstructor && (
            <p className="mt-3 text-xs text-muted">Najczęściej: {monthStats.favoriteInstructor}</p>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-line bg-zinc-900/45 p-5">
        <BadgesGrid badges={badges} />
      </section>

      {(stats.favoriteInstructor || stats.favoriteSchool || stats.favoriteLevel) && (
        <div className="flex flex-wrap gap-2">
          {stats.favoriteInstructor && (
            <Link
              href={`/instruktorzy/${encodeURIComponent(stats.favoriteInstructor)}`}
              className="rounded-full border border-violet/40 bg-violet/10 px-3 py-1.5 text-xs font-semibold text-violet hover:bg-violet/20"
            >
              Ulubiony instruktor: {stats.favoriteInstructor}
            </Link>
          )}
          {stats.favoriteSchool && (
            <Link
              href={`/szkoly/${encodeURIComponent(stats.favoriteSchool)}`}
              className="rounded-full border border-line bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
            >
              Ulubiona szkoła: {stats.favoriteSchool}
            </Link>
          )}
          {stats.favoriteLevel && levelColors && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${levelColors.bg} ${levelColors.text} ${levelColors.ring}`}
            >
              <span aria-hidden="true">{levelBucket ? LEVEL_BUCKET_ICONS[levelBucket] : ""}</span>
              Najczęstszy poziom: {stats.favoriteLevel}
            </span>
          )}
        </div>
      )}

      <section className="rounded-2xl border border-line bg-zinc-900/45 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Wydarzenia</p>
            <h2 className="mt-1 font-heading text-lg font-semibold text-zinc-50">Eventy i praktyka taneczna</h2>
          </div>
          <Link href="/eventy" className="text-xs font-semibold text-accent hover:text-accent-peach">Znajdź wydarzenie →</Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Zaliczone wydarzenia", value: eventActivity.length },
            { label: "Praktyka taneczna", value: practiceCount },
            { label: "Festiwale i wyjazdy", value: festivalAndTripCount },
            { label: "Miasta", value: eventCities },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-line bg-zinc-950/45 p-4 text-center">
              <p className="font-heading text-2xl font-bold text-accent">{stat.value}</p>
              <p className="mt-1 text-xs text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        {eventActivity.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">Po wydarzeniu otwórz jego stronę i kliknij „Byłem/am na tym wydarzeniu”. Tutaj pojawi się liczba oraz lista zaliczonych eventów.</p>
        ) : (
          <div className="mt-5 divide-y divide-line">
            {eventActivity.slice(0, 8).map((entry) => (
              <div key={entry.eventKey} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link href={eventHref({ source: entry.source, id: entry.eventId })} className="text-sm font-semibold text-zinc-100 hover:text-accent">{entry.title}</Link>
                  <p className="mt-0.5 text-xs text-muted">{CATEGORY_LABELS[entry.category]}{entry.city ? ` · ${entry.city}` : ""}</p>
                </div>
                <time className="text-xs text-muted" dateTime={entry.dateIso}>{new Date(`${entry.dateIso}T12:00:00`).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" })}</time>
              </div>
            ))}
          </div>
        )}
      </section>

      {programActivity.length > 0 && (
        <section className="rounded-2xl border border-line bg-zinc-900/45 p-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Warsztaty</p><h2 className="mt-1 font-heading text-lg font-semibold text-zinc-50">Zaliczone punkty programu</h2></div>
          <div className="mt-4 divide-y divide-line">
            {programActivity.slice(0, 10).map((entry) => (
              <div key={entry.sessionKey} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1"><Link href={`${eventHref({ source: entry.source, id: entry.eventId })}#program`} className="text-sm font-semibold text-zinc-100 hover:text-accent">{entry.title}</Link><p className="mt-0.5 truncate text-xs text-muted">{entry.eventTitle}{entry.instructors ? ` · ${entry.instructors}` : ""}</p></div>
                <span className="shrink-0 text-xs text-zinc-300">{Math.round(((entry.durationMinutes ?? 0) / 60) * 10) / 10} h</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {eventsToConfirm.length > 0 && (
        <section className="rounded-2xl border border-accent/25 bg-accent/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Do potwierdzenia</p>
          <h2 className="mt-1 font-heading text-lg font-semibold text-zinc-50">Które wydarzenia zaliczyłeś/aś?</h2>
          <p className="mt-1 text-sm text-muted">Pokazujemy wydarzenia z Twojego planu z ostatnich 90 dni.</p>
          <div className="mt-4 divide-y divide-accent/15">
            {eventsToConfirm.map((event) => (
              <div key={`${event.source}-${event.id}`} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <Link href={eventHref(event)} className="text-sm font-semibold text-zinc-100 hover:text-accent">{event.title}</Link>
                  <p className="mt-0.5 text-xs text-muted">{CATEGORY_LABELS[event.category]} · {new Date(`${event.startDate}T12:00:00`).toLocaleDateString("pl-PL")}</p>
                </div>
                <EventAttendanceButton source={event.source} eventId={event.id} attended={false} canConfirm loggedIn />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Zajęcia w planie", value: favCounts.plannedClasses },
          { label: "Wydarzenia w planie", value: favCounts.plannedEvents },
          { label: "Warsztaty w planie", value: favCounts.plannedSessions },
          { label: "Polubione zajęcia", value: favCounts.likedClasses },
          { label: "Polubione wydarzenia", value: favCounts.likedEvents },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-zinc-900/60 p-4 text-center">
            <p className="font-heading text-xl font-bold text-zinc-100">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900/60 p-4">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-zinc-50">Ostatnia aktywność</h2>
        <ActivityList initialEntries={activityAll.map((entry) => ({ ...entry, instructor: entry.instructor ?? undefined, level: entry.level ?? undefined, danceStyle: entry.danceStyle ?? undefined, durationMinutes: entry.durationMinutes ?? undefined, rating: entry.rating ?? undefined, note: entry.note ?? undefined, activityType: entry.activityType ?? undefined, type: "class" as const }))} />
      </section>

    </div>
  );
}
