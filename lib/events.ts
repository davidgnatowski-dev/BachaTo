import type { EventCategory, EventRow } from "./types";

/** Every non-school scrape_runs source that feeds the events pages — used both to display per-source status and to exclude these from any "schools" listing. */
export const EVENT_SOURCES = ["Tensy", "Społeczność", "Szkoły", "Bachata Social World Cup"] as const;

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  festival: "Festiwal",
  trip: "Wyjazd",
  social: "Praktyka taneczna",
  competition: "Zawody",
};

export const CATEGORY_ORDER: EventCategory[] = ["festival", "trip", "social", "competition"];

export const CATEGORY_SECTION_TITLES: Record<EventCategory, string> = {
  festival: "Festiwale",
  trip: "Wyjazdy i obozy",
  social: "Praktyka taneczna — sociale i praktisy",
  competition: "Zawody",
};

const CATEGORY_STYLES: Record<EventCategory, { bg: string; text: string; ring: string }> = {
  festival: { bg: "bg-fuchsia-950/60", text: "text-fuchsia-400", ring: "ring-fuchsia-800/60" },
  trip: { bg: "bg-emerald-950/60", text: "text-emerald-400", ring: "ring-emerald-800/60" },
  social: { bg: "bg-orange-950/60", text: "text-orange-400", ring: "ring-orange-800/60" },
  competition: { bg: "bg-sky-950/60", text: "text-sky-400", ring: "ring-sky-800/60" },
};

export function categoryStyle(category: EventCategory) {
  return CATEGORY_STYLES[category];
}

export function eventHref(row: Pick<EventRow, "source" | "id">): string {
  return `/eventy/${encodeURIComponent(row.source)}/${row.id}`;
}

export function eventProgramFavoriteId(source: string, eventId: number, sessionId: string): string {
  return `${encodeURIComponent(source)}|${eventId}|${encodeURIComponent(sessionId)}`;
}

export function relativeEventLabel(startDate: string, now: Date = new Date()): string | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(`${startDate}T00:00:00`);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "DZIŚ";
  if (diff === 1) return "JUTRO";
  if (diff > 1 && diff <= 7) return `ZA ${diff} DNI`;
  return null;
}

/** Removes price/payment blocks copied from source descriptions and keeps the useful introduction readable. */
export function cleanEventDescription(description?: string): string | undefined {
  if (!description) return undefined;
  const lines = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const safe: string[] = [];
  for (const line of lines) {
    if (/^(cennik|jak kupić|bilety|cena|opłata|płatność|przelew|konto bankowe)\b/i.test(line)) break;
    if (/\bPLN\b|\b\d+\s*zł\b|\b\d{2}\s*\d{4}\s*\d{4}\s*\d{4}/i.test(line)) continue;
    safe.push(line);
    if (safe.join("\n").length >= 2600) break;
  }
  const text = safe.join("\n").slice(0, 2800).trim();
  return text || undefined;
}

export function isDancePracticeEvent(row: Pick<EventRow, "category">): boolean {
  return row.category === "social";
}

/**
 * A denylist (not an allowlist) of other partner-dance styles. Schools' own
 * event pages list every kind of night they run — Abra Studio's "Abra del
 * Tango", kizomba socials, salsa-cubana parties — and this app is
 * bachata-only. A denylist is safer than requiring the word "bachata":
 * bachata nights are often themed ("Feel This", "Roots & Vibes") and don't
 * always say so in the title. Plain "salsa" is deliberately absent —
 * "Salsa & Bachata" nights are legitimately in scope.
 */
// A leading \b keeps "bachata" from matching, a trailing \w* catches the
// glued-together names these schools use ("ZoukAbra", "TangoAbra").
const NON_BACHATA_EVENT_PATTERN =
  /\b(tango|milonga|kizomb|zouk|west\s*coast\s*swing|wcs|forr[oó]|lindy|balboa|rueda|salsa\s*cubana|mambo)\w*/i;

