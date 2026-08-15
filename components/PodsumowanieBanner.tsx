import Link from "next/link";

export function PodsumowanieBanner() {
  return (
    <Link
      href="/podsumowanie"
      className="flex flex-col items-start gap-3 rounded-xl border border-line bg-gradient-to-r from-accent/20 via-pink/10 to-violet/20 p-5 transition-colors hover:border-violet/50 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 className="font-heading text-lg font-semibold text-zinc-50">Zobacz swoje podsumowanie</h2>
        <p className="mt-1 text-sm text-muted">Tydzień, miesiąc, rok — Twoja aktywność w bachacie.</p>
      </div>
      <span className="shrink-0 rounded-full bg-gradient-to-r from-accent to-violet px-5 py-2.5 text-sm font-semibold text-white">
        Zobacz podsumowanie →
      </span>
    </Link>
  );
}
