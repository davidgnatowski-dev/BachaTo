"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STEPS = [
  { number: "1", title: "Znajdź zajęcia", titleLead: "Znajdź", titleAccent: "zajęcia", benefit: "Widzisz pełny grafik szkół w jednym miejscu i szybko wybierasz zajęcia blisko siebie.", href: "/grafik", image: "/home/feature-classes-clean.png", alt: "Podgląd wyszukiwania zajęć bachaty w Warszawie" },
  { number: "2", title: "Dodaj do planu", titleLead: "Dodaj do", titleAccent: "planu", benefit: "Układasz własny tydzień tańca i od razu widzisz, które zajęcia pasują do Twojego rytmu.", href: "/rejestracja", image: "/home/feature-plan-clean.png", alt: "Tygodniowy plan zajęć tanecznych" },
  { number: "3", title: "Szukaj wydarzeń", titleLead: "Szukaj", titleAccent: "wydarzeń", benefit: "Odkrywasz sociale, festiwale, wyjazdy i konkursy bez przeszukiwania wielu stron.", href: "/eventy", image: "/home/feature-events-clean.png", alt: "Podgląd najbliższych wydarzeń bachaty" },
  { number: "4", title: "Ucz się online", titleLead: "Ucz się", titleAccent: "online", benefit: "Wracasz do krótkich lekcji wtedy, kiedy chcesz przećwiczyć krok albo nową kombinację.", href: "/nauka", image: "/home/feature-learning-clean.png", alt: "Internetowy kurs bachaty" },
  { number: "5", title: "Twoje statystyki", titleLead: "Twoje", titleAccent: "statystyki", benefit: "Mierzysz regularność, czas na parkiecie i postępy, które naprawdę motywują do dalszego tańca.", href: "/podsumowanie", image: "/home/feature-statistics-clean.png", alt: "Panel statystyk z czasem na parkiecie, aktywnością, regularnością i odznaką Mistrz parkietu" },
] as const;

function StepPreview({ image, alt }: { image: string | null; alt: string }) {
  if (!image) return null;
  return (
    <Image src={image} alt={alt} fill sizes="(max-width: 1024px) 88vw, 270px" className="object-contain object-center transition duration-700 group-hover:scale-[1.01]" />
  );
}

export function HomeJourney() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % STEPS.length), 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="flex flex-col gap-5 pb-8 sm:gap-7">
      <section className="relative isolate min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-line bg-[#080b12] sm:min-h-[28rem] lg:min-h-[29rem]">
        <Image
          src="/home/hero-background.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="(max-width: 768px) 100vw, 1152px"
          className="object-cover object-[center_72%] opacity-95 lg:object-[center_68%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,.12)_0%,rgba(8,11,18,.54)_72%,rgba(8,11,18,.88)_100%)] lg:bg-[linear-gradient(90deg,rgba(8,11,18,.94)_0%,rgba(8,11,18,.64)_48%,rgba(8,11,18,.12)_100%)]" />

        <div className="relative flex min-h-[25rem] flex-col justify-center px-5 py-7 sm:min-h-[28rem] sm:px-8 sm:py-10 lg:min-h-[29rem] lg:max-w-2xl lg:px-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent-peach">Bachata w jednym miejscu</p>
          <h1 className="max-w-xl font-heading text-4xl font-bold leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Twój taniec.<br /><span className="text-accent">Twój plan.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-200 sm:text-base">Znajdź zajęcia i wydarzenia, zapisz własny plan, ucz się z krótkich lekcji i ćwicz do gotowych playlist bachaty.</p>
          <div className="mt-4 flex max-w-xl flex-wrap gap-2" aria-label="Funkcje BachaTo">
            {['Grafik zajęć', 'Wydarzenia', 'Mój plan', 'Statystyki', 'Nauka online', 'Playlisty'].map((feature) => <span key={feature} className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-semibold text-zinc-200 backdrop-blur-sm sm:text-xs">{feature}</span>)}
          </div>
          <div className="mt-6 flex flex-col gap-3 min-[390px]:flex-row">
            <Link href="/grafik" className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,106,24,.28)] transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
              Odkryj zajęcia <span aria-hidden="true" className="ml-2">→</span>
            </Link>
            <a href="#jak-to-dziala" className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-500/70 bg-black/25 px-6 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <span aria-hidden="true" className="mr-2 flex h-7 w-7 items-center justify-center rounded-full border border-accent text-[10px] text-accent">▶</span>
              Zobacz, jak to działa
            </a>
          </div>
        </div>
      </section>

      <section id="jak-to-dziala" aria-labelledby="journey-title" className="scroll-mt-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">W pięciu krokach</p>
          <h2 id="journey-title" className="mt-1 font-heading text-2xl font-bold text-white sm:text-3xl">Wszystko, czego potrzebujesz</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Od znalezienia pierwszych zajęć po analizę postępów — każda funkcja pomaga Ci częściej i wygodniej tańczyć.</p>
        </div>

        <div className="relative">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-5 lg:gap-4">
            {STEPS.map((step, index) => (
              <article key={step.number} className={`relative transition duration-500 ${index === STEPS.length - 1 ? "md:col-span-2 md:mx-auto md:w-[calc(50%-0.75rem)] lg:col-span-1 lg:mx-0 lg:w-auto" : ""} ${active === index ? "lg:-translate-y-2" : ""}`} onMouseEnter={() => setActive(index)}>
                <Link href={step.href} className={`group flex h-full flex-col overflow-hidden rounded-3xl border bg-[#0a0f19] p-2 transition duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${active === index ? "lg:border-accent lg:shadow-[0_0_30px_rgba(255,106,24,.15)]" : "border-line hover:border-accent/70"}`}>
                  <div className="hidden h-16 items-center gap-2 border-b border-white/10 bg-[#080d16] px-3 lg:flex">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent text-[9px] font-bold text-white">{step.number}</span>
                    <h3 className="whitespace-nowrap font-heading text-[13px] font-bold tracking-tight text-white">
                      {step.titleLead} <span className="text-accent">{step.titleAccent}</span>
                    </h3>
                  </div>
                  <div className="relative order-2 aspect-[3/4] overflow-hidden rounded-[1.15rem] bg-[#080d16] lg:order-none">
                    <StepPreview image={step.image} alt={step.alt} />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/18 to-transparent transition group-hover:opacity-60" />
                  </div>
                  <div className="order-1 flex flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:order-none">
                    <div className="min-w-0 w-full">
                      <div className="flex items-center gap-3 lg:hidden">
                        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-accent text-sm font-bold text-white shadow-[0_0_16px_rgba(255,106,24,.22)]">{step.number}</span>
                        <h3 className="font-heading text-lg font-semibold text-white">{step.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted lg:mt-0">{step.benefit}</p>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-accent/25 bg-[linear-gradient(135deg,rgba(255,106,24,.13),rgba(156,77,255,.08))] px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
        <div>
          <p className="font-heading text-xl font-bold text-white sm:text-2xl">Zaplanuj swój pierwszy taniec</p>
          <p className="mt-1 text-sm text-muted">Zajęcia, wydarzenia i nauka — zawsze pod ręką.</p>
        </div>
        <Link href="/rejestracja" className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-7 text-sm font-semibold text-white transition hover:bg-accent-dark sm:w-auto">Zacznij teraz →</Link>
      </section>
    </main>
  );
}
