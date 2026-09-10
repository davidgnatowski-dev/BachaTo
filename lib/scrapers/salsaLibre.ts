import { chromium } from "playwright";
import * as cheerio from "cheerio";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { htmlToPlainText } from "../text";
import { splitInstructors } from "../schedule";

const URL = "https://app.fitssey.com/SalsaLibre/frontoffice";
const INSTRUCTORS_URL = "https://salsalibre.pl/instruktorzy/";
const HOLIDANCE_URL = "https://salsalibre.pl/holidance-2026/";
const SCHEDULE_API_PATH = "/frontoffice/schedule";
const WEEKS_AHEAD = 2; // how many weeks (current + N more) to look at per run

interface FitsseyEvent {
  referenceId: string;
  startsAt: string;
  endsAt: string;
  scheduleMeta?: {
    classService?: {
      name?: string;
      description?: string;
      experienceLevel?: { name?: { pl_PL?: { value?: string } } };
    };
  };
  members?: {
    user?: { fullName?: string };
    publicBiography?: string | null;
    picture?: { absoluteUrl?: string } | null;
  }[];
  room?: { location?: { name?: string } };
}

interface FitsseySchedulePayload {
  schedule: { date: string; morning: FitsseyEvent[]; afternoon: FitsseyEvent[]; evening?: FitsseyEvent[] }[];
}

export interface InstructorSourceProfile {
  bio?: string;
  photoUrl?: string;
  profileUrl: string;
}

export async function fetchSalsaLibreInstructorProfiles(): Promise<Map<string, InstructorSourceProfile>> {
  const profiles = new Map<string, InstructorSourceProfile>();
  try {
    const response = await fetch(INSTRUCTORS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)" },
    });
    if (!response.ok) throw new Error(`${INSTRUCTORS_URL} -> HTTP ${response.status}`);
    const $ = cheerio.load(await response.text());
    const cards = $(".e-loop-item.instruktor.styl-tanca-bachata").toArray();

    for (const card of cards) {
      const name = $(card).find("h1 a").first().text().trim();
      const profileUrl = $(card).find("h1 a").first().attr("href");
      const photo = $(card).find(".elementor-widget-theme-post-featured-image img").first();
      const photoUrl = photo.attr("data-lazy-src") || photo.attr("src");
      if (!name || !profileUrl) continue;

      let bio: string | undefined;
      try {
        const profileResponse = await fetch(profileUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)" },
        });
        if (profileResponse.ok) {
          const profilePage = cheerio.load(await profileResponse.text());
          bio = htmlToPlainText(profilePage(".elementor-widget-theme-post-content").first().html());
        }
      } catch {
        // The roster still gives us a stable photo and official profile link.
      }

      profiles.set(name, { bio, photoUrl: photoUrl?.startsWith("data:") ? undefined : photoUrl, profileUrl });
    }
  } catch {
    // Instructor enrichment must never prevent the live schedule from loading.
  }
  return profiles;
}

function toLocalTime(iso: string): string | undefined {
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : undefined;
}

