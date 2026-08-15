import type { School } from "./types";

/** Hand-maintained facts that don't come from the schedule scrape itself. */
export const SCHOOL_INFO: Record<School, { homepage: string; description: string }> = {
  "Abra Studio": {
    homepage: "https://www.abra-studio.pl/",
    description: "Szkoła tańca z dwiema salami w Warszawie (al. Jana Pawła II i ul. Długa), szeroka oferta zajęć bachaty.",
  },
  "Salsa Libre": {
    homepage: "https://salsalibre.pl/",
    description: "Szkoła tańca na Żelaznej 59 w Warszawie, zajęcia bachaty solo i w parach.",
  },
  "Warsaw Salsa Club": {
    homepage: "https://www.warsawsalsaclub.pl/",
    description: "Klub taneczny z kilkoma salami, obok bachaty uczy też m.in. salsy, kizomby i zouka.",
  },
};

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
};
