import * as cheerio from "cheerio";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { htmlToPlainText } from "../text";

const URL = "https://www.warsawsalsaclub.pl/grafik";
const BIO_PAGE_URL = "https://www.warsawsalsaclub.pl/bachata";

const DAY_CODE_TO_NUMBER: Record<string, number> = {
  pn: 1,
  wt: 2,
  śr: 3,
  czw: 4,
  pt: 5,
  sb: 6,
  nd: 7,
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)";

function normalizeTime(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^\d{1,2}:\d{2}$/.test(t)) return t.padStart(5, "0");
  if (/^\d{1,2}$/.test(t)) return `${t.padStart(2, "0")}:00`;
  return undefined;
}

function slugify(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * The schedule grid only has instructor names, no bios. Warsaw Salsa Club
 * publishes those separately, in a "poznaj instruktorów" teacher carousel on
 * the /bachata style page — keyed by the same short display name (e.g.
 * "Maciek K.") that also appears as the schedule's instructor label, so we
 * can join the two on that string.
 */
async function fetchInstructorBios(): Promise<Map<string, string>> {
  const bios = new Map<string, string>();
  try {
    const res = await fetch(BIO_PAGE_URL, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${BIO_PAGE_URL} -> HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $(".teacher_content-wrapper").each((_, el) => {
      const name = $(el).find(".teacher_text-description > p").first().text().trim().replace(/&amp;/g, "&");
      const bio = htmlToPlainText($(el).find(".teacher_text-description .w-richtext").first().html());
      if (name && bio) bios.set(name, bio);
    });
  } catch {
    // Bio page structure changed or is unreachable — schedule scraping still succeeds without bios.
  }
  return bios;
}

/**
 * Warsaw Salsa Club's schedule page renders every room/day/time slot with a
 * default (usually empty, "brak zajęć") entry plus an optional overlaid
 * special event. Only slots where the overlay has a real instructor assigned
 * represent an actual scheduled class, so we key off that.
 */
export async function scrapeWarsawSalsaClub(): Promise<ScrapedClass[]> {
  const [res, bios] = await Promise.all([
    fetch(URL, { headers: { "User-Agent": USER_AGENT } }),
    fetchInstructorBios(),
  ]);
  if (!res.ok) throw new Error(`${URL} -> HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const results: ScrapedClass[] = [];

  $(".schedule_column-wrapper").each((_, column) => {
    const roomName = $(column).find(".schedule_column-title").first().text().trim().replace(/\s+/g, " ");

    $(column)
      .find(".schedule_cms-item")
      .each((__, item) => {
        const $item = $(item);
        const teacherNameEls = $item.find(".schedule_class-item-teachers-names");
        if (teacherNameEls.length < 2) return; // no override present for this slot

        const overrideTeacher = teacherNameEls.eq(1).text().trim();
        if (!overrideTeacher || overrideTeacher === "brak zajęć") return;

        const overrideBlock = $item.find(".schedule_class").eq(1);
        if (overrideBlock.length === 0) return;

        const dayCode = overrideBlock.find('[fs-cmsfilter-field="day"]').first().text().trim();
        const dayOfWeek = DAY_CODE_TO_NUMBER[dayCode];
        if (!dayOfWeek) return;

        const nameTexts = overrideBlock
          .find(".schedule_class-detail:has(img[src*='dance'])")
          .find("p")
          .map((___, p) => $(p).text().trim())
          .get()
          .filter(Boolean);
        const title = nameTexts[nameTexts.length - 1];
        if (!title || !title.toLowerCase().includes("bachat")) return;

        const hourTexts = overrideBlock
          .find(".schedule_class-item-hours p")
          .map((___, p) => $(p).text().trim())
          .get();
        const startTime = normalizeTime(hourTexts[0] ?? "");
        const endTime = normalizeTime(hourTexts[hourTexts.length - 1] ?? "");

        const levelTexts = overrideBlock
          .find(".schedule_class-detail:has(img[src*='lvl'])")
          .find("p")
          .map((___, p) => $(p).text().trim())
          .get()
          .filter(Boolean);
        const level = levelTexts[levelTexts.length - 1];

        const formatTexts = overrideBlock
          .find(".schedule_class-detail:has(img[src*='pair'])")
          .find("p")
          .map((___, p) => $(p).text().trim())
          .get()
          .filter(Boolean);
        const formatText = formatTexts[formatTexts.length - 1];
        const instructor = overrideTeacher.replace(/&amp;/g, "&");

        results.push({
          externalId: slugify(roomName, dayCode, startTime, title),
          title,
          danceStyle: "Bachata",
          level: level || undefined,
          format: classifyFormatFromText(formatText, "unknown"),
          instructor,
          instructorBio: bios.get(instructor),
          location: roomName ? `Warsaw Salsa Club, ${roomName}` : "Warsaw Salsa Club",
          dayOfWeek,
          startTime,
          endTime,
          sourceUrl: URL,
        });
      });
  });

  return results;
}
