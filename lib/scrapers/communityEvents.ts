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
    coverImage: "/events/praktis-salsa-libre.jpg",
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

/**
 * One-off dated events sourced by hand from an organiser's own website
 * (not weekly, so they don't fit RECURRING_WEEKLY_SOCIALS). Kept here so all
 * hand-maintained events live in one file; past ones are filtered out on
 * each run. Details verified against the organiser's public site.
 */
const ONE_OFF_EVENTS: ScrapedEvent[] = [
  {
    externalId: "unico-bachata-battle-solo-2026-09",
    category: "competition",
    title: "Bachata Battle Competition (solo) — Único Warsaw Bachata Festival",
    city: "Warszawa",
    venue: "Centrum Kreatywności Targowa",
    address: "ul. Targowa 56, 03-733",
    organizer: "Único Bachata",
    description:
      "Solowa bitwa taneczna podczas festiwalu Único (18–20.09), w dwóch kategoriach: Ladies i Men. " +
      "Eliminacje z oceną za technikę, muzykalność i styl (maks. 12 pkt), finały w formacie „5 to Smoke” (pojedynki 1 na 1). " +
      "Wymagany Full Pass lub Party Pass festiwalu oraz osobny Bachata Battle Pass. Pula nagród ponad 9 800 zł. Zapisy przez stronę Único.",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    sourceUrl: "https://www.unicobachata.com/en/weekend/competition/",
  },
  {
    externalId: "unico-social-battle-pary-2026-09",
    category: "competition",
    title: "Bachata Social Battle (w parach) — Único Warsaw Bachata Festival",
    city: "Warszawa",
    venue: "Centrum Kreatywności Targowa",
    address: "ul. Targowa 56, 03-733",
    organizer: "Único Bachata",
    description:
      "Pierwsza edycja konkursu improwizacji w parach w formacie Battle, podczas festiwalu Único (18–20.09). " +
      "Międzynarodowe jury reprezentujące różne style bachaty. Wymagany Social Battle Pass (49 zł) lub wyższy pakiet festiwalu. " +
      "Zapisy przez stronę Único.",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    sourceUrl: "https://www.unicobachata.com/en/festival/",
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
  const today = toLocalIsoDate(new Date());

  for (const event of ONE_OFF_EVENTS) {
    if ((event.endDate ?? event.startDate) >= today) results.push(event);
  }

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
