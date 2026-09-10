/**
 * A short, warm, slightly cheeky recap sentence-or-three built from the
 * user's own confirmed stats. Pure/presentational — same on the server
 * (AccountStats) and client (LocalStatsSummary).
 */

const HOURS_TO_MASTERY = 10_000;

function pl(n: number) {
  return n.toLocaleString("pl-PL", { maximumFractionDigits: n < 10 ? 1 : 0 });
}

function lataPl(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (n === 1) return "rok";
  if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return "lata";
  return "lat";
}

function tygodniePl(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (n === 1) return "tydzień";
  if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return "tygodnie";
  return "tygodni";
}

function aktywnosciPl(n: number) {
  const d = n % 10;
  const dd = n % 100;
  if (n === 1) return "potwierdzoną aktywność";
  if (d >= 2 && d <= 4 && !(dd >= 12 && dd <= 14)) return "potwierdzone aktywności";
  return "potwierdzonych aktywności";
}

function tierLine(hours: number): string {
  if (hours < 3) return "Rozgrzewka. Nogi jeszcze się dziwią, ale głowa już łapie, o co chodzi.";
  if (hours < 12) return "Fundamenty się kładą — podstawowy krok masz w małym palcu, teraz kolej na biodra.";
  if (hours < 30) return "Widać robotę. Na socialu wchodzisz na parkiet bez głębokiego wdechu.";
  if (hours < 80) return "Solidny średniak. Ludzie zaczynają Cię prosić do tańca, a nie tylko z grzeczności.";
  if (hours < 200) return "Zaawansowanie w drodze. Twoje ochos budzą ciche „oooo” w kącie sali.";
  if (hours < 600) return "Prawie zawodowo. Instruktorzy podpatrują Twoje wariacje i udają, że nie.";
  if (hours < HOURS_TO_MASTERY) return "Ekstraklasa. Na parkiecie robią Ci miejsce, zanim jeszcze ruszysz.";
  return "Ty już nie ćwiczysz bachaty. Ty nią jesteś.";
}

export function SummaryNarrative({
  totalActivities,
  totalHours,
  favoriteInstructor,
  favoriteSchool,
  streak,
}: {
  totalActivities: number;
  totalHours: number;
  favoriteInstructor?: string;
  favoriteSchool?: string;
  streak: number;
}) {
  if (totalActivities === 0) {
    return (
      <section className="rounded-2xl border border-violet/25 bg-gradient-to-br from-violet/10 via-zinc-900/60 to-accent/5 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Twoja historia</p>
        <p className="mt-2 text-sm leading-7 text-zinc-200">
          Jeszcze pusto — potwierdź pierwsze zajęcia, a ułożymy z tego opowieść. I policzymy, ile godzin dzieli Cię od
          bachatowego mistrzostwa. Spoiler: trochę tego jest.
        </p>
      </section>
    );
  }

  const remaining = Math.max(0, HOURS_TO_MASTERY - totalHours);
  // ~3 taneczne wieczory tygodniowo, żeby liczba brzmiała absurdalnie, ale uczciwie.
  const yearsAtPace = Math.max(1, Math.round(remaining / 3 / 52));

  const instructorBit = favoriteInstructor
    ? `Twój ulubiony prowadzący to ${favoriteInstructor}${favoriteSchool ? ` (${favoriteSchool})` : ""} — ktoś tu ma swojego faworyta. `
    : favoriteSchool
      ? `Najwięcej czasu spędzasz w: ${favoriteSchool}. `
      : "";

  const streakBit = streak >= 2 ? ` Passa ${streak} ${tygodniePl(streak)} z rzędu — nie przerywaj, parkiet pamięta. ` : "";

  const masteryBit =
    remaining <= 0
      ? "Teoria mówi, że do mistrzostwa trzeba 10 000 godzin. Masz je z zapasem — teraz to Ty jesteś teorią."
      : `Sławna teoria 10 000 godzin do mistrzostwa mówi, że brakuje Ci jeszcze ${pl(remaining)} h — przy trzech wieczorach tygodniowo jakieś ${yearsAtPace} ${lataPl(yearsAtPace)}. Osoba, która to wyliczyła, chyba nigdy nie została na socialu do 3 w nocy. Na szczęście liczy się droga, nie licznik.`;

  return (
    <section className="rounded-2xl border border-violet/25 bg-gradient-to-br from-violet/10 via-zinc-900/60 to-accent/5 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Twoja historia</p>
      <p className="mt-2 text-sm leading-7 text-zinc-200">
        Masz na koncie <span className="font-semibold text-zinc-50">{totalActivities}</span>{" "}
        {aktywnosciPl(totalActivities)} —
        to <span className="font-semibold text-zinc-50">{pl(totalHours)} h</span> na parkiecie. {instructorBit}
        {tierLine(totalHours)}
        {streakBit}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted">{masteryBit}</p>
    </section>
  );
}
