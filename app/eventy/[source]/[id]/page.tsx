import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCompetitionChildren, getEventBySourceAndId, getEventRsvp, getRelatedEvents, getUserEventProgramActivity, hasUserAttendedEvent } from "@/lib/db";
import { CATEGORY_LABELS, categoryStyle, eventProgramFavoriteId, formatEventDateRange } from "@/lib/events";
import { toLocalIsoDate } from "@/lib/format";
import { Header } from "@/components/Header";
import { AddEventToCalendarButton } from "@/components/AddEventToCalendarButton";
import { EventAttendanceButton } from "@/components/EventAttendanceButton";
import { EventPlanControls } from "@/components/EventPlanControls";
import { EventStructuredDetails } from "@/components/EventStructuredDetails";
import { EventGoingButton } from "@/components/EventGoingButton";
import { EventCard } from "@/components/EventCard";
import { EventCoverImage } from "@/components/EventCoverImage";
import { OrganizerBadge } from "@/components/OrganizerBadge";
import { CalendarIcon, CheckIcon, PinIcon, TicketIcon } from "@/components/icons";

export const dynamic = "force-dynamic";

function competitionRoleCount(count: number | undefined, role: "Leader" | "Follower"): string {
  const value = count ?? 0;
  return `${value} ${value === 1 ? role : `${role}ów`}`;
}

