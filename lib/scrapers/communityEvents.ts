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
      "Prowadzenie: Piotr Koziołkiewicz (poziom otwarty). Informacje z grafiku i strony wydarzeń Salsa Libre.",
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
    externalId: "facebook-1585190002938512",
    category: "competition",
    title: "Austriackie eliminacje World Bachata Social Competition",
    city: "Wiedeń",
    venue: "Palais Wertheim",
    address: "Kärntner Ring 18, 1010 Wien, Austria",
    organizer: "Warsaw Bachata Meet Up · Vienna Bachata Congress",
    coverImage: "/events/comp-vienna.jpg",
    description:
      "Austriackie kwalifikacje do World Bachata Social Competition. Piątek 18.09, 19:00–01:00; trzy rundy kwalifikacji, wyłącznie improwizacja i taniec social. " +
      "Udział wymaga pełnego karnetu festiwalowego (Full Pass) lub karnetu imprezowego (Party Pass) na Vienna Bachata Congress oraz dodatkowej opłaty konkursowej. Rejestracja przez aplikację Bailacon.",
    competitionSeries: "World Bachata Social Competition 2026",
    competitionStage: "qualifier",
    qualifiesFor: "Finał World Bachata Social Competition 2026 w Warszawie",
    startDate: "2026-09-18",
    sourceUrl: "https://www.facebook.com/events/1585190002938512/",
  },
  {
    externalId: "facebook-1533945251813532",
    category: "competition",
    title: "Gruzińskie eliminacje World Bachata Social Competition",
    city: "Batumi",
    venue: "Grand Bellagio Batumi",
    address: "3 Lech and Maria Kaczynski St, Batumi, Georgia",
    organizer: "Warsaw Bachata Meet Up · Batumi Bachata Festival",
    coverImage: "/events/comp-batumi.jpg",
    description:
      "Gruzińskie kwalifikacje do światowego finału w Warszawie. Piątek 25.09 od 14:00 CEST; trzy rundy o 16:00, 20:00 i 23:00, wyłącznie improwizacja i taniec social. " +
      "Wymagany pełny karnet festiwalowy (Full Pass) lub karnet imprezowy (Party Pass) oraz dodatkowa opłata 25 euro. Rejestracja przez aplikację Bailacon.",
    competitionSeries: "World Bachata Social Competition 2026",
    competitionStage: "qualifier",
    qualifiesFor: "Finał World Bachata Social Competition 2026 w Warszawie",
    startDate: "2026-09-25",
    sourceUrl: "https://www.facebook.com/events/1533945251813532/",
  },
  {
    externalId: "facebook-1344672777389245",
    category: "competition",
    title: "Francuskie eliminacje World Bachata Social Competition",
    city: "Arles",
    venue: "Domaine du Mas de Rey",
    address: "13200 Arles, France",
    organizer: "Warsaw Bachata Meet Up",
    description:
      "Francuskie kwalifikacje do World Bachata Social Competition. Sobota 31.10, 16:00–21:00 w Domaine du Mas de Rey. " +
      "Konkurs indywidualny, social i wyłącznie w formule improwizowanej.",
    competitionSeries: "World Bachata Social Competition 2026",
    competitionStage: "qualifier",
    qualifiesFor: "Finał World Bachata Social Competition 2026 w Warszawie",
    startDate: "2026-10-31",
    sourceUrl: "https://www.facebook.com/events/1344672777389245/",
  },
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
    competitionSeries: "World Bachata Social Competition 2026",
    competitionStage: "final",
    startDate: "2026-11-27",
    endDate: "2026-11-29",
    sourceUrl: "https://worldbachatameetup.com/",
  },
  {
    externalId: "wbmu-solo-competition-2026-11",
    category: "competition",
    title: "World Bachata Solo Competition — 3. edycja (zapisy otwarte)",
    city: "Warszawa",
    venue: "Warszawski Dom Technika NOT",
    address: "ul. Tadeusza Czackiego 3/5, 00-043",
    organizer: "World Bachata Meet Up",
    coverImage: "/events/comp-wbmu.jpg",
    description:
      "Trzecia edycja konkursu solo podczas World Bachata Meet Up. Niedziela 29.11, 14:00–16:30. " +
      "Dwie osobne kategorie: kobiety i mężczyźni; wyłącznie improwizacja i bachata sensual, moderna lub dominicana.",
    startDate: "2026-11-29",
    sourceUrl: "https://www.facebook.com/events/1021934360832258/",
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
  {
    externalId: "berlin-bachata-festival-jack-and-jill-2026",
    category: "competition",
    title: "Berlin Bachata Festival 2026 — konkurs Jack & Jill",
    city: "Berlin",
    venue: "MOA Berlin",
    address: "Stephanstraße 41, 10559 Berlin, Niemcy",
    organizer: "Bachata Explosion",
    coverImage: "/events/comp-berlin.jpg",
    description:
      "Konkurs Jack & Jill podczas Berlin Bachata Festival. Pierwsza runda jest planowana w piątek, a finały w sobotę. Uczestnik musi posiadać pełny karnet festiwalowy (Full Pass). Akrobacje są zabronione. Jury ocenia krok podstawowy, rytm i pracę bioder, postawę, kontakt w parze, technikę, muzykalność, kreatywność oraz walory widowiskowe. Nagroda główna obejmuje 100 euro, trofeum, pięć karnetów dla partnerów oraz możliwość poprowadzenia zajęć podczas edycji 2027.",
    startDate: "2026-10-16",
    endDate: "2026-10-17",
    sourceUrl: "https://bachataexplosion.com/jj/",
  },
  {
    externalId: "all-stars-festival-bachata-competition-2026",
    category: "competition",
    title: "All Stars Festival 2026 — konkurs bachaty",
    city: "Budapeszt",
    venue: "Verdi Budapest Aquincum Hotel",
    address: "Árpád fejedelem útja 94, H-1036 Budapeszt, Węgry",
    organizer: "All Stars Festival",
    coverImage: "/events/comp-allstars2026.jpg",
    description:
      "Konkurs bachaty podczas 13. edycji All Stars Festival. Organizator potwierdził konkurs w programie festiwalu, ale nie opublikował jeszcze kategorii, godzin ani opłaty dla edycji 2026. Osobna strona konkursowa nadal przedstawia regulamin z 2025 roku, dlatego dawne zasady nie są tutaj prezentowane jako aktualne.",
    startDate: "2026-11-06",
    endDate: "2026-11-09",
    sourceUrl: "https://www.allstarsfestival.com/all-stars-festival-2026/",
  },
  {
    externalId: "elsol-bachata-social-competition-amateur-2026",
    category: "competition",
    title: "elSol Bachata Social Competition 2026 — kategoria amatorska",
    city: "Warszawa",
    venue: "Campanile Prime Warsaw Airport",
    organizer: "elSol Festival",
    coverImage: "/events/comp-elsol.jpg",
    description:
      "Niezależny konkurs amatorski bachaty social, korzystający z cyfrowej platformy Bachata Social World Cup. Rejestracja jest indywidualna, a partnerzy zmieniają się w formule inspirowanej Jack & Jill. Eliminacje i półfinał odbędą się w sobotę, a finał w niedzielę. Opłata wynosi 25 euro, a termin zapisów upływa 13 listopada o 15:00 CET. Wymagany jest karnet festiwalowy obejmujący oba dni; pojedynczy bilet na imprezę nie wystarcza.",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    sourceUrl: "https://elsolfestival.pl/pl/bachata-social-competition-2026-powered-by-bachata-social-world-cup/",
  },
  {
    externalId: "budapest-bachata-festival-competitions-2027",
    category: "competition",
    title: "Budapest Bachata Festival 2027 — Jack & Jill i konkurs solo",
    city: "Budapeszt",
    venue: "Verdi Budapest Aquincum Hotel",
    address: "Árpád fejedelem útja 94, H-1036 Budapeszt, Węgry",
    organizer: "All Stars Festival",
    description:
      "Konkursy Jack & Jill oraz solo podczas piątej edycji festiwalu poświęconego wyłącznie bachacie. Szczegółowe kategorie, harmonogram i regulamin nie zostały jeszcze opublikowane; opis zostanie uzupełniony na podstawie strony organizatora.",
    startDate: "2027-02-26",
    endDate: "2027-02-28",
    sourceUrl: "https://www.allstarsfestival.com/budapest-bachata-festival-2027/",
  },
  {
    externalId: "oaxaca-paramount-cup-2027",
    category: "competition",
    title: "Oaxaca Paramount Cup 2027 — konkursy bachaty",
    city: "Oaxaca",
    venue: "Centro Cultural y de Convenciones de Oaxaca",
    organizer: "Oaxaca Paramount Cup",
    coverImage: "/events/comp-oaxaca.jpg",
    description:
      "Trzynasta edycja międzynarodowego turnieju tanecznego. Program obejmuje liczne kategorie bachaty, obok innych stylów. Szczegóły kategorii, rejestracji i regulamin znajdują się na oficjalnej stronie organizatora.",
    startDate: "2027-03-17",
    endDate: "2027-03-20",
    sourceUrl: "https://oaxacaparamountcup.com/",
  },
  {
    externalId: "barcelona-dance-cup-bachata-2027",
    category: "competition",
    title: "Barcelona Dance Cup 2027 — konkursy bachaty",
    city: "Santa Susanna",
    venue: "Hotel Don Ángel",
    organizer: "BDC Congress",
    coverImage: "/events/comp-barcelona.jpg",
    description:
      "Pierwsza edycja konkursu bachaty i salsy z ponad 12 kategoriami oraz międzynarodowym, 13-osobowym jury. Przewidziano kategorię pokazową (Showcase) z przygotowaną choreografią oraz kategorię sceniczną (Stage) opartą na improwizacji. Konkurs jest otwarty dla uczestników na różnych poziomach.",
    startDate: "2027-04-02",
    endDate: "2027-04-04",
    sourceUrl: "https://www.bdcongress.com/bdcup.html",
  },
  {
    externalId: "athens-bachata-congress-jack-and-jill-2027",
    category: "competition",
    title: "Athens Bachata Congress 2027 — konkurs Jack & Jill",
    city: "Ateny",
    organizer: "Athens Bachata Congress",
    description:
      "Konkurs Jack & Jill podczas trzeciej edycji Athens Bachata Congress. Organizator potwierdził konkurs w programie wydarzenia; dokładny dzień, godziny i regulamin nie zostały jeszcze opublikowane.",
    startDate: "2027-04-23",
    endDate: "2027-04-25",
    sourceUrl: "https://www.athensbachatacongress.com/",
  },
  {
    externalId: "summer-bachata-festival-jack-and-jill-2027",
    category: "competition",
    title: "Summer Bachata Festival 2027 — konkurs Jack & Jill",
    city: "Rovinj",
    organizer: "Summer Bachata Festival",
    coverImage: "/events/comp-summer.jpg",
    description:
      "Konkurs Jack & Jill podczas Summer Bachata Festival. Eliminacje zaplanowano na piątek 4 czerwca w Villas Rubin, półfinały w nocy z piątku na sobotę w Adris Old Tobacco Factory, a finały na sobotę 5 czerwca.",
    startDate: "2027-06-04",
    endDate: "2027-06-05",
    sourceUrl: "https://www.summerbachatafestival.com/program",
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
