import { chromium } from "playwright";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { splitInstructors } from "../schedule";
import { htmlToPlainText } from "../text";

const URL = "https://app.fitssey.com/vivacubadancestudio/frontoffice";
const SCHEDULE_API_PATH = "/frontoffice/schedule";
const WEEKS_AHEAD = 4;

interface FitsseyMember {
  user?: { fullName?: string };
  publicBiography?: string | null;
  picture?: { absoluteUrl?: string } | null;
}

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
  members?: FitsseyMember[];
  member?: FitsseyMember;
  room?: { location?: { name?: string } };
}

interface FitsseySchedulePayload {
  schedule: {
    date: string;
    morning?: FitsseyEvent[];
    afternoon?: FitsseyEvent[];
    evening?: FitsseyEvent[];
  }[];
}

function toLocalTime(iso: string): string | undefined {
  return iso.match(/T(\d{2}:\d{2})/)?.[1];
}

function membersFor(event: FitsseyEvent): FitsseyMember[] {
  if (event.members?.length) return event.members;
  return event.member ? [event.member] : [];
}

export async function scrapeVivaCuba(): Promise<ScrapedClass[]> {
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
        const events = [...(day.morning ?? []), ...(day.afternoon ?? []), ...(day.evening ?? [])];
        for (const event of events) {
          const title = event.scheduleMeta?.classService?.name?.trim() ?? "";
          if (!/bachat/i.test(title)) continue;

          const externalId = `${event.referenceId}-${day.date}`;
          if (seen.has(externalId)) continue;
          seen.add(externalId);

          const members = membersFor(event);
          const instructor = members
            .map((member) => member.user?.fullName)
            .filter((name): name is string => Boolean(name))
            .join(", ");
          const instructorBios: Record<string, string> = {};
          const instructorPhotos: Record<string, string> = {};
          for (const member of members) {
            const name = member.user?.fullName;
            if (!name) continue;
            const bio = htmlToPlainText(member.publicBiography ?? undefined);
            if (bio) instructorBios[name] = bio;
            if (member.picture?.absoluteUrl) instructorPhotos[name] = member.picture.absoluteUrl;
          }

          results.push({
            externalId,
            title,
            danceStyle: "Bachata",
            level: event.scheduleMeta?.classService?.experienceLevel?.name?.pl_PL?.value || undefined,
            format: classifyFormatFromText(title, "unknown", splitInstructors(instructor).length),
            instructor: instructor || undefined,
            instructorBios: Object.keys(instructorBios).length ? instructorBios : undefined,
            instructorPhotos: Object.keys(instructorPhotos).length ? instructorPhotos : undefined,
            location: event.room?.location?.name || "Viva Cuba Dance Studio",
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
    await page.waitForSelector(".lb-schedule__content", { timeout: 15000 });

    const isScheduleResponse = (response: import("playwright").Response) =>
      response.request().method() === "POST" && response.url().includes(SCHEDULE_API_PATH);

    for (let week = 0; week < WEEKS_AHEAD; week++) {
      const nextWeek = page.locator(".lb-schedule__date-control a:has(.lb-icon-arrow-right)");
      if ((await nextWeek.count()) === 0) break;
      const [response] = await Promise.all([
        page.waitForResponse(isScheduleResponse, { timeout: 15000 }),
        nextWeek.click(),
      ]);
      await response.json().catch(() => undefined);
      await page.waitForTimeout(100);
    }
  } finally {
    await browser.close();
  }

  return results;
}
