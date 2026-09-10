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
const ABOUT_PAGE_URL = "https://abra-studio.pl/o-nas/";

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

/**
 * The grafik page renders this as "17:00 – 18:00 · 60 min" (an icon,
 * range, then duration) — pull the first two HH:MM values wherever they
 * fall in the string rather than anchoring to the end, since that end-of-
 * string anchor is exactly what silently broke start-time extraction when
 * the site added the end time and duration suffix.
 */
function extractTimes(rawTimeText: string): { startTime?: string; endTime?: string } {
  const matches = rawTimeText.match(/\d{1,2}:\d{2}/g);
  return { startTime: matches?.[0], endTime: matches?.[1] };
}

/**
 * Abra Studio doesn't publish instructor bios anywhere on their site (their
 * /instruktorzy/ archive and each instructor's own page render nothing but
 * the name), but the team roster at /abra-team/ does have a profile photo
 * per instructor. Used as a lighter-weight stand-in for a bio.
 */
interface InstructorSourceProfile {
  bio?: string;
  photoUrl?: string;
  profileUrl: string;
}

async function fetchInstructorProfiles(): Promise<Map<string, InstructorSourceProfile>> {
  const profiles = new Map<string, InstructorSourceProfile>();
  const [teamPage, aboutPage] = await Promise.allSettled([fetchPage(TEAM_PAGE_URL), fetchPage(ABOUT_PAGE_URL)]);

  if (teamPage.status === "fulfilled") {
    const $ = cheerio.load(teamPage.value);
    $(".abra-team-card").each((_, el) => {
      const name = $(el).find(".abra-team-name").first().text().trim();
      const photoUrl = $(el).find(".abra-team-photo-img").first().attr("src");
      if (name) profiles.set(name, { photoUrl, profileUrl: TEAM_PAGE_URL });
    });
  }

  if (aboutPage.status === "fulfilled") {
    const $ = cheerio.load(aboutPage.value);
    $("article.about-team-card").each((_, el) => {
      const name = $(el).find(".about-team-overlay span").first().text().trim();
      const bio = htmlToPlainText($(el).find(".about-team-overlay p").first().html());
      const photoUrl = $(el).find("img.about-team-image").first().attr("src");
      if (!name) return;
      profiles.set(name, {
        ...profiles.get(name),
        bio: bio || profiles.get(name)?.bio,
        photoUrl: photoUrl || profiles.get(name)?.photoUrl,
        profileUrl: ABOUT_PAGE_URL,
      });
    });
  }

  return profiles;
}

export async function scrapeAbraStudio(): Promise<ScrapedClass[]> {
  const results: ScrapedClass[] = [];
  const profiles = await fetchInstructorProfiles();

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
      const { startTime, endTime } = extractTimes(row.find(".grafik-class-time").text());
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
      const instructorBios: Record<string, string> = {};
      const instructorProfileUrls: Record<string, string> = {};
      for (const name of splitInstructors(instructor)) {
        const profile = profiles.get(name);
        if (profile?.photoUrl) instructorPhotos[name] = profile.photoUrl;
        if (profile?.bio) instructorBios[name] = profile.bio;
        if (profile?.profileUrl) instructorProfileUrls[name] = profile.profileUrl;
      }

      results.push({
        externalId: classId ?? `${day}-${startTime}-${title}`,
        title,
        danceStyle,
        level: level || undefined,
        format: classifyFormatFromText(classType, "unknown", splitInstructors(instructor).length),
        instructor: instructor || undefined,
        instructorBios: Object.keys(instructorBios).length > 0 ? instructorBios : undefined,
        instructorPhotos: Object.keys(instructorPhotos).length > 0 ? instructorPhotos : undefined,
        instructorProfileUrls: Object.keys(instructorProfileUrls).length > 0 ? instructorProfileUrls : undefined,
        location,
        description,
        dayOfWeek,
        startTime,
        endTime,
        sourceUrl: url,
      });
    });
  }

  return results;
}