function normalized(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00Z`);
  const last = new Date(`${end}T12:00:00Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function levelFromTitle(title: string): string | undefined {
  const match = title.match(/\b(starter|p-?open|s-?open|p\d+|s\d+|open)\b/i);
  return match?.[1];
}

/**
 * Fitssey sometimes removes still-valid, future multi-day courses from its
 * public weekly calendar. Salsa Libre keeps those courses on the official
 * HoliDance page, so use that page as a second source.
 */
export function parseHoliDanceSchedule(html: string): ScrapedClass[] {
  const $ = cheerio.load(html);
  const year = Number(HOLIDANCE_URL.match(/(20\d{2})/)?.[1] ?? new Date().getFullYear());
  const rows: ScrapedClass[] = [];

  $(".elementor-accordion-item").each((_, accordion) => {
    const rangeLabel = $(accordion).find(".elementor-accordion-title").first().text().trim();
    const range = rangeLabel.match(/(\d{1,2})\.(\d{1,2})\s*[-–]\s*(\d{1,2})\.(\d{1,2})/);
    if (!range) return;

    const start = `${year}-${range[2].padStart(2, "0")}-${range[1].padStart(2, "0")}`;
    const end = `${year}-${range[4].padStart(2, "0")}-${range[3].padStart(2, "0")}`;

    $(accordion).find(".elementor-tab-content li").each((_, item) => {
      const readableItem = $(item).clone();
      readableItem.find("br").replaceWith(" ");
      readableItem.find("a").each((_, link) => {
        $(link).before(" ").after(" ");
      });
      const itemText = readableItem.text().replace(/\s+/g, " ").trim();
      if (!/bachat/i.test(itemText)) return;

      const time = itemText.match(/\b(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      if (!time) return;

      const titlePart = $(item)
        .find("strong, b")
        .toArray()
        .map((node) =>
          $(node)
            .contents()
            .filter((_, content) => content.type === "text")
            .text()
            .replace(/\s+/g, " ")
            .trim()
        )
        .find((text) => /bachat/i.test(text));
      const rawTitle = titlePart
        ?.replace(/^.*?(bachat)/i, "$1")
        .replace(/[,&\s]+$/g, "")
        .trim();
      if (!rawTitle) return;
      const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

      const instructors = $(item)
        .find('a[href*="/instruktor/"]')
        .toArray()
        .map((anchor) => $(anchor).text().replace(/\s+/g, " ").trim())
        .filter(Boolean);
      const uniqueInstructors = [...new Set(instructors)];
      const instructor = uniqueInstructors.join(", ");
      const bookingUrl = $(item).find('a[href*="app.fitssey.com"][href*="/courses/"]').first().attr("href");
      const courseId = bookingUrl?.match(/\/courses\/([^/]+)/)?.[1] ?? normalized(`${title}-${instructor}-${time[1]}`);

      let dates = datesBetween(start, end);
      if (/pon-pt\s+w\s+kolejnym\s+tygodniu/i.test(itemText)) {
        dates = [...dates, ...datesBetween(addDays(start, 7), addDays(end, 7))];
      }

      for (const specificDate of dates) {
        rows.push({
          externalId: `holidance-${courseId}-${specificDate}`,
          title,
          danceStyle: "Bachata",
          level: levelFromTitle(title),
          format: classifyFormatFromText(title, "partner", uniqueInstructors.length),
          instructor: instructor || undefined,
          location: "Salsa Libre, Żelazna 59",
          description: itemText,
          specificDate,
          startTime: time[1].padStart(5, "0"),
          endTime: time[2].padStart(5, "0"),
          sourceUrl: bookingUrl ?? HOLIDANCE_URL,
        });
      }
    });
  });

  const uniqueRows: ScrapedClass[] = [];
  for (const row of rows) {
    const duplicateIndex = uniqueRows.findIndex((candidate) => sameOccurrence(candidate, row));
    if (duplicateIndex >= 0) uniqueRows[duplicateIndex] = row;
    else uniqueRows.push(row);
  }
  return uniqueRows;
}

async function fetchHoliDanceSchedule(): Promise<ScrapedClass[]> {
  try {
    const response = await fetch(HOLIDANCE_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)" },
    });
    if (!response.ok) throw new Error(`${HOLIDANCE_URL} -> HTTP ${response.status}`);
    return parseHoliDanceSchedule(await response.text());
  } catch {
    return [];
  }
}

function sameOccurrence(a: ScrapedClass, b: ScrapedClass): boolean {
  return (
    a.specificDate === b.specificDate &&
    a.startTime === b.startTime &&
    normalized(a.instructor) === normalized(b.instructor)
  );
}

/**
 * Salsa Libre's booking widget (Fitssey) is a client-rendered SPA. Rather
 * than scrape its DOM, we render it with a real headless browser (same as
 * any visitor) and read the JSON it fetches from its own private schedule
 * API as it loads each week — that API carries richer data (course
 * description, instructor bio) than what's ever shown in the calendar grid
 * itself.
 */
export async function scrapeSalsaLibre(): Promise<ScrapedClass[]> {
  const [profiles, holiDanceRows] = await Promise.all([
    fetchSalsaLibreInstructorProfiles(),
    fetchHoliDanceSchedule(),
  ]);
  const browser = await chromium.launch();
  const results: ScrapedClass[] = [];
  const seen = new Set<string>();

  try {
    const page = await browser.newPage({
      userAgent: "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)",
      locale: "pl-PL",
    });

    page.on("response", async (response) => {
      if (response.request().method() !== "POST" || !response.url().includes(SCHEDULE_API_PATH)) return;
      let payload: FitsseySchedulePayload;
      try {
        payload = await response.json();
      } catch {
        return;
      }

      for (const day of payload.schedule ?? []) {
        for (const event of [...(day.morning ?? []), ...(day.afternoon ?? []), ...(day.evening ?? [])]) {
          // referenceId identifies the recurring class template, not the
          // specific calendar occurrence — the same id reappears every week
          // — so the dedup/upsert key must include the date too.
          const externalId = `${event.referenceId}-${day.date}`;
          if (seen.has(externalId)) continue;
          const title = event.scheduleMeta?.classService?.name?.trim() ?? "";
          if (!title.toLowerCase().includes("bachat")) continue;
          seen.add(externalId);

          const primaryMember = event.members?.[0];
          const instructor = (event.members ?? [])
            .map((m) => m.user?.fullName)
            .filter(Boolean)
            .join(", ");
          const instructorBios: Record<string, string> = {};
          const instructorPhotos: Record<string, string> = {};
          const instructorProfileUrls: Record<string, string> = {};
          for (const name of splitInstructors(instructor)) {
            const profile = profiles.get(name);
            const fitsseyBio = event.members?.find((member) => member.user?.fullName === name)?.publicBiography;
            const bio = htmlToPlainText(fitsseyBio ?? undefined) || profile?.bio;
            if (bio) instructorBios[name] = bio;
            if (profile?.photoUrl) instructorPhotos[name] = profile.photoUrl;
            if (profile?.profileUrl) instructorProfileUrls[name] = profile.profileUrl;
          }
          for (const member of event.members ?? []) {
            const name = member.user?.fullName;
            const photoUrl = member.picture?.absoluteUrl;
            if (name && photoUrl) instructorPhotos[name] = photoUrl;
          }

          results.push({
            externalId,
            title,
            danceStyle: "Bachata",
            level: event.scheduleMeta?.classService?.experienceLevel?.name?.pl_PL?.value || undefined,
            format: classifyFormatFromText(title, "partner", splitInstructors(instructor).length),
            instructor: instructor || undefined,
            instructorBio: htmlToPlainText(primaryMember?.publicBiography ?? undefined),
            instructorBios: Object.keys(instructorBios).length > 0 ? instructorBios : undefined,
            instructorPhotos: Object.keys(instructorPhotos).length > 0 ? instructorPhotos : undefined,
            instructorProfileUrls: Object.keys(instructorProfileUrls).length > 0 ? instructorProfileUrls : undefined,
            location: event.room?.location?.name || "Salsa Libre",
            description: htmlToPlainText(event.scheduleMeta?.classService?.description),
            specificDate: day.date,
            startTime: toLocalTime(event.startsAt),
            endTime: toLocalTime(event.endsAt),
            sourceUrl: URL,
          });
        }
      }
    });

    await page.goto(URL, { waitUntil: "networkidle" });

    // Dismiss the cookie banner if present so it doesn't block clicks.
    const closeCookies = page.locator('a[href="javascript:void(0);"] >> text=Zamknij').first();
    if (await closeCookies.isVisible().catch(() => false)) {
      await closeCookies.click().catch(() => {});
    }

    await page.waitForSelector(".lb-schedule__content", { timeout: 15000 });

    const isScheduleResponse = (r: import("playwright").Response) =>
      r.request().method() === "POST" && r.url().includes(SCHEDULE_API_PATH);

    for (let week = 0; week < WEEKS_AHEAD; week++) {
      // Wait for the click's own schedule fetch (not just any nearby one —
      // Fitssey doesn't always respond within a fixed delay), then make sure
      // the `page.on('response')` handler above has had a turn to parse it.
      // After the first navigation a "previous week" arrow appears *before*
      // the "next week" one in the DOM, so `.first()` would start clicking
      // backward — target the right-arrow icon specifically instead.
      const [response] = await Promise.all([
        page.waitForResponse(isScheduleResponse, { timeout: 15000 }),
        page.locator(".lb-schedule__date-control a:has(.lb-icon-arrow-right)").click(),
      ]);
      await response.json().catch(() => undefined);
      await page.waitForTimeout(200);
    }

    // Give the last week's response listener time to finish parsing before we tear the page down.
    await page.waitForTimeout(300);

    for (const officialRow of holiDanceRows) {
      if (results.some((liveRow) => sameOccurrence(liveRow, officialRow))) continue;
      if (seen.has(officialRow.externalId)) continue;
      seen.add(officialRow.externalId);
      results.push(officialRow);
    }
  } finally {
    await browser.close();
  }

  return results;
}
