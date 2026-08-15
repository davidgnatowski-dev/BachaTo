import { getInstructors } from "@/lib/db";
import { InstructorsExplorer } from "@/components/InstructorsExplorer";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function InstruktorzyPage() {
  const instructors = getInstructors();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Instruktorzy bachaty</h1>
        <p className="mt-1 text-sm text-muted">
          Wszyscy instruktorzy prowadzący aktualne zajęcia bachaty w warszawskich szkołach.
        </p>
      </header>

      <TabNav />

      {instructors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak danych do wyświetlenia. Uruchom scraping, żeby zobaczyć instruktorów.
        </p>
      ) : (
        <InstructorsExplorer instructors={instructors} />
      )}
    </div>
  );
}
