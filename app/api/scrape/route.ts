import { NextResponse } from "next/server";
import {
  runAllScrapers,
  runEventScrape,
  runCommunityEventScrape,
  runSchoolEventScrape,
  runWorldCupEventScrape,
} from "@/lib/scrapers/runAll";

/**
 * Manual scrape trigger. This runs headless browsers and hits several
 * external sites, so it's not something a random visitor should be able to
 * kick off: it's enabled only outside production (local dev), or when the
 * request carries the SCRAPE_TOKEN secret. In production the scheduled
 * `npm run scrape` job is the real path.
 */
function authorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const token = process.env.SCRAPE_TOKEN;
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }
  const [classResults, eventResult] = await Promise.all([runAllScrapers(), runEventScrape()]);
  // Must run after runEventScrape() resolves — it dedups school-site events against fresh Tensy data.
  const [communityResult, schoolEventResult, worldCupResult] = await Promise.all([
    runCommunityEventScrape(),
    runSchoolEventScrape(),
    runWorldCupEventScrape(),
  ]);
  return NextResponse.json({ results: [...classResults, eventResult, communityResult, schoolEventResult, worldCupResult] });
}
