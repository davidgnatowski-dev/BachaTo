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
    <footer className="mt-auto bg-gradient-to-r from-accent to-violet px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <Image src="/brand/logo-v4.png" alt="BachaTo" width={1254} height={1254} className="h-12 w-auto" />
          <div>
            <p className="text-xs text-white/80">Bachata w Warszawie i całej Polsce w jednym miejscu.</p>
            <Link href="/cenniki" className="text-xs font-semibold text-white underline underline-offset-2 hover:text-white/80">
              Cenniki szkół →
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <p className="font-heading text-lg font-bold text-white">{item.value}</p>
              <p className="text-[11px] text-white/80">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
