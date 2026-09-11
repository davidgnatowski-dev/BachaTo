import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import type { ScrapedEvent } from "../types";

const BASE = "https://bachatasocialworldcup.com";
const QUALIFIERS_URL = `${BASE}/qualifiers?category=worldcup-2026-2027`;
const USER_AGENT = "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)";
const WORLD_CUP_SERIES = "Bachata Social World Cup 2026/2027";
const CUP_PARENT_BY_LABEL: Record<string, string> = {
  "North American Cup": "bachata-social-north-american-cup-2027",
  "South American Cup": "bachata-social-south-american-cup-2027",
};
const CUP_PARENT_BY_QUALIFIER: Record<string, string> = {
  "bolivia-qualifier-2027": "bachata-social-south-american-cup-2027",
  "venezuela-qualifier-2027": "bachata-social-south-american-cup-2027",
  "colombia-qualifier-2027": "bachata-social-south-american-cup-2027",
  "uruguay-qualifier-2027": "bachata-social-south-american-cup-2027",
};

const PLACE_TRANSLATIONS: Record<string, string> = {
  Albania: "Albania",
  Athens: "Ateny",
  Austria: "Austria",
  Belgium: "Belgia",
  Bolivia: "Boliwia",
  "Bolivia, Plurinational State of": "Boliwia",
  Brazil: "Brazylia",
  Bucharest: "Bukareszt",
  Bulgaria: "Bułgaria",
  Canada: "Kanada",
  China: "Chiny",
  Cologne: "Kolonia",
  Colombia: "Kolumbia",
  Copenhagen: "Kopenhaga",
  Croatia: "Chorwacja",
  Cyprus: "Cypr",
  Czechia: "Czechy",
  Denmark: "Dania",
  Egypt: "Egipt",
  Finland: "Finlandia",
  France: "Francja",
  Geneva: "Genewa",
  Germany: "Niemcy",
  Greece: "Grecja",
  Hungary: "Węgry",
  India: "Indie",
  Italy: "Włochy",
  Japan: "Japonia",
  "Korea, Republic of": "Korea Południowa",
  Latvia: "Łotwa",
  Lithuania: "Litwa",
  London: "Londyn",
  Luxembourg: "Luksemburg",
  Madrid: "Madryt",
  Mexico: "Meksyk",
  "Mexico City": "Meksyk",
  Milan: "Mediolan",
  Milano: "Mediolan",
  Netherlands: "Holandia",
  "New York City": "Nowy Jork",
  Nuremberg: "Norymberga",
  Paris: "Paryż",
  Poland: "Polska",
  Portugal: "Portugalia",
  Prague: "Praga",
  Romania: "Rumunia",
  Serbia: "Serbia",
  Slovakia: "Słowacja",
  Slovenia: "Słowenia",
  "South Korea": "Korea Południowa",
  Spain: "Hiszpania",
  Sweden: "Szwecja",
  Switzerland: "Szwajcaria",
  Tokyo: "Tokio",
  "United Kingdom": "Wielka Brytania",
  "United States": "Stany Zjednoczone",
  Uruguay: "Urugwaj",
  Venezuela: "Wenezuela",
  "Venezuela, Bolivarian Republic of": "Wenezuela",
  Vienna: "Wiedeń",
  Warsaw: "Warszawa",
  Zurich: "Zurych",
};

/**
 * English country name (as the site's own qualifier titles use it) -> ISO
 * 3166-1 alpha-2, for a flag fallback image when a qualifier card has no
 * photo of its own (most don't — only host events tend to carry one).
 */
