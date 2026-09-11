import { saveScrapedClasses, saveScrapedEvents, logScrapeRun, getTensyEventDedupKeys } from "../db";
import type { School, ScrapeResult, ScrapedEvent } from "../types";
import { scrapeAbraStudio } from "./abraStudio";
import { scrapeWarsawSalsaClub } from "./warsawSalsaClub";
import { scrapeSalsaLibre } from "./salsaLibre";
import { scrapeOye } from "./oye";
import { scrapeVivaCuba } from "./vivaCuba";
import { scrapeTensyEvents } from "./tensyEvents";
import { getCommunityEvents } from "./communityEvents";
import { scrapeAbraStudioEvents, scrapeSalsaLibreEvents } from "./schoolEvents";
import { scrapeBachataSocialWorldCupEvents } from "./bachataSocialWorldCup";
import { eventDedupKey } from "../events";

const SCRAPERS: { school: School; run: () => Promise<import("../types").ScrapedClass[]> }[] = [
  { school: "Abra Studio", run: scrapeAbraStudio },
  { school: "Warsaw Salsa Club", run: scrapeWarsawSalsaClub },
  { school: "Salsa Libre", run: scrapeSalsaLibre },
  { school: "Oye!", run: scrapeOye },
  { school: "Viva Cuba", run: scrapeVivaCuba },
];

const EVENT_SOURCE = "Tensy";
const COMMUNITY_EVENT_SOURCE = "Społeczność";
const SCHOOL_EVENT_SOURCE = "Szkoły";
const WORLD_CUP_EVENT_SOURCE = "Bachata Social World Cup";

export async function runAllScrapers(): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = [];

  // Run one school at a time (not in parallel) to stay polite to each site.
  for (const { school, run } of SCRAPERS) {
    const startedAt = new Date().toISOString();
    try {
      const items = await run();
      const { foundCount, newCount } = saveScrapedClasses(school, items);
      logScrapeRun({ school, startedAt, finishedAt: new Date().toISOString(), ok: true, foundCount, newCount });
      results.push({ school, ok: true, foundCount, newCount });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logScrapeRun({ school, startedAt, finishedAt: new Date().toISOString(), ok: false, foundCount: 0, newCount: 0, error });
      results.push({ school, ok: false, foundCount: 0, newCount: 0, error });
    }
  }

  return results;
}

export async function runEventScrape(): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();
  try {
    const items = await scrapeTensyEvents();
    const { foundCount, newCount } = saveScrapedEvents(EVENT_SOURCE, items);
    logScrapeRun({ school: EVENT_SOURCE, startedAt, finishedAt: new Date().toISOString(), ok: true, foundCount, newCount });
    return { school: EVENT_SOURCE, ok: true, foundCount, newCount };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logScrapeRun({ school: EVENT_SOURCE, startedAt, finishedAt: new Date().toISOString(), ok: false, foundCount: 0, newCount: 0, error });
    return { school: EVENT_SOURCE, ok: false, foundCount: 0, newCount: 0, error };
  }
}

export async function runWorldCupEventScrape(): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();
  try {
    const items = await scrapeBachataSocialWorldCupEvents();
    const { foundCount, newCount } = saveScrapedEvents(WORLD_CUP_EVENT_SOURCE, items);
    logScrapeRun({
      school: WORLD_CUP_EVENT_SOURCE,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: true,
      foundCount,
      newCount,
    });
    return { school: WORLD_CUP_EVENT_SOURCE, ok: true, foundCount, newCount };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logScrapeRun({
      school: WORLD_CUP_EVENT_SOURCE,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      foundCount: 0,
      newCount: 0,
      error,
    });
    return { school: WORLD_CUP_EVENT_SOURCE, ok: false, foundCount: 0, newCount: 0, error };
  }
}

/**
 * Regenerates upcoming occurrences of the hand-maintained recurring
 * community events (see communityEvents.ts). No network call — this always
 * "succeeds" unless the local generation logic itself throws.
 */
export async function runCommunityEventScrape(): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();
  try {
    const items = getCommunityEvents();
    const { foundCount, newCount } = saveScrapedEvents(COMMUNITY_EVENT_SOURCE, items);
    logScrapeRun({
      school: COMMUNITY_EVENT_SOURCE,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: true,
      foundCount,
      newCount,
    });
    return { school: COMMUNITY_EVENT_SOURCE, ok: true, foundCount, newCount };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logScrapeRun({
      school: COMMUNITY_EVENT_SOURCE,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      foundCount: 0,
      newCount: 0,
      error,
    });
    return { school: COMMUNITY_EVENT_SOURCE, ok: false, foundCount: 0, newCount: 0, error };
  }
}

/**
 * Each dance school's own party/event listings — separate from both their
 * class schedule and from Tensy, which they don't necessarily ever submit
 * to. Run this *after* runEventScrape() so the Tensy dedup check sees
 * current data; a school event whose (title, date) already matches a Tensy
 * one is dropped rather than shown twice under two different sources.
 */
export async function runSchoolEventScrape(): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();
  const [abraResult, salsaLibreResult] = await Promise.allSettled([
    scrapeAbraStudioEvents(),
    scrapeSalsaLibreEvents(),
  ]);

  const items: ScrapedEvent[] = [
    ...(abraResult.status === "fulfilled" ? abraResult.value : []),
    ...(salsaLibreResult.status === "fulfilled" ? salsaLibreResult.value : []),
  ];

  const tensyKeys = getTensyEventDedupKeys();
  const deduped = items.filter((item) => !tensyKeys.has(eventDedupKey(item.title, item.startDate)));

  const { foundCount, newCount } = saveScrapedEvents(SCHOOL_EVENT_SOURCE, deduped);

  const failures = [abraResult, salsaLibreResult].filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const ok = failures.length === 0;
  const error = ok ? undefined : failures.map((f) => String(f.reason)).join("; ");

  logScrapeRun({ school: SCHOOL_EVENT_SOURCE, startedAt, finishedAt: new Date().toISOString(), ok, foundCount, newCount, error });
  return { school: SCHOOL_EVENT_SOURCE, ok, foundCount, newCount, error };
}
