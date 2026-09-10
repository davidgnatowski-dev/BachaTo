import type { School } from "./types";

export type SchoolAmenity =
  | "parking"
  | "publicTransport"
  | "changingRoom"
  | "showers"
  | "airConditioning"
  | "multisport"
  | "benefitSystems"
  | "cardPayment"
  | "wheelchairAccessible";

export const AMENITY_LABELS: Record<SchoolAmenity, string> = {
  parking: "Parking",
  publicTransport: "Dobry dojazd komunikacją",
  changingRoom: "Szatnia",
  showers: "Prysznice",
  airConditioning: "Klimatyzacja",
  multisport: "Karta Multisport",
  benefitSystems: "Benefit Systems",
  cardPayment: "Płatność kartą",
  wheelchairAccessible: "Dostępność dla osób z niepełnosprawnością",
};

export interface SchoolInfo {
  homepage: string;
  description: string;
  /** Each school's own real header/nav logo, hand-verified against their site. Left undefined rather than guessed. */
  logoUrl?: string;
  coverImageUrl?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  /** Only amenities actually confirmed true should be listed — an empty/missing array hides the whole section. */
  amenities?: SchoolAmenity[];
}

/**
 * Hand-maintained facts that don't come from the schedule scrape itself.
 *
 * `description` is a faithful summary of each school's own real "about"
 * text/meta description (fetched and verified 2026-08-18, see git history
 * for the exact source quotes) — edited for length, never invented. Where a
 * school's site has no real about content (Warsaw Salsa Club), the
 * description sticks to facts already verified elsewhere in this file plus
 * the school's own real tagline, rather than inventing a narrative.
 *
 * `coverImageUrl` was picked by `lib/schoolImageFetch.ts` (see
 * `npm run school-images`) — og:image for Salsa Libre, largest real page
 * image for Abra Studio. Warsaw Salsa Club's site has neither an og:image
 * nor any images with declared dimensions, so it intentionally has none —
 * SchoolHero falls back to the placeholder rather than guessing.
 */
export const SCHOOL_INFO: Record<School, SchoolInfo> = {
  "Abra Studio": {
    homepage: "https://www.abra-studio.pl/",
    description:
      "Abra Studio to szkoła tańca w centrum Warszawy z jedną z największych w Polsce kadr instruktorów bachaty i zouka. Oferuje szeroki wybór kursów na każdym poziomie zaawansowania — od podstaw po zaawansowanie. Wokół szkoły działa społeczność „Abra Familia”, dla której taniec to nie tylko technika, ale też relacje i wspólna pasja.",
    coverImageUrl: "https://abra-studio.pl/wp-content/uploads/2026/06/abra-jana-pawla-09.webp",
    logoUrl: "https://abra-studio.pl/wp-content/uploads/2025/09/logo-abrastudio.svg",
  },
  "Salsa Libre": {
    homepage: "https://salsalibre.pl/",
    description:
      "Salsa Libre to coś więcej niż szkoła tańca — to miejsce, w którym poznasz nowych ludzi i dołączysz do przyjaznej społeczności. Zajęcia obejmują m.in. bachatę, salsę i zouka na różnych poziomach zaawansowania, a na zajęcia w parach nie trzeba przychodzić z partnerem. W ofercie są też weekendowe kursy intensywne.",
    coverImageUrl: "https://salsalibre.pl/wp-content/uploads/2024/09/nowy-seozon.webp",
    logoUrl: "https://salsalibre.pl/wp-content/uploads/2023/07/Salsa-Libre-logo-minimalne-odstepy-%E2%80%94-kopia.png",
  },
  "Warsaw Salsa Club": {
    homepage: "https://www.warsawsalsaclub.pl/",
    description:
      "Warsaw Salsa Club to klub taneczny przy ul. Nowowiejskiej — „Wkręć się w taniec”, jak mówi ich hasło. Oprócz bachaty w ofercie znajdziesz też m.in. salsę, kizombę i zouka, w kilku salach zajęciowych.",
    logoUrl: "https://cdn.prod.website-files.com/62d6f3d4c8a0b76503362cf4/62ead4fe4e3c060d9f1e439e_logo-big%20(1).png",
  },
  "Oye!": {
    homepage: "https://szkolatancaoye.pl/",
    description:
      "Oye! to szkoła tańca działająca na warszawskiej Pradze od 2012 roku. Prowadzi m.in. zajęcia bachaty, salsy kubańskiej, reggaetonu i son cubano — od grup początkujących po zaawansowane — w kameralnej siedzibie przy ul. Kłopotowskiego 5.",
    email: "zapisy@casadeoye.pl",
    amenities: ["publicTransport"],
  },
  "Viva Cuba": {
    homepage: "https://vivacuba.pl/",
    description:
      "Viva Cuba Dance Studio to warszawska szkoła tańca dla dorosłych przy pl. Bankowym. W ofercie ma różne style latino i zajęcia solo, a zapisy oraz płatności prowadzi przez Fitssey. Do regularnych zajęć można dołączać także w trakcie trwania grupy.",
    phone: "+48 505 210 942",
    email: "kontakt@vivacuba.pl",
    amenities: ["publicTransport", "airConditioning"],
  },
};