const COUNTRY_ISO: Record<string, string> = {
  Albania: "al",
  Australia: "au",
  Austria: "at",
  Belgium: "be",
  Bolivia: "bo",
  "Bolivia, Plurinational State of": "bo",
  Brazil: "br",
  Bulgaria: "bg",
  Canada: "ca",
  China: "cn",
  Colombia: "co",
  Croatia: "hr",
  Cyprus: "cy",
  Czechia: "cz",
  Denmark: "dk",
  Egypt: "eg",
  Finland: "fi",
  France: "fr",
  Germany: "de",
  Greece: "gr",
  Hungary: "hu",
  India: "in",
  Italy: "it",
  Japan: "jp",
  Korea: "kr",
  "Korea, Republic of": "kr",
  "South Korea": "kr",
  Latvia: "lv",
  Lithuania: "lt",
  Luxembourg: "lu",
  Mexico: "mx",
  Netherlands: "nl",
  Poland: "pl",
  Portugal: "pt",
  Romania: "ro",
  Serbia: "rs",
  Slovakia: "sk",
  Slovenia: "si",
  Spain: "es",
  Sweden: "se",
  Switzerland: "ch",
  "United Kingdom": "gb",
  "United States": "us",
  Uruguay: "uy",
  Venezuela: "ve",
  "Venezuela, Bolivarian Republic of": "ve",
};

/** flagcdn.com — a free, stable public flag CDN; same hotlink pattern already used for other scrapers' coverImage. */
function countryFlagUrl(country: string | undefined): string | undefined {
  if (!country) return undefined;
  const iso = COUNTRY_ISO[country];
  return iso ? `https://flagcdn.com/w320/${iso}.png` : undefined;
}

/**
 * The site's own qualifier titles are "<Country> Qualifier[ - <City>]" in
 * English — the single most reliable per-card country signal, more so than
 * the location line (which some cards omit). Cup umbrellas and finals don't
 * match, which is correct: they span multiple countries, so no one flag fits.
 */
function qualifierCountryName(originalTitle: string): string | undefined {
  const match = originalTitle.match(/^(.+?)\s+Qualifier(\s+(?:II|III|IV|\d+))?(?:\s*-\s*.+)?$/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Fallback for the many qualifiers named after a city rather than a country
 * ("Cologne Qualifier", "Pré-sélection Aix-les-Bains…") — the map-pin
 * location line is always "City, Country" in English, so its last segment
 * is the country regardless of what the title says.
 */
function locationCountryName(location: string | undefined): string | undefined {
  if (!location) return undefined;
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : undefined;
}

const MONTHS: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
  Jan: "01",
  Feb: "02",
  Mar: "03",
  Apr: "04",
  Jun: "06",
  Jul: "07",
  Aug: "08",
  Sep: "09",
  Oct: "10",
  Nov: "11",
  Dec: "12",
};

function normalizedText(node: Cheerio<AnyNode>): string {
  return node.text().replace(/\s+/g, " ").trim();
}

function iconRow(card: Cheerio<AnyNode>, iconClass: string): Cheerio<AnyNode> {
  return card.find(`svg.${iconClass}`).first().parent();
}

function parseEnglishDate(value: string): string | undefined {
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/);
  if (!match) return undefined;
  const month = MONTHS[match[1]];
  if (!month) return undefined;
  return `${match[3]}-${month}-${match[2].padStart(2, "0")}`;
}

function parseDateRange(value: string): { startDate: string; endDate?: string } | undefined {
  const parts = value.split(/\s+[–—]\s+/);
  const startDate = parseEnglishDate(parts[0]);
  if (!startDate) return undefined;
  const endDate = parts[1] ? parseEnglishDate(parts[1]) : undefined;
  return { startDate, ...(endDate && endDate !== startDate ? { endDate } : {}) };
}

function statusLabel(cardText: string): string | undefined {
  if (cardText.includes("Registration Open")) return "Zapisy otwarte";
  if (cardText.includes("Registration Closed")) return "Zapisy zamknięte";
  if (cardText.includes("Registration Pending")) return "Zapisy jeszcze nieaktywne";
  return undefined;
}

function polishPlace(value: string): string {
  return Object.entries(PLACE_TRANSLATIONS)
    .sort(([a], [b]) => b.length - a.length)
    .reduce((text, [english, polish]) => text.replace(new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), polish), value);
}

