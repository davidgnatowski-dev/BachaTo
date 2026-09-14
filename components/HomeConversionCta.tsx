import Link from "next/link";

export function HomeConversionCta() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent/30 bg-zinc-900 px-5 py-8 text-center sm:px-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(244,111,24,.22),transparent_55%)]" />
      <div className="relative mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Zacznij dziś</p>
        <h2 className="mt-2 font-heading text-2xl font-bold text-zinc-50 sm:text-3xl">Mniej szukania. Więcej tańca.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">Załóż konto, wybierz swój poziom i dni, a BachaTo pomoże Ci ułożyć plan, wracać do lekcji i śledzić regularność.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/rejestracja" className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(244,111,24,.22)] hover:bg-accent-dark">Załóż darmowe konto</Link>
          <Link href="/logowanie" className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-zinc-500 hover:text-white">Mam już konto</Link>
        </div>
        <p className="mt-4 text-xs text-zinc-500">Masz już konto? Zaloguj się i wróć do swojego planu.</p>
      </div>
    </section>
  );
}
