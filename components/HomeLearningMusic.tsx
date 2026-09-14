import Link from "next/link";

const BENEFITS = [
  "Wszystkie szkoły w jednym grafiku",
  "Własny plan i przypomnienia",
  "Historia aktywności i postępy",
] as const;

export function HomeLearningMusic() {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-[linear-gradient(135deg,rgba(244,111,24,.10),rgba(139,92,246,.09),rgba(9,12,20,.95))] p-5 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Więcej niż kalendarz</p>
          <h2 className="mt-2 font-heading text-2xl font-bold leading-tight text-zinc-50 sm:text-3xl">Rozwijaj taniec także poza salą</h2>
          <p className="mt-3 text-sm leading-6 text-muted">BachaTo pomaga przejść od „chcę więcej tańczyć” do regularnej praktyki. Lekcje przypominają ruchy, a playlisty dają rytm do treningu w domu.</p>
          <ul className="mt-5 space-y-2 text-sm text-zinc-300">
            {BENEFITS.map((benefit) => <li key={benefit} className="flex items-center gap-2"><span className="text-emerald-400" aria-hidden="true">✓</span>{benefit}</li>)}
          </ul>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="group rounded-2xl border border-violet/25 bg-zinc-950/70 p-5 transition hover:-translate-y-0.5 hover:border-violet/50">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet/15 text-xl" aria-hidden="true">▶</span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-violet">Biblioteka lekcji</p>
            <h3 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Powtarzaj kroki we własnym tempie</h3>
            <p className="mt-2 text-sm leading-6 text-muted">17 krótkich materiałów: kroki podstawowe, obroty, fale, footwork i technika.</p>
            <Link href="/nauka" className="mt-5 inline-flex rounded-full border border-violet/40 px-4 py-2 text-sm font-semibold text-violet transition group-hover:bg-violet group-hover:text-white">Zobacz lekcje →</Link>
          </article>

          <article className="group rounded-2xl border border-accent/25 bg-zinc-950/70 p-5 transition hover:-translate-y-0.5 hover:border-accent/50">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-xl" aria-hidden="true">♫</span>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Playlisty Spotify</p>
            <h3 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Ćwicz od pierwszego taktu</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Cztery wybrane playlisty do nauki rytmu, treningu solo i tańca na socialu.</p>
            <Link href="/muzyka" className="mt-5 inline-flex rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition group-hover:bg-accent group-hover:text-white">Włącz muzykę →</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