function registrationStatus(cardText: string) {
  if (/\d+\s+qualifying events/i.test(cardText)) return "through_qualifiers" as const;
  if (cardText.includes("Registration Open")) return "open" as const;
  if (cardText.includes("Registration Closed")) return "closed" as const;
  if (cardText.includes("Registration Pending")) return "pending" as const;
  return undefined;
}

function registrationPrice(card: Cheerio<AnyNode>): string | undefined {
  return normalizedText(iconRow(card, "lucide-banknote")).replace(/^Registration price:\s*/i, "") || undefined;
}

function polishCompetitionTitle(title: string): string {
  const translatedTitles: Record<string, string> = {
    "Bachata Social North American Cup": "Puchar Ameryki Północnej Bachata Social",
    "Bachata Social South American Cup": "Puchar Ameryki Południowej Bachata Social",
    "Bachata Social French Cup (Amateur)": "Puchar Francji Bachata Social — amatorzy",
    "Bachata Social French Cup (Pro)": "Puchar Francji Bachata Social — zawodowcy",
    "Italian Cup Finals 2027": "Finał Pucharu Włoch 2027",
    "Spanish Cup Finals 2027": "Finał Pucharu Hiszpanii 2027",
    "French Cup Finals 2027": "Finał Pucharu Francji 2027",
    "Bachata Social German Championship 2027": "Mistrzostwa Niemiec Bachata Social 2027",
    "Bachata Social Asian Cup - Tokyo Final 2027": "Finał Azjatyckiego Pucharu Bachata Social — Tokio 2027",
    "World Cup Finals 2027": "Finał Bachata Social World Cup 2027",
  };
  if (translatedTitles[title]) return translatedTitles[title];

  const qualifier = title.match(/^(.+?)\s+Qualifier(\s+(?:II|III|IV|\d+))?(?:\s*-\s*(.+))?$/i);
  if (qualifier) {
    const place = polishPlace([qualifier[1], qualifier[3]].filter(Boolean).join(" — "));
    return `Eliminacje${qualifier[2] ?? ""} — ${place}`;
  }
  const translatedPrefix = title.match(/^(?:Qualificazione|Qualificazioni|Clasificatorio|Pré-sélection|Pré-selection|Preselezione)\s+(.+)$/i);
  if (!translatedPrefix) return title;

  const translatedRemainder = polishPlace(translatedPrefix[1])
    .replace(/^Finale\s*\(Amateur\)$/i, "finałowe — amatorzy")
    .replace(/^Finale\s*\(Pro\)$/i, "finałowe — zawodowcy")
    .replace(/^Finale\s+/i, "finałowe — ");
  return `Eliminacje ${translatedRemainder}`;
}

function polishQualificationMode(value: string): string {
  return value
    .replace(/Open Registration/gi, "rejestracja otwarta")
    .replace(/Direct Registration/gi, "rejestracja bezpośrednia")
    .replace(/Qualified Registration/gi, "rejestracja dla zakwalifikowanych")
    .replace(/Qualification Required/gi, "wymagany wcześniejszy awans")
    .replace(/Invitation Only/gi, "wyłącznie na zaproszenie");
}

function polishCup(value: string): string {
  const translated: Record<string, string> = {
    European: "Europa",
    Intercontinental: "cykl międzykontynentalny",
    "North American Cup": "Puchar Ameryki Północnej",
    "South American Cup": "Puchar Ameryki Południowej",
  };
  return translated[value] ?? value;
}

