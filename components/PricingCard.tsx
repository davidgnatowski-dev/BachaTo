import type { School } from "@/lib/types";
import { SCHOOL_PRICING } from "@/lib/schools";

function formatCheckedOn(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export function PricingCard({ school }: { school: School }) {
  const pricing = SCHOOL_PRICING[school];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-zinc-900 p-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <h2 className="font-heading text-lg font-semibold text-zinc-50">{school}</h2>

      <p>
        <span className="font-heading text-2xl font-bold text-accent">od {pricing.fromPrice}</span>
      </p>
      <p className="text-sm text-zinc-300">{pricing.note}</p>

      <p className="text-xs text-muted">Sprawdzone {formatCheckedOn(pricing.checkedOn)} — ceny i oferty mogą się zmieniać.</p>

      <a
        href={pricing.pricingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block w-fit rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-100 hover:border-zinc-500"
      >
        Pełny cennik na stronie szkoły ↗
      </a>
    </div>
  );
}
