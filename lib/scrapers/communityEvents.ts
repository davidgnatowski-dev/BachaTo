import type { ScrapedEvent } from "../types";
import { toLocalIsoDate } from "../format";

/**
 * Recurring social events reported directly by the community (Facebook
 * groups, word of mouth) rather than found on any organizer's own site or on
 * Tensy. There's no API to poll here — this is a small hand-maintained list;
 * update it as people report new standing weekly meetups or as old ones stop
 * happening. Each entry generates its own upcoming occurrences on every
 * scrape run, so nothing needs to be re-added week to week.
 */
interface RecurringWeeklySocial {
  slug: string;
  title: string;
  /** 0 = Sunday ... 6 = Saturday (matches Date#getDay()). */
  dayOfWeek: number;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  city: string;
  venue: string;
  description: string;
  sourceUrl: string;
  weeksAhead: number;
}

const RECURRING_WEEKLY_SOCIALS: RecurringWeeklySocial[] = [
  {
    slug: "bulwary-cnk-sroda",
    title: "Bulwary przy CNK · 21:00–23:30",
    dayOfWeek: 3, // Wednesday
    startTime: "21:00",
    endTime: "23:30",
    city: "Warszawa",
    venue: "Bulwary Wiślane przy Centrum Nauki Kopernik",
    description:
      "Nieoficjalne, cykliczne spotkanie tancerzy nad Wisłą — zgłoszone przez społeczność, nie ma własnej strony wydarzenia. " +
      "Uwaga: to wydarzenie bywa odwoływane, jeśli w tym samym czasie coś dzieje się w CNK — przed wyjściem warto to zweryfikować.",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Bulwary+Wi%C5%9Blane+Centrum+Nauki+Kopernik+Warszawa",
    weeksAhead: 6,
  },
  {
    slug: "bulwary-cnk-niedziela",
    title: "Bulwary przy CNK · 20:00–23:30",
    dayOfWeek: 0, // Sunday
    startTime: "20:00",
    endTime: "23:30",
    city: "Warszawa",
    venue: "Bulwary Wiślane przy Centrum Nauki Kopernik",
    description:
      "Nieoficjalne, cykliczne spotkanie tancerzy nad Wisłą — zgłoszone przez społeczność, nie ma własnej strony wydarzenia.",
    sourceUrl: "https://www.google.com/maps/search/?api=1&query=Bulwary+Wi%C5%9Blane+Centrum+Nauki+Kopernik+Warszawa",
    weeksAhead: 6,
  },
];

function nextOccurrences(dayOfWeek: number, count: number): string[] {
  const dates: string[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + ((dayOfWeek - cursor.getDay() + 7) % 7));
  for (let i = 0; i < count; i++) {
    dates.push(toLocalIsoDate(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

export function getCommunityEvents(): ScrapedEvent[] {
  const results: ScrapedEvent[] = [];
  for (const social of RECURRING_WEEKLY_SOCIALS) {
    for (const date of nextOccurrences(social.dayOfWeek, social.weeksAhead)) {
      results.push({
        externalId: `${social.slug}-${date}`,
        category: "social",
        title: social.title,
        city: social.city,
        venue: social.venue,
        description: social.description,
        startDate: date,
        sourceUrl: social.sourceUrl,
      });
    }
  }
  return results;
}
