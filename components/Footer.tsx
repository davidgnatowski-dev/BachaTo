import Image from "next/image";
import Link from "next/link";
import { pluralizeClasses } from "@/lib/schedule";
import { pluralizeEvents } from "@/lib/events";

function pluralizeSchools(n: number): string {
  if (n === 1) return "szkoła";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "szkoły";
  return "szkół";
}

function pluralizeCities(n: number): string {
  if (n === 1) return "miasto";
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return "miasta";
  return "miast";
}

export function Footer({
  stats,
}: {
  stats: { classCount: number; schoolCount: number; eventCount: number; cityCount: number };
}) {
  const items = [
    { value: stats.classCount, label: pluralizeClasses(stats.classCount) },
    { value: stats.schoolCount, label: pluralizeSchools(stats.schoolCount) },
    { value: stats.eventCount, label: pluralizeEvents(stats.eventCount) },
    ...(stats.cityCount > 0 ? [{ value: stats.cityCount, label: pluralizeCities(stats.cityCount) }] : []),
  ];

  return (
    <footer className="relative mt-auto bg-zinc-900/60 px-4 py-4 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent to-violet" />
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <Image src="/brand/logo-v4.png" alt="BachaTo" width={1254} height={1254} className="h-12 w-auto" />
          <div>
            <p className="text-xs text-muted">Bachata w Warszawie i całej Polsce w jednym miejscu.</p>
            <Link href="/grafik" className="text-xs font-semibold text-accent hover:text-accent-peach">
              Znajdź zajęcia →
            </Link>
          </div>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-zinc-300" aria-label="Odkrywaj taniec">
          <Link href="/grafik" className="hover:text-accent">Grafik Warszawa</Link>
          <Link href="/eventy" className="hover:text-accent">Wydarzenia</Link>
          <Link href="/eventy?view=map" className="hover:text-accent">Mapa eventów</Link>
          <Link href="/dla-organizatorow" className="hover:text-accent">Dodaj wydarzenie</Link>
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="font-heading text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[11px] text-muted/70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
