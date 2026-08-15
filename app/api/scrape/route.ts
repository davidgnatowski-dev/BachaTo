import { NextResponse } from "next/server";
import { runAllScrapers, runEventScrape, runCommunityEventScrape, runSchoolEventScrape } from "@/lib/scrapers/runAll";

export async function POST() {
  const [classResults, eventResult] = await Promise.all([runAllScrapers(), runEventScrape()]);
  // Must run after runEventScrape() resolves — it dedups school-site events against fresh Tensy data.
  const [communityResult, schoolEventResult] = await Promise.all([runCommunityEventScrape(), runSchoolEventScrape()]);
  return NextResponse.json({ results: [...classResults, eventResult, communityResult, schoolEventResult] });
}
