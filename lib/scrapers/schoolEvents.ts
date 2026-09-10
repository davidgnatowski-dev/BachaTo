import * as cheerio from "cheerio";
import type { ScrapedEvent } from "../types";
import { isLikelyNonBachataEvent } from "../events";

const USER_AGENT = "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)";

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

function polishDateToIso(raw: string): string | undefined {
  const match = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return undefined;
  const [, d, m, y] = match;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

const ABRA_IMPREZY_URL = "https://abra-studio.pl/imprezy/";

/**
 * Abra Studio's own party listings (season openers, themed nights,
 * anniversaries) — separate from their class schedule and not necessarily
 * ever submitted to Tensy, Poland's nationwide events aggregator.
 */
export async function scrapeAbraStudioEvents(): Promise<ScrapedEvent[]> {
  const html = await fetchPage(ABRA_IMPREZY_URL);
  const $ = cheerio.load(html);
  const results: ScrapedEvent[] = [];

  $(".events-card").each((_, el) => {
    const card = $(el);
    const title = card.find(".events-card-title").first().text().trim();
    const externalId = card.find("[data-class-id]").first().attr("data-class-id");
    if (!title || !externalId) return;
    // Abra Studio's /imprezy/ page isn't bachata-only ("Abra del Tango" etc.).
    if (isLikelyNonBachataEvent(title)) return;

    const pillTexts = card
      .find(".events-card-pill")
      .map((__, p) => $(p).text().trim())
      .get()
      .filter(Boolean);

    const startDate = pillTexts[0] ? polishDateToIso(pillTexts[0]) : undefined;
    if (!startDate) return;

    const rest = pillTexts.slice(1);
    const time = rest.find((t) => /^\d{1,2}:\d{2}/.test(t));
    const venue = rest.find((t) => !/^\d{1,2}:\d{2}/.test(t));

    results.push({
      externalId,
      category: "social",
      title: time ? `${title} · ${time}` : title,
      city: "Warszawa",
      venue,
      organizer: "Abra Studio",
      coverImage: card.find(".events-card-img").first().attr("src"),
      startDate,
      sourceUrl: ABRA_IMPREZY_URL,
    });
  });

  return results;
}

const SALSA_LIBRE_IMPREZY_URL = "https://salsalibre.pl/imprezy/";

const POLISH_MONTHS: Record<string, string> = {
  stycznia: "01",
  lutego: "02",
  marca: "03",
  kwietnia: "04",
  maja: "05",
  czerwca: "06",
  lipca: "07",
  sierpnia: "08",
  września: "09",
  października: "10",
  listopada: "11",
  grudnia: "12",
};

/** "17 października 2026" -> "2026-10-17". Doesn't handle the sheet's date *ranges* ("3–9.08.26 - pon.-nd.") — those are skipped. */
function salsaLibreDateToIso(raw: string): string | undefined {
  const match = raw.trim().match(/^(\d{1,2})\s+([a-ząćęłńóśźż]+)\s+(\d{4})$/i);
  if (!match) return undefined;
  const [, d, monthName, y] = match;
  const m = POLISH_MONTHS[monthName.toLowerCase()];
  if (!m) return undefined;
  return `${y}-${m}-${d.padStart(2, "0")}`;
}

/**
 * Salsa Libre's own events calendar table — a general Latin-dance-club
 * events sheet (mambo, salsa, kizomba nights included), hand-edited HTML
 * with inconsistent markup. Filtered down to titles that mention bachata,
 * since this app is bachata-specific and most of what's on that page isn't.
 */
export async function scrapeSalsaLibreEvents(): Promise<ScrapedEvent[]> {
  const html = await fetchPage(SALSA_LIBRE_IMPREZY_URL);
  const $ = cheerio.load(html);
  const results: ScrapedEvent[] = [];

  $("#eventsTable tbody tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const dateText = $(cells[0]).text().trim();
    const eventCell = $(cells[1]);
    const title = eventCell.text().trim();
    if (!dateText || !title) return;
    if (!title.toLowerCase().includes("bachat")) return;
    if (isLikelyNonBachataEvent(title)) return;

    const startDate = salsaLibreDateToIso(dateText);
    if (!startDate) return; // date ranges ("3–9.08.26...") aren't single-day events we can represent

    const href = eventCell.find("a").first().attr("href");

    results.push({
      externalId: `${startDate}-${title}`,
      category: title.toLowerCase().includes("competition") || title.toLowerCase().includes("zawody") ? "competition" : "social",
      title,
      city: "Warszawa",
      organizer: "Salsa Libre",
      startDate,
      sourceUrl: href && href.startsWith("http") ? href : SALSA_LIBRE_IMPREZY_URL,
    });
  });

  return results;
}
