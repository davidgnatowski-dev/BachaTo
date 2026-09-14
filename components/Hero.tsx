import Link from "next/link";
import { pluralizeSchools } from "@/lib/events";

export function Hero({
  classCount,
  schoolCount,
  eventCount,
}: {
  classCount?: number;
  schoolCount?: number;
  eventCount?: number;
}) {
  const stats = [
    classCount ? `${classCount} zajęć w grafiku` : null,
    schoolCount ? `${schoolCount} ${pluralizeSchools(schoolCount)}` : null,
    eventCount ? `${eventCount} nadchodzących wydarzeń` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-line bg-[radial-gradient(120%_140%_at_15%_15%,#3a1040_0%,#170b28_45%,#0B0E16_100%)] px-5 py-4 sm:px-8 sm:py-5">
      <svg
        viewBox="0 0 1200 300"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx={(i * 151) % 1200} cy={20 + ((i * 83) % 260)} r="1.6" fill="#ffffff" fillOpacity="0.15" />
        ))}
      </svg>

      <div className="relative flex flex-col gap-3 sm:max-w-2xl">
        <span className="w-fit rounded-full border border-violet/30 bg-violet/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">Twój taneczny tydzień w jednym miejscu</span>
        <h1 className="font-heading text-2xl font-bold leading-tight text-zinc-50 sm:text-4xl">
          Tańcz częściej. <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">Planuj łatwiej.</span>
        </h1>
        <p className="max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">Znajdź zajęcia i wydarzenia, zapisz własny plan, ucz się z krótkich lekcji i ćwicz do gotowych playlist bachaty.</p>
        {stats.length > 0 && (
          <p className="text-xs font-medium text-accent-peach">{stats.join(" · ")}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-2.5">
          <Link href="/rejestracja" className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark">Załóż darmowe konto →</Link>
          <Link href="/grafik" className="inline-flex items-center rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:border-violet hover:text-white">Najpierw zobacz grafik</Link>
        </div>
        <p className="text-[11px] text-zinc-400">Bez opłat · plan dostępny na telefonie i komputerze</p>
      </div>
    </section>
  );
}