export const SCHOOL_NAMES = Object.keys(SCHOOL_INFO) as School[];

/**
 * Cenniki tych szkół to rozbudowane tabele (karty sportowe, pakiety
 * wielkości, zniżki studenckie...) — zbyt złożone, żeby bezpiecznie
 * odzwierciedlić automatycznym scraperem bez ryzyka pokazania błędnej
 * kwoty. Zamiast tego: ręcznie sprawdzone streszczenie + link do pełnego,
 * aktualnego cennika źródłowego. Uaktualniaj `checkedOn` przy weryfikacji.
 */
export const SCHOOL_PRICING: Record<
  School,
  { fromPrice: string; note: string; pricingUrl: string; checkedOn: string }
> = {
  "Abra Studio": {
    fromPrice: "40 zł",
    note: "za pojedyncze wejście na zajęcia (karnet 4 wejść: 180 zł). Zajęcia Master i karty sportowe (Multisport, Medicover, PZU, Fit Profit) mają osobne stawki.",
    pricingUrl: "https://abra-studio.pl/cennik/",
    checkedOn: "2026-08-14",
  },
  "Salsa Libre": {
    fromPrice: "55 zł",
    note: "za godzinę w najmniejszym Pakiecie Elastycznym (Elastyczny 2: 110 zł za 2 h). Przy większych pakietach cena spada do ok. 19 zł/h.",
    pricingUrl: "https://salsalibre.pl/cenniki/",
    checkedOn: "2026-08-14",
  },
  "Warsaw Salsa Club": {
    fromPrice: "25 zł",
    note: "za godzinę w największym pakiecie Vip (20 h / 500 zł). Pojedyncze wejście bez karnetu (One-time): 55 zł.",
    pricingUrl: "https://www.warsawsalsaclub.pl/cennik",
    checkedOn: "2026-08-14",
  },
  "Oye!": {
    fromPrice: "50 zł",
    note: "za pojedyncze wejście. Pełny cennik obejmuje również karnety i zasady korzystania z kart sportowych.",
    pricingUrl: "https://szkolatancaoye.pl/cennik/",
    checkedOn: "2026-08-22",
  },
  "Viva Cuba": {
    fromPrice: "60 zł",
    note: "za pojedyncze wejście. Karnet 4 wejścia kosztuje 200 zł, 8 wejść 310 zł, a 12 wejść 440 zł.",
    pricingUrl: "https://vivacuba.pl/zajecia/cennik-zajec-tanecznych-viva-cuba-warszawa/",
    checkedOn: "2026-08-22",
  },
};
