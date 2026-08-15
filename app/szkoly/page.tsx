import { getSchoolProfiles } from "@/lib/db";
import { SchoolCard } from "@/components/SchoolCard";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";

export const dynamic = "force-dynamic";

export default function SzkolyPage() {
  const schools = getSchoolProfiles();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Szkoły tańca</h1>
        <p className="mt-1 text-sm text-muted">Warszawskie szkoły, których grafik zajęć bachaty znajdziesz w aplikacji.</p>
      </header>

      <TabNav active="szkoly" />

      {schools.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
          Brak danych do wyświetlenia. Uruchom scraping, żeby zobaczyć szkoły.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((s) => (
            <SchoolCard key={s.name} school={s} />
          ))}
        </div>
      )}
    </div>
  );
}
