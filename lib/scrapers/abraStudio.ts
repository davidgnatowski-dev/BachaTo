import * as cheerio from "cheerio";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { htmlToPlainText } from "../text";
import { splitInstructors } from "../schedule";

const PAGES = [
  "https://www.abra-studio.pl/grafik-jana-pawla/",
  "https://www.abra-studio.pl/grafik-dluga/",
];

const TEAM_PAGE_URL = "https://abra-studio.pl/abra-team/";

const DAY_CODE_TO_NUMBER: Record<string, number> = {
  pon: 1,
  wt: 2,
  sr: 3,
  czw: 4,
  pt: 5,
  sob: 6,
  nd: 7,
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)";

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.text();
}

function extractStartTime(rawTimeText: string): string | undefined {
  const match = rawTimeText.trim().match(/(\d{1,2}:\d{2})\s*$/);
  return match ? match[1] : undefined;
}

/**
 * Abra Studio doesn't publish instructor bios anywhere on their site (their
 * /instruktorzy/ archive and each instructor's own page render nothing but
 * the name), but the team roster at /abra-team/ does have a profile photo
 * per instructor. Used as a lighter-weight stand-in for a bio.
 */
async function fetchInstructorPhotos(): Promise<Map<string, string>> {
  const photos = new Map<string, string>();
  try {
    const html = await fetchPage(TEAM_PAGE_URL);
    const $ = cheerio.load(html);
    $(".abra-team-card").each((_, el) => {
      const name = $(el).find(".abra-team-name").first().text().trim();
      const src = $(el).find(".abra-team-photo-img").first().attr("src");
      if (name && src) photos.set(name, src);
    });
  } catch {
    // Team page structure changed or is unreachable — schedule scraping still succeeds without photos.
  }
  return photos;
}

export async function scrapeAbraStudio(): Promise<ScrapedClass[]> {
  const results: ScrapedClass[] = [];
  const photos = await fetchInstructorPhotos();

  for (const url of PAGES) {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $(".grafik-class-row").each((_, el) => {
      const row = $(el);
      const day = row.attr("data-day") ?? "";
      const dayOfWeek = DAY_CODE_TO_NUMBER[day];
      if (!dayOfWeek) return;

      const danceStyle =
        row
          .find(".grafik-meta-col")
          .filter((_, c) => $(c).find(".grafik-meta-label").text().trim() === "STYL TAŃCA")
          .find(".grafik-meta-val")
          .text()
          .trim() || "";

      if (!danceStyle.toLowerCase().startsWith("bachata")) return;

      const title = row.find(".grafik-class-name").text().trim();
      const startTime = extractStartTime(row.find(".grafik-class-time").text());
      const instructor = row
        .find(".grafik-meta-col")
        .filter((_, c) => $(c).find(".grafik-meta-label").text().trim() === "PROWADZĄCY")
        .find(".grafik-meta-val")
        .text()
        .trim();
      const level = row
        .find(".grafik-meta-col")
        .filter((_, c) => $(c).find(".grafik-meta-label").text().trim() === "POZIOM")
        .find(".grafik-meta-val")
        .text()
        .trim();
      const classType = row
        .find(".grafik-meta-col")
        .filter((_, c) => $(c).find(".grafik-meta-label").text().trim() === "TYP ZAJĘĆ")
        .find(".grafik-meta-val")
        .text()
        .trim();
      const classId = row.find("[data-class-id]").first().attr("data-class-id");
      const location = url.includes("jana-pawla") ? "al. Jana Pawła II" : "ul. Długa";
      const description = htmlToPlainText(row.find(".grafik-class-panel-inner").first().html());

      const instructorPhotos: Record<string, string> = {};
      for (const name of splitInstructors(instructor)) {
        const src = photos.get(name);
        if (src) instructorPhotos[name] = src;
      }

      results.push({
        externalId: classId ?? `${day}-${startTime}-${title}`,
        title,
        danceStyle,
        level: level || undefined,
        format: classifyFormatFromText(classType, "unknown"),
        instructor: instructor || undefined,
        instructorPhotos: Object.keys(instructorPhotos).length > 0 ? instructorPhotos : undefined,
        location,
        description,
        dayOfWeek,
        startTime,
        sourceUrl: url,
      });
    });
  }

  return results;
}
