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
    schoolCount ? `${schoolCount} ${schoolCount === 1 ? "szkoła" : "szkoły"}` : null,
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

      <div className="relative flex flex-col gap-2 sm:max-w-lg">
        <h1 className="font-heading text-xl font-bold leading-tight text-zinc-50 sm:text-2xl">
          Znajdź <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">bachatę</span> w
          jednym miejscu
        </h1>
        <p className="text-sm text-zinc-300">Zajęcia, warsztaty, imprezy i szkoły – wszystko w jednym miejscu.</p>
        {stats.length > 0 && (
          <p className="text-xs font-medium text-accent-peach">{stats.join(" · ")}</p>
        )}
        <a
          href="/grafik"
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
        >
          Zobacz zajęcia →
        </a>
      </div>
    </section>
  );
}
