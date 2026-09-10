import type { ScrapedEvent } from "../types";
import { toLocalIsoDate } from "../format";

/**
 * Recurring socials/praktisy that don't have their own scrapeable event page
 * — hand-maintained from the schools' own schedules and event pages. Update
 * this list as praktisy start or stop. Each entry regenerates its upcoming
 * occurrences on every scrape run, so nothing needs re-adding week to week;
 * `startsOn` / `endsOn` bound a season.
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
  /** Drop generated occurrences before this ISO date (e.g. a season that hasn't started). */
  startsOn?: string;
  /** Drop generated occurrences after this ISO date (e.g. a summer series that ends). */
  endsOn?: string;
  coverImage?: string;
}

const RECURRING_WEEKLY_SOCIALS: RecurringWeeklySocial[] = [
  {
    slug: "praktis-bachaty-abra",
    title: "Praktis bachaty w Abra Studio · 22:20–01:00",
    dayOfWeek: 1, // Monday
    startTime: "22:20",
    endTime: "01:00",
    city: "Warszawa",
    venue: "Abra Studio, al. Jana Pawła II 11",
    description:
      "Praktis dla wszystkich poziomów, w każdy poniedziałek po zajęciach — za konsoletą DJ Paweł Dyjach. " +
      "Tego samego wieczoru wcześniej (do 22:20) w Abra Studio są zajęcia Bachata Sensual (poziom S) u Dawida Gnatowskiego i Julii Martowicz — plan tych zajęć sprawdzisz w zakładce Grafik.",
    sourceUrl: "/grafik?day=1&school=Abra%20Studio",
    coverImage: "/events/praktis-abra-studio.jpg",
    weeksAhead: 10,
  },
  {
    slug: "praktis-bachaty-salsa-libre",
    title: "Praktis bachaty w Salsa Libre · 22:10–00:00",
    dayOfWeek: 3, // Wednesday
    startTime: "22:10",
    endTime: "00:00",
    city: "Warszawa",
    venue: "Salsa Libre, ul. Żelazna 59",
    description:
      "Regularny praktis bachaty w każdą środę, 22:10–00:00 — startuje 7 października. " +
      "Prowadzenie: Piotr Koziołkiewicz (poziom open). Informacje z grafiku i strony wydarzeń Salsa Libre.",
    sourceUrl: "https://salsalibre.pl/wydarzenia/",
    startsOn: "2026-10-07",
    weeksAhead: 12,
  },
  {
    slug: "niedzielne-tance-norblin",
    title: "Niedzielne tańce w Fabryce Norblina · 12:00–15:00",
    dayOfWeek: 0, // Sunday
    startTime: "12:00",
    endTime: "15:00",
    city: "Warszawa",
    venue: "Fabryka Norblina, Pasaż Wernera, ul. Żelazna 51/53",
    description:
      "Bezpłatne, otwarte tańce na świeżym powietrzu — Salsa Libre razem z Fundacją Fabryki Norblina. " +
      "12:00–13:00 lekcje salsy i bachaty od podstaw, 13:00–15:00 latynoska impreza z rotacją partnerów. " +
      "Cykl wakacyjny — ostatnia niedziela 13 września.",
    sourceUrl: "https://salsalibre.pl/niedzielne-tance/",
    endsOn: "2026-09-13",
    weeksAhead: 4,
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
      if (social.startsOn && date < social.startsOn) continue;
      if (social.endsOn && date > social.endsOn) continue;
      results.push({
        externalId: `${social.slug}-${date}`,
        category: "social",
        title: social.title,
        city: social.city,
        venue: social.venue,
        description: social.description,
        startDate: date,
        sourceUrl: social.sourceUrl,
        coverImage: social.coverImage,
      });
    }
  }
  return results;
}
