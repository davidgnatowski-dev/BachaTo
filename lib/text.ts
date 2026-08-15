import * as cheerio from "cheerio";

/** Strips HTML (as published in course/event descriptions) down to readable plain text. */
export function htmlToPlainText(html: string | undefined | null): string | undefined {
  if (!html) return undefined;
  const $ = cheerio.load(html);
  $("br").replaceWith("\n");
  $("p, div, li").each((_, el) => {
    $(el).after("\n");
  });
  const text = $.root()
    .text()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
  return text || undefined;
}
