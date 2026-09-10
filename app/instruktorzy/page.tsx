import { getInstructors, getPublicCommunityMembers } from "@/lib/db";
import { InstructorsExplorer } from "@/components/InstructorsExplorer";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";
import { CommunityMembers } from "@/components/CommunityMembers";

export const dynamic = "force-dynamic";

export default function InstruktorzyPage() {
  const instructors = getInstructors();
  const members = getPublicCommunityMembers();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Społeczność bachaty</h1>
        <p className="mt-1 text-sm text-muted">
          Tancerze, instruktorzy i aktualne grafiki w jednym miejscu.
        </p>
      </header>

      <TabNav active="spolecznosc" />

      <CommunityMembers members={members} />

      <section className="mt-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Prowadzący</p><h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Instruktorzy i ich grafiki</h2></section>

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
