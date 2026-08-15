import type { ScrapedEvent } from "../types";
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

interface TensyDetail {
  description: string | null;
  location: { city_name: string | null; street: string | null; place_name: string | null } | null;
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
      organizer: item.organizer_name ?? undefined,
      coverImage: item.cover_image ?? undefined,
      description: htmlToPlainText(detail?.description ?? undefined),
      startDate: item.start_at,
      endDate: item.end_at ?? undefined,
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
