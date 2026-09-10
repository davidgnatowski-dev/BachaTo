import { Header } from "@/components/Header";
import { EventSubmissionForm } from "@/components/EventSubmissionForm";

export const dynamic = "force-dynamic";

export default async function OrganizerPage({ searchParams }: { searchParams: Promise<{ kind?: string; title?: string; event?: string }> }) {
  const query = await searchParams;
  const kind = query.kind === "claim" || query.kind === "correction" ? query.kind : "new";
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />
      <header className="rounded-3xl border border-violet/25 bg-gradient-to-br from-violet/15 via-zinc-900/70 to-accent/10 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet">Dla organizatorów</p>
        <h1 className="mt-2 max-w-2xl font-heading text-3xl font-semibold text-zinc-50">Dodaj wydarzenie albo uzupełnij jego profil</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">Program, prowadzący i poprawne miejsce pomagają tancerzom zaplanować wyjazd. Każdą zmianę sprawdzamy przed publikacją.</p>
      </header>
      <section className="rounded-2xl border border-line bg-zinc-900/50 p-5 sm:p-6">
        <EventSubmissionForm initialKind={kind} initialTitle={query.title ?? ""} eventKey={query.event ?? ""} />
      </section>
    </div>
  );
}
