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
    externalId: "unico-social-battle-pary-2026-09",
    category: "competition",
    title: "Bachata Social Battle — konkurs w parach · Único Warsaw Bachata Festival",
    city: "Warszawa",
    venue: "Centrum Kreatywności Targowa",
    address: "ul. Targowa 56, 03-733",
    organizer: "Único Bachata",
    coverImage: "/events/comp-unico-festival.jpg",
    description:
      "Konkurs improwizacji w parach (couple competition) w formacie Battle, podczas festiwalu Único (18–20.09). " +
      "Międzynarodowe jury reprezentujące różne style bachaty. Wymagany Social Battle Pass (49 zł) lub wyższy pakiet festiwalu. " +
      "Zapisy i szczegóły na stronie Único.",
    startDate: "2026-09-18",
    endDate: "2026-09-20",
    sourceUrl: "https://www.unicobachata.com/en/festival/",
  },
  {
    externalId: "wbmu-social-competition-pary-2026-11",
    category: "competition",
    title: "World Bachata Social Competition — finały w parach · World Bachata Meet Up",
    city: "Warszawa",
    venue: "Warszawski Dom Technika NOT",
    address: "ul. Tadeusza Czackiego 3/5, 00-043",
    organizer: "World Bachata Meet Up",
    coverImage: "/events/comp-wbmu.jpg",
    description:
      "Finały konkursu social bachaty w parach podczas World Bachata Meet Up (27–29.11), 11. edycja festiwalu. " +
      "Zjeżdżają najlepsi tancerze z europejskich kwalifikacji regionalnych. Trzy dni warsztatów, cztery imprezy nocne. " +
      "Bilety przez stronę organizatora.",
    startDate: "2026-11-27",
    endDate: "2026-11-29",
    sourceUrl: "https://worldbachatameetup.com/",
  },
  {
    externalId: "wbmu-solo-competition-2026-11",
    category: "competition",
    title: "Solo Competition (3. edycja) · World Bachata Meet Up",
    city: "Warszawa",
    venue: "Warszawski Dom Technika NOT",
    address: "ul. Tadeusza Czackiego 3/5, 00-043",
    organizer: "World Bachata Meet Up",
    coverImage: "/events/comp-wbmu.jpg",
    description:
      "Trzecia edycja konkursu solo podczas World Bachata Meet Up (27–29.11) w Warszawie. " +
      "Występy solowe oceniane przez międzynarodowe jury. Rejestracja przez stronę konkursu.",
    startDate: "2026-11-27",
    endDate: "2026-11-29",
    sourceUrl: "https://worldbachatameetup.com/competition-registration/",
  },
  {
    externalId: "wroclove-bachata-cup-2026-12",
    category: "competition",
    title: "WrocLove Bachata Cup · 4th WrocLove Bachata Festival",
    city: "Wrocław",
    organizer: "WrocLove Bachata Festival",
    coverImage: "/events/comp-wroclove.jpg",
    description:
      "4. edycja WrocLove Bachata Festival (11–13.12) stawia w całości na rywalizację — zamiast Jack & Jill powstaje pełne mistrzostwo bachaty z wieloma kategoriami, rozgrywane głównie w ciągu dnia. " +
      "Kategorie: Social Competition, Social Competition Bachata Dominicana, Bachata Solo, Bachata Solo Choreography, Bachata Couple Choreography, Bachata Team Choreography, Bachata Influence — w podziale na Amateur i Pro. " +
      "Zapisy i regulamin: biuroflydance@gmail.com / wroclovebachatafestival.com.",
    startDate: "2026-12-11",
    endDate: "2026-12-13",
    sourceUrl: "https://www.wroclovebachatafestival.com/",
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
