import * as cheerio from "cheerio";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { htmlToPlainText } from "../text";
import { splitInstructors } from "../schedule";

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
interface InstructorSourceProfile {
  bio?: string;
  photoUrl?: string;
  profileUrl: string;
}

async function fetchInstructorProfiles(): Promise<Map<string, InstructorSourceProfile>> {
  const profiles = new Map<string, InstructorSourceProfile>();
  try {
    const res = await fetch(BIO_PAGE_URL, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) throw new Error(`${BIO_PAGE_URL} -> HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $(".teacher_content-wrapper").each((_, el) => {
      const displayName = $(el).find(".teacher_text-description > p").first().text().trim().replace(/&amp;/g, "&");
      const names = splitInstructors(displayName);
      const richText = $(el).find(".teacher_text-description .w-richtext").first();
      const photoUrl = $(el).find("img.teacher_photo").first().attr("src");
      const fullBio = htmlToPlainText(richText.html());
      const sections: { heading: string; text: string[] }[] = [];
      let current: { heading: string; text: string[] } | undefined;

      richText.find("p").each((__, paragraph) => {
        const text = $(paragraph).text().trim().replace(/\s+/g, " ");
        if (!text) return;
        const heading = $(paragraph).find("strong").first().text().trim();
        if (heading) {
          current = { heading, text: [] };
          sections.push(current);
        } else if (current) {
          current.text.push(text);
        }
      });

      for (const name of names) {
        const firstName = name.split(/\s+/)[0]?.toLocaleLowerCase("pl");
        const section = sections.find((item) => item.heading.toLocaleLowerCase("pl").startsWith(firstName));
        const bio = section?.text.join("\n\n") || (names.length === 1 ? fullBio : undefined);
        const profile = { bio, photoUrl, profileUrl: BIO_PAGE_URL };
        profiles.set(name, profile);
        // The schedule abbreviates Maciek Kurtyka to "Maciek K.", while the
        // official teacher card uses only his first name inside the duo.
        if (name === "Maciek") profiles.set("Maciek K.", profile);
      }
    });
  } catch {
    // Bio page structure changed or is unreachable — schedule scraping still succeeds without bios.
  }
  return profiles;
}

/**
 * Warsaw Salsa Club's schedule page renders every room/day/time slot with a
 * default (usually empty, "brak zajęć") entry plus an optional overlaid
 * special event. Only slots where the overlay has a real instructor assigned
 * represent an actual scheduled class, so we key off that.
 */
export async function scrapeWarsawSalsaClub(): Promise<ScrapedClass[]> {
  const [res, profiles] = await Promise.all([
    fetch(URL, { headers: { "User-Agent": USER_AGENT } }),
    fetchInstructorProfiles(),
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
        const instructorBios: Record<string, string> = {};
        const instructorPhotos: Record<string, string> = {};
        const instructorProfileUrls: Record<string, string> = {};
        for (const name of splitInstructors(instructor)) {
          const profile = profiles.get(name);
          if (profile?.bio) instructorBios[name] = profile.bio;
          if (profile?.photoUrl) instructorPhotos[name] = profile.photoUrl;
          if (profile?.profileUrl) instructorProfileUrls[name] = profile.profileUrl;
        }

        results.push({
          externalId: slugify(roomName, dayCode, startTime, title),
          title,
          danceStyle: "Bachata",
          level: level || undefined,
          format: classifyFormatFromText(formatText, "unknown", splitInstructors(instructor).length),
          instructor,
          instructorBios: Object.keys(instructorBios).length > 0 ? instructorBios : undefined,
          instructorPhotos: Object.keys(instructorPhotos).length > 0 ? instructorPhotos : undefined,
          instructorProfileUrls: Object.keys(instructorProfileUrls).length > 0 ? instructorProfileUrls : undefined,
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
