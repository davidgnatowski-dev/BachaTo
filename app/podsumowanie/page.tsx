"use client";

import { Header } from "@/components/Header";
import { useFavorites } from "@/lib/favorites";

export default function PodsumowaniePage() {
  const { likedClassIds, likedEventIds, plannedClassIds, plannedEventIds } = useFavorites();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Header />

      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Twoje podsumowanie</h1>
        <p className="mt-1 text-sm text-muted">
          Pełne podsumowanie (godziny tańca, ulubiony instruktor, styl, aktywność tygodniowa/miesięczna/roczna) pojawi
          się tutaj, gdy aplikacja zacznie śledzić, na jakich zajęciach faktycznie byłeś — na razie pokazujemy to, co
          realnie wiemy: Twój plan i ulubione.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Zajęcia w planie", value: plannedClassIds.size },
          { label: "Wydarzenia w planie", value: plannedEventIds.size },
          { label: "Polubione zajęcia", value: likedClassIds.size },
          { label: "Polubione wydarzenia", value: likedEventIds.size },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-zinc-900/60 p-4 text-center">
            <p className="font-heading text-2xl font-bold text-accent">{stat.value}</p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
        BachaTo Wrapped — Twoje roczne podsumowanie do udostępnienia na Instagram Stories — jest w planach. Wróć tu,
        gdy będzie gotowe.
      </p>
    </div>
  );
}
