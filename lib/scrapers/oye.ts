import * as cheerio from "cheerio";
import type { ScrapedClass } from "../types";
import { classifyFormatFromText } from "../format";
import { splitInstructors } from "../schedule";

const SCHEDULE_URL = "https://vacuna.szkolatancaoye.pl/grafik_iframe/";
const BASE_URL = "https://vacuna.szkolatancaoye.pl";

const DAY_BY_NAME: Record<string, number> = {
  poniedzialek: 1,
  wtorek: 2,
  sroda: 3,
  czwartek: 4,
  piatek: 5,
  sobota: 6,
  niedziela: 7,
};

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function displayTitle(raw: string): string {
  const lower = raw.toLocaleLowerCase("pl-PL");
  return lower.charAt(0).toLocaleUpperCase("pl-PL") + lower.slice(1);
}

function normalizeInstructor(raw: string): string {
  return raw.replace(/\s*&\s*/g, ", ").replace(/\s+/g, " ").trim();
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function parseOyeSchedule(html: string): ScrapedClass[] {
  const $ = cheerio.load(html);
  const rows: ScrapedClass[] = [];

  $(".dzien").each((_, dayElement) => {
    const dayName = normalized($(dayElement).find(".dzien_opis span").first().text());
    const dayOfWeek = DAY_BY_NAME[dayName];
    if (!dayOfWeek) return;

    $(dayElement)
      .find(".sala")
      .each((__, roomElement) => {
        const room = $(roomElement).find(".sala_opis span").first().text().replace(/\s+/g, " ").trim();

        $(roomElement)
          .find(".kurs")
          .each((___, courseElement) => {
            const rawTitle = $(courseElement).find(".typ").first().text().replace(/\s+/g, " ").trim();
            if (!/bachat/i.test(rawTitle)) return;

            const bookingPath = $(courseElement).find('a[href*="/grafik_zapis/"]').first().attr("href");
            const courseId = bookingPath?.match(/grafik_zapis\/(\d+)/)?.[1];
            const startTime = $(courseElement).find(".godzina").first().text().trim();
            if (!courseId || !/^\d{1,2}:\d{2}$/.test(startTime)) return;

            const title = displayTitle(rawTitle);
            const instructor = normalizeInstructor($(courseElement).find(".instruktor").first().text());
            const description = [
              $(courseElement).find(".start_kursu").first().text().replace(/\s+/g, " ").trim(),
              $(courseElement).find(".nabor_info").first().text().replace(/\s+/g, " ").trim(),
            ]
              .filter(Boolean)
              .join(". ");

            rows.push({
              externalId: `oye-${courseId}`,
              title,
              danceStyle: "Bachata",
              level: $(courseElement).find(".poziom").first().text().replace(/\s+/g, " ").trim() || undefined,
              format: classifyFormatFromText(title, "unknown", splitInstructors(instructor).length),
              instructor: instructor || undefined,
              location: ["Oye!", room].filter(Boolean).join(", "),
              description: description || undefined,
              dayOfWeek,
              startTime,
              endTime: addMinutes(startTime, 60),
              sourceUrl: bookingPath ? new URL(bookingPath, BASE_URL).toString() : SCHEDULE_URL,
            });
          });
      });
  });

  return rows;
}

export async function scrapeOye(): Promise<ScrapedClass[]> {
  const response = await fetch(SCHEDULE_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)" },
  });
  if (!response.ok) throw new Error(`${SCHEDULE_URL} -> HTTP ${response.status}`);
  return parseOyeSchedule(await response.text());
}