function qualificationTarget(card: Cheerio<AnyNode>): { name?: string; leaderCount?: string; followerCount?: string } {
  const trophyRow = iconRow(card, "lucide-trophy");
  const trophySpans = trophyRow.find("span").toArray().map((node) => normalizedText(card.find(node))).filter(Boolean);
  const rawTarget = trophySpans.find((text) => text !== "Qualifies for" && text !== "Qualified for" && text !== "L" && text !== "F" && !/^\d+$/.test(text));
  const counts = trophyRow.find("span.font-bold").toArray().map((node) => normalizedText(card.find(node)));
  const translatedTargets: Record<string, string> = {
    "World Cup Finals 2027": "Finał Bachata Social World Cup 2027 w Genewie",
    "Italian Cup Finals 2027": "Finał Pucharu Włoch 2027",
    "Spanish Cup Finals 2027": "Finał Pucharu Hiszpanii 2027",
    "French Cup Finals 2027": "Finał Pucharu Francji 2027",
    "Bachata Social German Championship 2027": "Mistrzostwa Niemiec Bachata Social 2027",
    "Switzerland Qualifier": "Eliminacje w Szwajcarii",
    "Bachata Social French Cup (Amateur)": "Puchar Francji Bachata Social — amatorzy",
    "Bachata Social French Cup (Pro)": "Puchar Francji Bachata Social — zawodowcy",
    "Bachata Social Asian Cup - Tokyo Final 2027": "Finał Azjatyckiego Pucharu Bachata Social — Tokio 2027",
  };
  const name = rawTarget ? (translatedTargets[rawTarget] ?? polishPlace(rawTarget)) : undefined;
  return { name, leaderCount: counts[0], followerCount: counts[1] };
}

function roleCount(value: string, singular: "Leader" | "Follower"): string {
  return `${value} ${Number(value) === 1 ? singular : `${singular}ów`}`;
}

function competitionDescription(
  card: Cheerio<AnyNode>,
  cup: string | undefined,
  host: string | undefined,
  location: string | undefined
): string {
  const cardText = normalizedText(card);
  const details: string[] = ["Oficjalne zawody sezonu Bachata Social World Cup 2026/2027."];

  if (host) details.push(`Wydarzenie-gospodarz: ${host}.`);
  if (cup) details.push(`Cykl: ${polishCup(cup)}.`);
  if (location) details.push(`Lokalizacja: ${polishPlace(location)}.`);

  const registrationType = normalizedText(iconRow(card, "lucide-target").find("span").first());
  if (/registration|qualification|invitation/i.test(registrationType)) {
    details.push(`Tryb kwalifikacji: ${polishQualificationMode(registrationType)}.`);
  }

  const status = statusLabel(cardText);
  if (status) details.push(`${status}.`);

  const price = registrationPrice(card);
  if (price) details.push(`Koszt zgłoszenia: ${price}.`);

  const spots = normalizedText(iconRow(card, "lucide-users")).match(/(\d+)\s*\/\s*(\d+)/);
  if (spots) details.push(`Zajęte miejsca: ${spots[1]}/${spots[2]}.`);

  const leaders = cardText.match(/Leaders:\s*(\d+\s*\/\s*\d+\s*spots occupied)/i)?.[1];
  const followers = cardText.match(/Followers:\s*(\d+\s*\/\s*\d+\s*spots occupied)/i)?.[1];
  if (leaders || followers) {
    details.push(
      [leaders ? `Leader: ${leaders.replace(/\s*spots occupied/i, "")}` : undefined, followers ? `Follower: ${followers.replace(/\s*spots occupied/i, "")}` : undefined]
        .filter(Boolean)
        .join(", ") + "."
    );
  }

  const warnings: Record<string, string> = {
    "No leader spots available": "Brak wolnych miejsc dla Leaderów.",
    "No follower spots available": "Brak wolnych miejsc dla Followerów.",
    "No spots available": "Brak wolnych miejsc.",
  };
  for (const [warning, translated] of Object.entries(warnings)) {
    if (cardText.includes(warning)) details.push(translated);
  }

  const target = qualificationTarget(card);
  if (target.name) {
    const suffix = target.leaderCount && target.followerCount
      ? ` — ${roleCount(target.leaderCount, "Leader")}, ${roleCount(target.followerCount, "Follower")}`
      : "";
    details.push(`Awans do: ${target.name}${suffix}.`);
  }

  const qualifyingEvents = normalizedText(iconRow(card, "lucide-target")).match(/^(\d+)\s+qualifying events/i)?.[1];
  if (qualifyingEvents) details.push(`Cykl obejmuje ${qualifyingEvents} wydarzeń kwalifikacyjnych.`);

  return details.join("\n");
}

