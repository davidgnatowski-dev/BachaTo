import { SCHOOL_PRICING } from "@/lib/schools";
import { PricingCard } from "@/components/PricingCard";
import { TabNav } from "@/components/TabNav";
import { Header } from "@/components/Header";

export default function CennikiPage() {
  const schools = Object.keys(SCHOOL_PRICING) as (keyof typeof SCHOOL_PRICING)[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Cenniki</h1>
        <p className="mt-1 text-sm text-muted">
          Orientacyjne ceny startowe. Pełne cenniki (karty sportowe, pakiety, zniżki) sprawdzisz na stronie każdej szkoły.
        </p>
      </header>

      <TabNav />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((s) => (
          <PricingCard key={s} school={s} />
        ))}
      </div>
    </div>
  );
}