export default async function EventDetailPage({ params }: { params: Promise<{ source: string; id: string }> }) {
  const { source: encodedSource, id: rawId } = await params;
  let source = encodedSource;
  try {
    source = decodeURIComponent(encodedSource);
  } catch {
    notFound();
  }
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const event = getEventBySourceAndId(source, id);
  if (!event) notFound();

  const user = await getCurrentUser();
  const attended = user ? hasUserAttendedEvent(user.id, event.source, event.id) : false;
  const programActivity = user ? getUserEventProgramActivity(user.id) : [];
  const attendedProgramKeys = new Set(programActivity.map((entry) => entry.sessionKey));
  const attendedSessionIds = (event.programItems ?? []).filter((item) => attendedProgramKeys.has(eventProgramFavoriteId(event.source, event.id, item.id))).map((item) => item.id);
  const rsvp = getEventRsvp(event.source, event.id, user?.id);
  const related = getRelatedEvents(event);
  const competitionChildren = getCompetitionChildren(event);
  const canConfirm = event.startDate <= toLocalIsoDate(new Date());
  const colors = categoryStyle(event.category);
  const location = [event.venue, event.address, event.city].filter(Boolean).join(", ");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <nav className="flex items-center gap-2 text-xs text-muted" aria-label="Okruszki">
        <Link href="/eventy" className="hover:text-accent">Wydarzenia</Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-zinc-300">{event.title}</span>
      </nav>

      <article className="overflow-hidden rounded-3xl border border-line bg-zinc-900/55 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="relative min-h-72 self-start bg-zinc-950 lg:min-h-[520px] lg:max-h-[640px]">
            {event.coverImage ? (
              <EventCoverImage src={event.coverImage} loading="eager" paddingClassName="p-3 sm:p-5 lg:p-8" />
            ) : (
              <div className={`absolute inset-0 flex items-center justify-center ${colors.bg}`}>
                <TicketIcon className={`h-24 w-24 opacity-40 ${colors.text}`} />
              </div>
            )}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
            <div className="absolute bottom-6 right-6 z-20 sm:bottom-8 sm:right-8">
              <OrganizerBadge organizer={event.organizer} competitionSeries={event.competitionSeries} className="h-9 w-9" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 sm:p-8">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
                {CATEGORY_LABELS[event.category]}
              </span>
              <h1 className="mt-3 max-w-3xl font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl pr-12">{event.title}</h1>
              {event.organizer && <p className="mt-2 text-sm text-zinc-300">Organizator: {event.organizer}</p>}
            </div>
          </div>

          <aside className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl bg-violet/10 p-2 text-violet"><CalendarIcon className="h-5 w-5" /></span>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">{competitionChildren.length > 0 ? "Okres eliminacji" : "Termin"}</p><p className="mt-1 font-semibold text-zinc-100">{formatEventDateRange(event)}</p></div>
              </div>
              {location && (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-xl bg-accent/10 p-2 text-accent"><PinIcon className="h-5 w-5" /></span>
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Miejsce</p><p className="mt-1 text-sm leading-relaxed text-zinc-200">{location}</p></div>
                </div>
              )}
            </div>

            {event.category === "competition" && (
              <div className="rounded-2xl border border-sky-700/35 bg-sky-950/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">Jak wziąć udział</p>
                {competitionChildren.length > 0 ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      To cykl {competitionChildren.length} eliminacji. Wybierz jedną z nich, a następnie otwórz jej oficjalną stronę i dokonaj indywidualnego zgłoszenia.
                    </p>
                    <a href="#eliminacje" className="mt-3 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400">
                      Zobacz eliminacje ↓
                    </a>
                  </>
                ) : (
                  <>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
                      {event.registrationStatus && <span>{event.registrationStatus === "open" ? "Zapisy otwarte" : event.registrationStatus === "closed" ? "Zapisy zamknięte" : "Zapisy jeszcze nieaktywne"}</span>}
                      {event.registrationPrice && <span>Opłata: {event.registrationPrice}</span>}
                    </div>
                    {(event.qualifyingSpotsLeaders || event.qualifyingSpotsFollowers) && (
                      <p className="mt-2 text-xs leading-5 text-sky-200">
                        Awans: {competitionRoleCount(event.qualifyingSpotsLeaders, "Leader")} i {competitionRoleCount(event.qualifyingSpotsFollowers, "Follower")}.
                      </p>
                    )}
                    <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400">
                      Sprawdź zapisy u organizatora ↗
                    </a>
                  </>
                )}
              </div>
            )}

            <div className="h-px bg-line" />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Zaplanuj</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">Zapisz wydarzenie w BachaTo albo wyślij termin do swojego kalendarza.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <EventPlanControls row={event} />
                <AddEventToCalendarButton row={event} />
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300"><CheckIcon className="h-4 w-4" />Twoja aktywność</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">Po wydarzeniu potwierdź udział. Trafi ono do statystyk wraz z nazwą, datą i kategorią.</p>
              <div className="mt-4"><EventAttendanceButton source={event.source} eventId={event.id} attended={attended} canConfirm={canConfirm} loggedIn={Boolean(user)} /></div>
            </div>

            <div className="rounded-2xl border border-violet/20 bg-violet/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet">Społeczność</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">Opcjonalnie pokaż, że się wybierasz. Publicznie wyświetlamy tylko osoby z włączonym profilem społecznościowym.</p>
              <div className="mt-4"><EventGoingButton source={event.source} eventId={event.id} loggedIn={Boolean(user)} initialAttending={rsvp.attending} initialCount={rsvp.count} publicNames={rsvp.names} /></div>
            </div>
          </aside>
        </div>
      </article>

      {competitionChildren.length > 0 && (
        <section id="eliminacje" className="scroll-mt-6 rounded-3xl border border-sky-800/50 bg-sky-950/15 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">Jak wystartować</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold text-zinc-50">Wybierz konkretną eliminację</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-300">
            Podany wyżej zakres dat obejmuje cały cykl. Rejestracja odbywa się osobno na każdą eliminację — użyj przycisku „Oryginalna strona” na wybranej karcie.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {competitionChildren.map((row) => <EventCard key={`${row.source}-${row.id}`} row={row} />)}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <EventStructuredDetails event={event} loggedIn={Boolean(user)} attendedSessionIds={attendedSessionIds} />
        <aside className="rounded-2xl border border-line bg-zinc-900/45 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Źródło informacji</p>
          <p className="mt-2 text-sm text-zinc-300">Dane pochodzą ze źródła: {event.source}.</p>
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-500">
            Otwórz stronę organizatora ↗
          </a>
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">Znasz to wydarzenie?</p>
            <p className="mt-2 text-sm leading-6 text-muted">Pomóż nam utrzymać aktualny program i miejsce.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href={`/dla-organizatorow?kind=correction&event=${encodeURIComponent(`${event.source}-${event.id}`)}&title=${encodeURIComponent(event.title)}`} className="text-sm font-semibold text-accent hover:text-accent-peach">Zgłoś poprawkę →</Link>
              <Link href={`/dla-organizatorow?kind=claim&event=${encodeURIComponent(`${event.source}-${event.id}`)}&title=${encodeURIComponent(event.title)}`} className="text-sm font-semibold text-violet hover:text-accent">Jestem organizatorem →</Link>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section>
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-violet">W tym samym rytmie</p><h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Powiązane wydarzenia</h2></div><Link href="/eventy" className="text-xs font-semibold text-accent">Wszystkie wydarzenia →</Link></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((row) => <EventCard key={`${row.source}-${row.id}`} row={row} />)}</div>
        </section>
      )}
    </div>
  );
}