/** Parses both upcoming and finished cards; the DB query hides past events automatically. */
export function parseBachataSocialWorldCupHtml(html: string): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $(".animate-card-entrance").each((_index, element) => {
    const card = $(element);
    const href = card.find('a[href^="/qualifiers/"]').first().attr("href");
    const originalTitle = normalizedText(card.find("h3").first());
    const dateText = normalizedText(iconRow(card, "lucide-calendar"));
    const dates = parseDateRange(dateText);
    if (!href || !originalTitle || !dates) return;

    const headingColumn = card.find("h3").first().closest(".flex-1");
    const host = normalizedText(headingColumn.find("p").first()) || undefined;
    const cup = normalizedText(headingColumn.find(".inline-flex span").first()) || undefined;
    const location = normalizedText(iconRow(card, "lucide-map-pin"));
    const rawCity = location ? location.split(",")[0].trim() : undefined;
    const city = rawCity ? polishPlace(rawCity) : undefined;
    const externalId = href.replace(/^\/qualifiers\//, "").replace(/\/$/, "");
    const image = card.find("img").first().attr("src");
    const target = qualificationTarget(card);
    const isWorldFinal = externalId === "world-cup-finals-2027";
    const parentFromCup = cup ? CUP_PARENT_BY_LABEL[cup] : undefined;
    const competitionParentId = CUP_PARENT_BY_QUALIFIER[externalId] ?? (parentFromCup !== externalId ? parentFromCup : undefined);
    const cardText = normalizedText(card);
    // Only single-country qualifiers get a flag fallback — cup umbrellas and
    // the world final span multiple countries, so no one flag would be honest.
    // Try the title first ("Poland Qualifier"), then the map-pin location
    // ("Cologne, Germany") for the many qualifiers named after a city.
    const flagUrl = isWorldFinal
      ? undefined
      : countryFlagUrl(qualifierCountryName(originalTitle)) ?? countryFlagUrl(locationCountryName(location));

    events.push({
      externalId,
      category: "competition",
      title: polishCompetitionTitle(originalTitle),
      city,
      organizer: host ?? "Bachata Social World Cup",
      coverImage: (image?.startsWith("http") ? image : undefined) ?? flagUrl,
      description: competitionDescription(card, cup, host, location || undefined),
      competitionSeries: WORLD_CUP_SERIES,
      competitionStage: isWorldFinal ? "final" : "qualifier",
      qualifiesFor: isWorldFinal ? undefined : (target.name ?? "Finał Bachata Social World Cup 2027 w Genewie"),
      competitionParentId,
      registrationStatus: registrationStatus(cardText),
      registrationPrice: registrationPrice(card),
      qualifyingSpotsLeaders: target.leaderCount ? Number(target.leaderCount) : undefined,
      qualifyingSpotsFollowers: target.followerCount ? Number(target.followerCount) : undefined,
      ...dates,
      sourceUrl: new URL(href, BASE).toString(),
    });
  });

  return Array.from(new Map(events.map((event) => [event.externalId, event])).values());
}

export async function scrapeBachataSocialWorldCupEvents(): Promise<ScrapedEvent[]> {
  const response = await fetch(QUALIFIERS_URL, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!response.ok) throw new Error(`${QUALIFIERS_URL} -> HTTP ${response.status}`);

  const events = parseBachataSocialWorldCupHtml(await response.text());
  if (events.length === 0) throw new Error("Na stronie Bachata Social World Cup nie znaleziono kart kwalifikacji.");
  return events;
}
