# Grafik bachaty — Warszawa (prototyp)

Aplikacja pokazuje tygodniowy grafik zajęć **bachaty** w warszawskich szkołach tańca,
pobierany bezpośrednio ze stron tych szkół. Obecnie obsługiwane szkoły:

- **Abra Studio** — statyczny HTML (`grafik-jana-pawla`, `grafik-dluga`)
- **Warsaw Salsa Club** — statyczny HTML (`/grafik`)
- **Salsa Libre** — grafik osadzony w systemie rezerwacji Fitssey (SPA); pobierany
  przez headless przeglądarkę (Playwright), tak jak zrobiłaby to zwykła przeglądarka

## Jak to działa

1. `lib/scrapers/*.ts` — po jednym module na szkołę, każdy zwraca listę zajęć bachaty.
2. `lib/db.ts` — SQLite (`data/bachata.sqlite`) przechowuje wszystkie zeskrapowane
   zajęcia. Przy każdym uruchomieniu scrapera dane są "upsertowane": istniejące
   zajęcia są aktualizowane, nowe dostają znacznik `NOWOŚĆ` (widoczny przez 7 dni od
   pierwszego zobaczenia), a te, które zniknęły ze strony szkoły, przestają być
   pokazywane (nie są jednak kasowane z bazy — zostają jako historia).
3. Strona główna (`app/page.tsx`) czyta bazę bezpośrednio przy każdym żądaniu — nie
   ma własnego cache, więc zawsze pokazuje to, co jest w bazie.
4. Przycisk **"Odśwież teraz"** woła `POST /api/scrape`, który odpala wszystkie trzy
   scrapery na żywo (zajmuje to ok. 20–40 s, głównie przez Salsa Libre/Playwright).

### "Real-time" w praktyce

Strony szkół nie udostępniają żadnego API do subskrypcji zmian, więc prawdziwy
real-time nie istnieje. Zamiast tego jest **odpytywanie okresowe**: raz dziennie
(automatycznie, patrz niżej) albo na żądanie (przycisk w UI). Aplikacja sama w sobie
zawsze pokazuje aktualny stan bazy natychmiast.

## Uruchomienie lokalne

```bash
npm install
npm run scrape   # pierwsze pobranie danych (~30s)
npm run dev       # http://localhost:3000
```

## Codzienna automatyzacja (macOS `launchd`)

Nic nie instaluje się automatycznie — to świadoma decyzja, bo `launchd`/`cron` to
stała zmiana w systemie. Żeby włączyć codzienne odświeżanie o 6:00:

```bash
cp scripts/com.bachataschedule.scrape.plist.example ~/Library/LaunchAgents/com.bachataschedule.scrape.plist
# sprawdź w pliku ścieżkę do npm (which npm) i WorkingDirectory
launchctl load ~/Library/LaunchAgents/com.bachataschedule.scrape.plist
```

Wyłączenie: `launchctl unload ~/Library/LaunchAgents/com.bachataschedule.scrape.plist`

Alternatywa: zwykły `crontab -e` z wpisem
`0 6 * * * cd /Users/dawid/Aplikacja && npm run scrape >> data/scrape.log 2>&1`.

## Legalność i etyka scrapingu

- Wszystkie trzy strony sprawdzone pod kątem `robots.txt` — żadna nie blokuje
  pobierania odwiedzanych przez nas ścieżek.
- Scrapery działają **sekwencyjnie** (jedna szkoła na raz), z normalnym
  User-Agentem identyfikującym bota, bez równoległego bombardowania serwerów.
- Częstotliwość: raz dziennie + ręczne odświeżenia — to ruch porównywalny z
  pojedynczym odwiedzającym stronę.
- Dla Salsa Libre celowo **nie** korzystamy z ich prywatnego API (wymaga klucza
  generowanego po stronie klienta) — zamiast tego renderujemy stronę tak, jak
  zrobiłaby to zwykła przeglądarka, i czytamy to, co widać na ekranie.

## Znane ograniczenia prototypu

- **Selektory są kruche.** Każdy scraper zależy od aktualnej struktury HTML danej
  strony. Zmiana layoutu szkoły = scraper przestaje działać (zwykle bez wywalenia
  całej apki — błąd jest logowany per-szkoła w tabeli `scrape_runs`).
- **Warsaw Salsa Club**: strona miesza domyślne (puste) sloty grafikowe ze
  specjalnymi wydarzeniami — scraper bierze pod uwagę tylko sloty z realnie
  przypisanym instruktorem i nazwą zawierającą "bachat". Może to pominąć jakieś
  nietypowo nazwane zajęcia.
- **Abra Studio**: brak godziny zakończenia zajęć w danych źródłowych (podane jest
  wyłącznie rozpoczęcie).
- **Salsa Libre**: scraper przegląda tylko bieżący i 2 kolejne tygodnie (limit w
  `WEEKS_AHEAD` w `lib/scrapers/salsaLibre.ts`) i wymaga zainstalowanej przeglądarki
  Chromium (`npx playwright install chromium` — już wykonane w tym repo).
- Odznaka "Nowość" ma sens dopiero **po pierwszym** przebiegu — przy zupełnie pustej
  bazie wszystko oznaczone jest jako nowe.

## Dodanie kolejnej szkoły

1. Stwórz `lib/scrapers/nazwaSzkoly.ts` zwracający `Promise<ScrapedClass[]>`
   (typ w `lib/types.ts`).
2. Dodaj wpis do tablicy `SCRAPERS` w `lib/scrapers/runAll.ts`.
3. Dodaj kolor szkoły w `SCHOOL_STYLES` w `lib/schedule.ts`.

## Stack

Next.js 16 (App Router) + TypeScript + Tailwind CSS + SQLite (`better-sqlite3`) +
Cheerio (statyczny HTML) + Playwright (strony renderowane w JS).
