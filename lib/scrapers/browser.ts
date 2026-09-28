import { chromium, type Browser } from "playwright";

/**
 * Headless Chromium for the Fitssey-based scrapers (Salsa Libre, Viva Cuba).
 *
 * Locally this is Playwright's own browser. The Vercel build image lacks the
 * shared system libraries Playwright's Chromium needs ("error while loading
 * shared libraries", exit 127), so there we launch @sparticuz/chromium — a
 * Chromium build made for serverless Linux that ships those libraries.
 */
export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const serverless = (await import("@sparticuz/chromium")).default;
    return chromium.launch({
      executablePath: await serverless.executablePath(),
      args: serverless.args,
      headless: true,
    });
  }
  return chromium.launch();
}
