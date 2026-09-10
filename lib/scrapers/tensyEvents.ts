import type { EventPerson, EventProgramItem, ScrapedEvent } from "../types";
import { htmlToPlainText } from "../text";

const BASE = "https://www.tensy.app";

/** The 3 categories Tensy itself serves — "trip" doesn't exist there, see TRIP_KEYWORDS below. */
type TensyCategory = "festival" | "social" | "competition";

const CATEGORY_ENDPOINTS: Record<TensyCategory, string> = {
  festival: "festivals",
  social: "social-events",
  competition: "competitions",
};

const USER_AGENT = "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)";
const DETAIL_CONCURRENCY = 8;

/**
 * Tensy has no separate "wyjazdy" (multi-day trip/camp) category — those get
 * filed under "festivals" there. We split them back out by title, since a
 * camp/retreat reads very differently from a single-venue city festival.
 * Scoped to festivals only: the same keywords ("wakacyjny" etc.) show up in
 * ordinary local social listings too ("Wakacyjne Latino w Fabryce Smaków"),
 * where they just mean "summer-themed", not "you travel somewhere".
 */
const TRIP_KEYWORDS = /\bcamp\b|\bobóz\w*\b|\bwyjazd\w*\b|\bwakacyj\w*\b|\bwakacje\b|\bretreat\b/i;

interface TensyListItem {
  id: string;
  slug: string;
  name: string;
  cover_image: string | null;
  start_at: string;
  end_at: string | null;
  city_name: string | null;
  organizer_name: string | null;
}

interface TensyListResponse {
  next: string | null;
  results: TensyListItem[];
}

interface TensyArtist {
  id: string;
  full_name?: string | null;
  stage_name?: string | null;
  name?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  role_type?: string | null;
}

interface TensyWorkshop {
  id: string;
  name: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  room?: { name?: string | null } | null;
  artists?: TensyArtist[];
  instructors?: TensyArtist[];
  levels?: Array<{ name?: string | null } | string>;
}

interface TensyDetail {
  description: string | null;
  location: {
    city_name: string | null;
    street: string | null;
    place_name: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  artists?: TensyArtist[];
  judges?: TensyArtist[];
  jury?: TensyArtist[];
  djs?: TensyArtist[];
  workshops?: TensyWorkshop[];
  program?: TensyWorkshop[];
}

function artistName(person: TensyArtist): string {
  return person.stage_name?.trim() || person.full_name?.trim() || person.name?.trim() || "";
}

function personRole(person: TensyArtist, fallback: EventPerson["role"]): EventPerson["role"] {
  const role = (person.role_type ?? "").toLowerCase();
  if (role.includes("dj")) return "dj";
  if (role.includes("jur") || role.includes("judg")) return "jury";
  if (role.includes("instructor") || role.includes("teacher")) return "instructor";
  return fallback;
}

function detailPeople(detail: TensyDetail | null, category: TensyCategory): EventPerson[] {
  if (!detail) return [];
  const groups: Array<[TensyArtist[] | undefined, EventPerson["role"]]> = [
    [detail.artists, category === "competition" ? "jury" : "instructor"],
    [detail.judges, "jury"],
    [detail.jury, "jury"],
    [detail.djs, "dj"],
  ];
  const byId = new Map<string, EventPerson>();
  for (const [items, fallback] of groups) {
    for (const person of items ?? []) {
      const name = artistName(person);
      if (!name) continue;
      const key = person.id || name.toLocaleLowerCase("pl");
      const next: EventPerson = {
        id: key,
        name,
        role: personRole(person, fallback),
        photoUrl: person.photo_url ?? undefined,
        bio: htmlToPlainText(person.bio ?? undefined),
      };
      if (!byId.has(key)) byId.set(key, next);
    }
  }
  return Array.from(byId.values());
}

function detailProgram(detail: TensyDetail | null): EventProgramItem[] {
  const workshops = detail?.workshops ?? detail?.program ?? [];
  return workshops
    .filter((item) => item.id && item.name && item.start_at)
    .map((item) => {
      const instructors = item.instructors?.length ? item.instructors : item.artists ?? [];
      return {
        id: item.id,
        title: item.name.trim(),
        description: htmlToPlainText(item.description ?? undefined),
        startAt: item.start_at,
        endAt: item.end_at ?? undefined,
        room: item.room?.name ?? undefined,
        instructors: Array.from(new Set(instructors.map(artistName).filter(Boolean))),
        levels: (item.levels ?? []).map((level) => typeof level === "string" ? level : level.name ?? "").filter(Boolean),
      };
    });
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/** Runs `fn` over `items` with at most `limit` in flight at once. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Tensy (tensy.app) aggregates dance festivals, socials and competitions
 * across all of Poland via a public, unauthenticated JSON API — exactly the
 * kind of nationwide "Eventy" coverage that would be impractical to scrape
 * from dozens of individual organizer sites. Classes stay Warsaw-only
 * (scraped directly from each school); this covers the one-off event side.
 *
 * The list endpoint doesn't include the description or full venue address,
 * so each event's own detail page is fetched too — the app shows that
 * content directly instead of linking out to Tensy.
 */
async function fetchCategory(category: TensyCategory): Promise<ScrapedEvent[]> {
  const endpoint = CATEGORY_ENDPOINTS[category];
  const items: TensyListItem[] = [];
  let url: string | null =
    `${BASE}/api/${endpoint}/?country=Poland&style=bachata&limit=50&page=1&locale=pl`;

  while (url) {
    const data: TensyListResponse = await fetchJson(url);
    items.push(...data.results);
    url = data.next;
  }

  const details = await mapWithConcurrency(items, DETAIL_CONCURRENCY, (item) =>
    fetchJson<TensyDetail>(`${BASE}/api/${endpoint}/${item.slug}/?locale=pl`).catch(() => null)
  );

  return items.map((item, i) => {
    const detail = details[i];
    return {
      externalId: item.id,
      category: category === "festival" && TRIP_KEYWORDS.test(item.name) ? "trip" : category,
      title: item.name,
      city: detail?.location?.city_name ?? item.city_name ?? undefined,
      venue: detail?.location?.place_name ?? undefined,
      address: detail?.location?.street ?? undefined,
      latitude: detail?.location?.latitude ?? undefined,
      longitude: detail?.location?.longitude ?? undefined,
      organizer: item.organizer_name ?? undefined,
      coverImage: item.cover_image ?? undefined,
      description: htmlToPlainText(detail?.description ?? undefined),
      startDate: item.start_at,
      endDate: item.end_at ?? undefined,
      people: detailPeople(detail, category),
      programItems: detailProgram(detail),
      sourceUrl: `${BASE}/${endpoint}/${item.slug}`,
    };
  });
}

export async function scrapeTensyEvents(): Promise<ScrapedEvent[]> {
  const [festivals, socials, competitions] = await Promise.all([
    fetchCategory("festival"),
    fetchCategory("social"),
    fetchCategory("competition"),
  ]);
  return [...festivals, ...socials, ...competitions];
}
