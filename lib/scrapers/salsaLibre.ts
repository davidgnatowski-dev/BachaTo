import { chromium } from "playwright";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { htmlToPlainText } from "../text";

const URL = "https://app.fitssey.com/SalsaLibre/frontoffice";
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
  members?: { user?: { fullName?: string }; publicBiography?: string | null }[];
  room?: { location?: { name?: string } };
}

interface FitsseySchedulePayload {
  schedule: { date: string; morning: FitsseyEvent[]; afternoon: FitsseyEvent[] }[];
}

function toLocalTime(iso: string): string | undefined {
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : undefined;
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
        for (const event of [...(day.morning ?? []), ...(day.afternoon ?? [])]) {
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

          results.push({
            externalId,
            title,
            danceStyle: "Bachata",
            level: event.scheduleMeta?.classService?.experienceLevel?.name?.pl_PL?.value || undefined,
            format: classifyFormatFromText(title, "partner"),
            instructor: instructor || undefined,
            instructorBio: htmlToPlainText(primaryMember?.publicBiography ?? undefined),
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
  } finally {
    await browser.close();
  }

  return results;
}