export function isLikelyNonBachataEvent(text: string | null | undefined): boolean {
  return NON_BACHATA_EVENT_PATTERN.test(text ?? "");
}

function formatDatePl(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** "14–16.08.2026" for multi-day events spanning the same month, "13.08.2026" for single-day. */
export function formatEventDateRange(row: Pick<EventRow, "startDate" | "endDate">): string {
  if (!row.endDate || row.endDate === row.startDate) return formatDatePl(row.startDate);

  const [sy, sm, sd] = row.startDate.split("-");
  const [ey, em, ed] = row.endDate.split("-");
  if (sy === ey && sm === em) return `${sd}–${ed}.${sm}.${sy}`;
  if (sy === ey) return `${sd}.${sm}–${ed}.${em}.${sy}`;
  return `${formatDatePl(row.startDate)} – ${formatDatePl(row.endDate)}`;
}

/**
 * A Google Calendar "quick add" link — no login/OAuth on our side, no API
 * keys, no token storage. It opens Calendar's own add-event screen
 * pre-filled, in whichever Google account the visitor is already signed
 * into in their browser; they still hit Calendar's own "Save" button.
 */
export function googleCalendarUrl(
  row: Pick<EventRow, "title" | "startDate" | "endDate" | "description" | "venue" | "address" | "city" | "sourceUrl">
): string {
  const start = row.startDate.replaceAll("-", "");
  // Pure UTC calendar-date arithmetic — a local-time Date here would let
  // toISOString() shift the +1 day back across midnight in timezones ahead
  // of UTC (e.g. Poland), silently dropping the last day of the event.
  const [ey, em, ed] = (row.endDate ?? row.startDate).split("-").map(Number);
  const endExclusive = new Date(Date.UTC(ey, em - 1, ed + 1));
  const end = endExclusive.toISOString().slice(0, 10).replaceAll("-", "");

  const location = [row.venue, row.address, row.city].filter(Boolean).join(", ");
  const details = [row.description, row.sourceUrl].filter(Boolean).join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: row.title,
    dates: `${start}/${end}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function eventEndExclusive(row: Pick<EventRow, "startDate" | "endDate">): string {
  const [year, month, day] = (row.endDate ?? row.startDate).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function eventLocation(row: Pick<EventRow, "venue" | "address" | "city">): string {
  return [row.venue, row.address, row.city].filter(Boolean).join(", ");
}

export function outlookCalendarUrl(
  row: Pick<EventRow, "title" | "startDate" | "endDate" | "description" | "venue" | "address" | "city" | "sourceUrl">
): string {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: row.title,
    startdt: row.startDate,
    enddt: eventEndExclusive(row),
    allday: "true",
    location: eventLocation(row),
    body: [row.description, row.sourceUrl].filter(Boolean).join("\n\n"),
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function icsForEvent(
  row: Pick<EventRow, "source" | "id" | "title" | "startDate" | "endDate" | "description" | "venue" | "address" | "city" | "sourceUrl">
): string {
  const start = row.startDate.replaceAll("-", "");
  const end = eventEndExclusive(row).replaceAll("-", "");
  const location = eventLocation(row);
  const description = [row.description, row.sourceUrl].filter(Boolean).join("\n\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BachaTo//PL",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:event-${row.source}-${row.id}@bachato.pl`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${escapeIcs(row.title)}`,
    description ? `DESCRIPTION:${escapeIcs(description)}` : undefined,
    location ? `LOCATION:${escapeIcs(location)}` : undefined,
    `URL:${row.sourceUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => Boolean(line)).join("\r\n");
}

export function groupByCategory(rows: EventRow[]): Map<EventCategory, EventRow[]> {
  const groups = new Map<EventCategory, EventRow[]>();
  for (const row of rows) {
    if (!groups.has(row.category)) groups.set(row.category, []);
    groups.get(row.category)!.push(row);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  return groups;
}

/**
 * Loose title+date dedup key — different sources rarely agree on exact
 * title strings for the same real-world event ("Bachata Libre Competition"
 * on Tensy vs "Bachata Libre Competition 2027" on the school's own site), so
 * this strips punctuation and trailing edition years before comparing.
 */
export function eventDedupKey(title: string, startDate: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/\b20\d{2}\b/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${normalized}|${startDate}`;
}

export interface CompetitionSeriesGroup {
  name: string;
  qualifiers: EventRow[];
  finals: EventRow[];
}

/** Splits a competition listing into connected qualification paths and standalone contests. */
export function groupCompetitionSeries(rows: EventRow[]): {
  series: CompetitionSeriesGroup[];
  standalone: EventRow[];
} {
  const bySeries = new Map<string, CompetitionSeriesGroup>();
  const standalone: EventRow[] = [];

  for (const row of rows) {
    if (!row.competitionSeries || !row.competitionStage) {
      standalone.push(row);
      continue;
    }
    const group = bySeries.get(row.competitionSeries) ?? {
      name: row.competitionSeries,
      qualifiers: [],
      finals: [],
    };
    (row.competitionStage === "final" ? group.finals : group.qualifiers).push(row);
    bySeries.set(row.competitionSeries, group);
  }

  const byDate = (a: EventRow, b: EventRow) => a.startDate.localeCompare(b.startDate);
  const series = Array.from(bySeries.values())
    .map((group) => ({
      ...group,
      qualifiers: group.qualifiers.sort(byDate),
      finals: group.finals.sort(byDate),
    }))
    .sort((a, b) => {
      const aDate = a.qualifiers[0]?.startDate ?? a.finals[0]?.startDate ?? "9999";
      const bDate = b.qualifiers[0]?.startDate ?? b.finals[0]?.startDate ?? "9999";
      return aDate.localeCompare(bDate);
    });

  return { series, standalone: standalone.sort(byDate) };
}

/**
 * Editorial corrections verified against Warsaw Bachata Meet Up's official
 * Facebook event pages. The underlying Tensy IDs remain stable, while these
 * fields keep dates, names and the organizer's direct link current without
 * creating a second card for the same event.
 */
const CURATED_EVENT_OVERRIDES: Record<string, Partial<EventRow>> = {
  "Tensy:b61d6005-6f3e-42be-a7bc-54684f6ba2c7": {
    title: "10. edycja konkursu Jack & Jill — miejsca dla Followerów wyprzedane",
    city: "Warszawa",
    organizer: "Warsaw Bachata Meet Up",
    description:
      "Amatorski konkurs Jack & Jill (osoby uczące nie mogą startować). Sobota 26.09, 14:00–00:30. Miejsca dla Followerów są wyprzedane.",
    endDate: "2026-09-27",
    sourceUrl: "https://www.facebook.com/events/1474686464380744/",
  },
  "Tensy:fd984081-038f-42bd-9d71-786754a099f4": {
    title: "BACHATA LADIES & MEN WEEKEND vol 4 — 26–27.09.2026",
    city: "Warszawa",
    venue: "DanceBook Academy Ochota",
    organizer: "Warsaw Bachata Meet Up",
    description: "Czwarta edycja tanecznego weekendu Ladies & Men. Sobota 26.09 od 10:00 do niedzieli 27.09 do 23:59.",
    endDate: "2026-09-27",
    sourceUrl: "https://www.facebook.com/events/1547902979716877/",
  },
  "Tensy:ec6d6305-e8fa-4424-a7fd-00f9fc8d40bd": {
    title: "World Bachata Meet Up! — OFFICIAL EVENT",
    city: "Warszawa",
    venue: "Warszawski Dom Technika NOT",
    address: "ul. Tadeusza Czackiego 3/5, 00-043 Warszawa",
    organizer: "Warsaw Bachata Meet Up",
    description:
      "Trzy dni warsztatów, cztery nocne imprezy, pokazy oraz światowe finały Social Competition. Od piątku 27.11 o 19:00 do poniedziałku 30.11 o 01:00.",
    endDate: "2026-11-30",
    sourceUrl: "https://www.facebook.com/events/1213946207270095/",
  },
  "Tensy:c6301c1a-ceb1-48b1-9cf4-7032cf2cdb3e": {
    title: "WTF Bachata Social Competition 2026",
    city: "Gdańsk",
    organizer: "So!Salsa — Solidarity of Salsa",
    description:
      "Piąta edycja otwartego konkursu bachaty social. Rejestracja jest indywidualna, partnerzy są losowani, a jury ocenia osobno Leaderów i Followerów. Style muzyczne: sensual, remix i dominicana. Eliminacje odbędą się w piątek, półfinał w sobotniej przerwie obiadowej, a finał podczas sobotniej gali. Opłata wynosi 60 zł z pełnym karnetem festiwalowym (Full Pass) lub karnetem imprezowym (Party Pass) oraz 100 zł bez karnetu.",
    sourceUrl: "https://www.shop.sosalsa.pl/produkt/wtfcompetition-",
  },
  "Bachata Social World Cup:poland-qualifier-warsaw-2026": {
    title: "Eliminacje Bachata Social World Cup — Polska 2026",
    city: "Warszawa",
    venue: "elSol Fall Festival",
    organizer: "Bachata Social World Cup · elSol Festival",
    description:
      "Polskie eliminacje profesjonalne do finału Bachata Social World Cup 2027 w Genewie. Rejestracja jest indywidualna, a partnerzy zmieniają się w formule inspirowanej Jack & Jill. Eliminacje i półfinał odbędą się w sobotę 14 listopada, a finał w niedzielę 15 listopada. Zwycięski Leader i zwycięski Follower otrzymają awans przypisany do nich — nie można przekazać go innej osobie. Jury ocenia m.in. rytm, technikę, kontrolę ciała, kontakt w parze, komunikację, umiejętność dopasowania się do partnera, muzykalność, kreatywność i komfort partnera. Wymagany jest karnet festiwalowy obejmujący sobotę i niedzielę; sam bilet na imprezę nie wystarcza. Opłata konkursowa: 25 euro.",
    startDate: "2026-11-13",
    endDate: "2026-11-15",
    competitionSeries: "Bachata Social World Cup 2026/2027",
    competitionStage: "qualifier",
    qualifiesFor: "Finał Bachata Social World Cup 2027 w Genewie",
    sourceUrl: "https://bachatasocialworldcup.com/qualifiers/poland-qualifier-warsaw-2026",
  },
  "Bachata Social World Cup:world-cup-finals-2027": {
    title: "Finał Bachata Social World Cup 2027",
    city: "Genewa",
    organizer: "Bachata Social World Cup",
    description:
      "Światowy finał sezonu 2026/2027 w Genewie dla 180 zakwalifikowanych tancerzy z ponad 50 krajów: 90 Leaderów i 90 Followerów. Pula nagród wynosi 3000 euro. Do finału można dostać się przez eliminacje europejskie i międzykontynentalne, prekwalifikacje w Genewie oraz eliminacje Elite. Awans jest przypisany do zwycięzcy i nie można przekazać go innej osobie. Jeśli zakwalifikowany tancerz ponownie zajmie miejsce premiowane awansem, miejsce przechodzi na kolejną uprawnioną osobę. Uczestnicy otrzymują zaproszenie e-mail i dostęp do panelu, a udział w finale wymaga osobnej opłaty.",
    startDate: "2027-10-08",
    endDate: "2027-10-11",
    competitionSeries: "Bachata Social World Cup 2026/2027",
    competitionStage: "final",
    sourceUrl: "https://bachatasocialworldcup.com/qualifiers/world-cup-finals-2027",
  },
  "Bachata Social World Cup:bachata-social-south-american-cup-2027": {
    title: "Puchar Ameryki Południowej Bachata Social 2027",
    city: "Ameryka Południowa",
    organizer: "Bachata Social World Cup",
    description:
      "To cykl czterech osobnych eliminacji, a nie jedno wydarzenie trwające od maja do lipca. Aby wziąć udział, wybierz eliminację w Boliwii, Wenezueli, Kolumbii albo Urugwaju i zapisz się na jej oficjalnej stronie. Łącznie do światowego finału w Genewie awansuje 6 Leaderów i 6 Followerów.",
    competitionSeries: "Bachata Social World Cup 2026/2027",
    competitionStage: "qualifier",
    qualifiesFor: "Finał Bachata Social World Cup 2027 w Genewie",
    registrationStatus: "through_qualifiers",
    qualifyingSpotsLeaders: 6,
    qualifyingSpotsFollowers: 6,
    sourceUrl: "https://bachatasocialworldcup.com/qualifiers/bachata-social-south-american-cup-2027",
  },
  "Bachata Social World Cup:bolivia-qualifier-2027": {
    title: "Eliminacje w Boliwii — La Paz",
    competitionParentId: "bachata-social-south-american-cup-2027",
    registrationStatus: "open",
    registrationPrice: "20 USD",
    qualifyingSpotsLeaders: 1,
    qualifyingSpotsFollowers: 1,
  },
  "Bachata Social World Cup:venezuela-qualifier-2027": {
    title: "Eliminacje w Wenezueli — Maracay",
    competitionParentId: "bachata-social-south-american-cup-2027",
    registrationStatus: "open",
    registrationPrice: "35 USD",
    qualifyingSpotsLeaders: 1,
    qualifyingSpotsFollowers: 1,
  },
  "Bachata Social World Cup:colombia-qualifier-2027": {
    title: "Eliminacje w Kolumbii — Bogota",
    competitionParentId: "bachata-social-south-american-cup-2027",
    registrationStatus: "closed",
    qualifyingSpotsLeaders: 3,
    qualifyingSpotsFollowers: 3,
  },
  "Bachata Social World Cup:uruguay-qualifier-2027": {
    title: "Eliminacje w Urugwaju — Montevideo",
    competitionParentId: "bachata-social-south-american-cup-2027",
    registrationStatus: "open",
    registrationPrice: "25 USD",
    qualifyingSpotsLeaders: 1,
    qualifyingSpotsFollowers: 1,
  },
  // Salsa Libre's own event page has no poster with the corrected date (the
  // only graphic on the page still shows the superseded 20.02 date — see the
  // Tensy suppression above). Using a real, undated photo from a past
  // edition instead, so the card never contradicts the current 06.03.2027 date.
  "Szkoły:2027-03-06-Bachata Libre Competition 2027": {
    coverImage: "/events/comp-salsalibre.jpg",
  },
};

const CURATED_EVENT_SUPPRESSIONS = new Set([
  // Tensy still carries an obsolete 20.02 date; Salsa Libre confirms 06.03.2027.
  "Tensy:42f09c3c-a8a1-4e10-a4a8-597c17bc65af",
]);

export function isCuratedEventSuppressed(row: Pick<EventRow, "source" | "externalId">): boolean {
  return CURATED_EVENT_SUPPRESSIONS.has(`${row.source}:${row.externalId}`);
}

export function applyCuratedEventOverride(row: EventRow): EventRow {
  return { ...row, ...(CURATED_EVENT_OVERRIDES[`${row.source}:${row.externalId}`] ?? {}) };
}

/** Polish plural forms for "wydarzenie" (event): 1 / 2-4 / 5+. */
export function pluralizeEvents(n: number): string {
  if (n === 1) return "wydarzenie";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "wydarzenia";
  return "wydarzeń";
}
