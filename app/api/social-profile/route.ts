import { getCurrentUser } from "@/lib/auth";

const SOCIAL_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
]);

function allowedSocialUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && SOCIAL_HOSTS.has(url.hostname.toLowerCase()) ? url : null;
  } catch {
    return null;
  }
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function metaTags(html: string) {
  const tags = new Map<string, string>();
  for (const tag of html.match(/<meta\s+[^>]*>/gi) ?? []) {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)) {
      attributes.set(match[1].toLowerCase(), decodeHtml(match[2].trim()));
    }
    const key = attributes.get("property") ?? attributes.get("name");
    const content = attributes.get("content");
    if (key && content) tags.set(key.toLowerCase(), content);
  }
  return tags;
}

async function fetchSocialPage(initialUrl: URL) {
  let url = initialUrl;
  for (let redirectCount = 0; redirectCount < 3; redirectCount += 1) {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BachaTo/1.0; +https://bachato.pl)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Brak adresu przekierowania.");
      const next = allowedSocialUrl(new URL(location, url).toString());
      if (!next) throw new Error("Niedozwolone przekierowanie.");
      url = next;
      continue;
    }
    if (!response.ok) throw new Error("Profil nie udostępnił danych publicznych.");
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > 1_000_000) throw new Error("Odpowiedź profilu jest zbyt duża.");
    return response.text();
  }
  throw new Error("Zbyt wiele przekierowań.");
}

export async function GET(request: Request) {
  if (!(await getCurrentUser())) return Response.json({ error: "Zaloguj się ponownie." }, { status: 401 });

  const socialUrl = allowedSocialUrl(new URL(request.url).searchParams.get("url") ?? "");
  if (!socialUrl) {
    return Response.json({ error: "Wklej pełny link do profilu Instagram lub Facebook." }, { status: 400 });
  }

  try {
    const tags = metaTags(await fetchSocialPage(socialUrl));
    const rawTitle = tags.get("og:title") ?? tags.get("twitter:title") ?? "";
    const name = rawTitle.replace(/\s*[(@|].*$/, "").replace(/\s*[|–-]\s*(Instagram|Facebook).*$/i, "").trim();
    const description = (tags.get("og:description") ?? tags.get("description") ?? "").trim();
    const avatarUrl = tags.get("og:image") ?? tags.get("twitter:image") ?? "";

    if (!name && !description && !avatarUrl) {
      return Response.json({ error: "Ten profil nie udostępnia publicznych danych do automatycznego pobrania." }, { status: 422 });
    }
    return Response.json({ name: name || null, description: description || null, avatarUrl: avatarUrl || null });
  } catch {
    return Response.json({ error: "Nie udało się odczytać profilu. Pola możesz uzupełnić ręcznie." }, { status: 422 });
  }
}
