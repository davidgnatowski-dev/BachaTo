import { getCurrentSchedule } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ScheduleExplorer } from "@/components/ScheduleExplorer";
import { DataFreshnessBanner } from "@/components/DataFreshnessBanner";
import { Header } from "@/components/Header";
import { SCHOOL_NAMES } from "@/lib/schools";

export const dynamic = "force-dynamic";

export default async function GrafikPage({ searchParams }: { searchParams: Promise<{ powitanie?: string; mine?: string }> }) {
  const schedule = getCurrentSchedule();
  const user = await getCurrentUser();
  const { powitanie, mine } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Grafik bachaty — Warszawa</h1>
          <p className="mt-1 text-sm text-muted">Wybierz zajęcia i dodaj je bezpośrednio do swojego kalendarza.</p>
        </div>
      </header>

      {powitanie === "1" && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200" role="status">
          <p className="font-semibold">Preferencje zapisane 🎉</p>
          <p className="mt-1 text-emerald-200/90">
            {mine === "1"
              ? "Poniżej zajęcia dopasowane do poziomu, formatu i dni, które wybrałeś/aś. Dodaj je do planu — resztę filtrów możesz zmienić w każdej chwili."
              : "Przeglądaj cały grafik i dodawaj zajęcia do swojego planu. Preferencje możesz ustawić w profilu."}
          </p>
        </div>
      )}

      <DataFreshnessBanner sources={[...SCHOOL_NAMES]} />

      {schedule.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak danych do wyświetlenia. Uruchom scraping, żeby zobaczyć grafik.
        </p>
      ) : (
        <ScheduleExplorer rows={schedule} preferences={user?.preferences} />
      )}
    </div>
  );
}
