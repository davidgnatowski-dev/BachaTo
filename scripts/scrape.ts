import { runAllScrapers, runEventScrape, runCommunityEventScrape, runSchoolEventScrape } from "../lib/scrapers/runAll";

async function main() {
  console.log(`[${new Date().toISOString()}] Odświeżam grafiki zajęć i eventy...`);
  const classResults = await runAllScrapers();
  const eventResult = await runEventScrape(); // must finish before runSchoolEventScrape, which dedups against it
  const [communityResult, schoolEventResult] = await Promise.all([runCommunityEventScrape(), runSchoolEventScrape()]);
  const results = [...classResults, eventResult, communityResult, schoolEventResult];

  for (const r of results) {
    if (r.ok) {
      console.log(`  ✓ ${r.school}: ${r.foundCount} (${r.newCount} nowych)`);
    } else {
      console.error(`  ✗ ${r.school}: BŁĄD — ${r.error}`);
    }
  }

  const anyFailed = results.some((r) => !r.ok);
  process.exit(anyFailed ? 1 : 0);
}

main();
