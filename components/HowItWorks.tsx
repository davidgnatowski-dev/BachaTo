import { SearchIcon, CalendarIcon, CheckIcon } from "@/components/icons";

const STEPS = [
  { title: "Znajdź zajęcia", desc: "Wyszukuj zajęcia, szkoły i wydarzenia w swojej okolicy.", icon: SearchIcon },
  { title: "Dodaj do planu", desc: "Buduj własny tygodniowy plan z zajęć z różnych szkół.", icon: CalendarIcon },
  {
    title: "Oznacz obecność",
    desc: "Po zajęciach zaznacz, że byłeś i automatycznie buduj swoje statystyki.",
    icon: CheckIcon,
  },
] as const;

export function HowItWorks() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Jak działa <span className="text-accent">BachaTo</span>?
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-violet">
              <step.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {i + 1}. {step.title}
              </p>
              <p className="mt-0.5 text-xs text-muted">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
