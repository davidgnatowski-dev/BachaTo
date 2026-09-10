import * as cheerio from "cheerio";

const USER_AGENT = "Mozilla/5.0 (compatible; BachataScheduleBot/0.1; +local-prototype)";

export interface SchoolImageResult {
  url: string;
  source: "og:image" | "twitter:image" | "hero" | "largest-image";
}

const BAD_FILENAME_PATTERN = /logo|icon|favicon|sprite|badge|avatar|placeholder/i;

const HERO_SELECTORS = [
  '[class*="hero"] img',
  '[class*="banner"] img',
  '[class*="jumbotron"] img',
  "header img",
  "section:first-of-type img",
];

/** Declared-dimensions floor for the "largest image on the page" fallback — well above any logo/icon size. */
const MIN_FALLBACK_WIDTH = 500;

function resolveUrl(src: string | undefined, base: URL): string | undefined {
  if (!src) return undefined;
  try {
    return new URL(src, base).toString();
  } catch {
    return undefined;
  }
}

function isLikelyLogoOrIcon(url: string): boolean {
  return BAD_FILENAME_PATTERN.test(url);
}

/**
 * Best-effort "what image represents this school" for use as a profile
 * cover photo. Tries, in order: og:image, twitter:image (sites set these
 * deliberately for link previews — the strongest signal), a hero/banner
 * <img>, then the largest <img> on the page with declared dimensions.
 * Filenames matching logo/icon/favicon/etc. are rejected at every step.
 * Returns undefined rather than guessing when nothing qualifies — callers
 * should fall back to the existing placeholder, never fabricate a URL.
 *
 * This is meant to be run occasionally (e.g. via `npm run school-images`)
 * against a school's homepage, not called at page-render time — it's a
 * network fetch of a third-party site, which has no place in this app's
 * synchronous SSR read path.
 */
export async function fetchSchoolCoverImage(homepageUrl: string): Promise<SchoolImageResult | undefined> {
  const res = await fetch(homepageUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return undefined;
  const html = await res.text();
  const $ = cheerio.load(html);
  const base = new URL(homepageUrl);

  const ogImage = resolveUrl($('meta[property="og:image"]').attr("content"), base);
  if (ogImage && !isLikelyLogoOrIcon(ogImage)) return { url: ogImage, source: "og:image" };

  const twitterImage = resolveUrl($('meta[name="twitter:image"]').attr("content"), base);
  if (twitterImage && !isLikelyLogoOrIcon(twitterImage)) return { url: twitterImage, source: "twitter:image" };

  for (const selector of HERO_SELECTORS) {
    const src = resolveUrl($(selector).first().attr("src"), base);
    if (src && !isLikelyLogoOrIcon(src)) return { url: src, source: "hero" };
  }

  let best: { url: string; area: number } | undefined;
  $("img").each((_, el) => {
    const src = resolveUrl($(el).attr("src"), base);
    if (!src || isLikelyLogoOrIcon(src)) return;
    const width = Number($(el).attr("width")) || 0;
    const height = Number($(el).attr("height")) || 0;
    if (width < MIN_FALLBACK_WIDTH || height === 0) return;
    const area = width * height;
    if (!best || area > best.area) best = { url: src, area };
  });
  if (best) return { url: best.url, source: "largest-image" };

  return undefined;
}
