export function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-xl border border-line bg-[radial-gradient(120%_140%_at_15%_15%,#3a1040_0%,#170b28_45%,#0B0E16_100%)] px-5 py-6 sm:px-8">
      <svg
        viewBox="0 0 1200 300"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <circle key={i} cx={(i * 151) % 1200} cy={20 + ((i * 83) % 260)} r="1.6" fill="#ffffff" fillOpacity="0.15" />
        ))}
      </svg>

      <div className="relative flex flex-col gap-3 sm:max-w-lg">
        <h1 className="font-heading text-2xl font-bold leading-tight text-zinc-50 sm:text-3xl">
          Odkrywaj <span className="bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">bachatę</span>{" "}
          w jednym miejscu
        </h1>
        <p className="text-sm text-zinc-300">Grafik zajęć w Warszawie, warsztaty i wydarzenia bachatowe z całej Polski.</p>
        <a
          href="#szukaj"
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-accent to-violet px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Sprawdź, co się dzieje →
        </a>
      </div>
    </section>
  );
}
