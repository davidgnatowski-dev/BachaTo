import Link from "next/link";
import {
  CalendarIcon,
  GridIcon,
  HeartIcon,
  PeopleIcon,
  PersonIcon,
  PlusIcon,
  SchoolIcon,
  TicketIcon,
  TrophyIcon,
} from "@/components/icons";

const items = [
  { key: "start", label: "Start", href: "/", icon: GridIcon },
  { key: "plan", label: "Mój plan", href: "/#moj-plan", icon: CalendarIcon },
  { key: "calendar", label: "Kalendarz planu", href: "/#kalendarz", icon: CalendarIcon },
  { key: "add", label: "Znajdź zajęcia", href: "/grafik", icon: PlusIcon },
  { key: "log", label: "Dodaj aktywność", href: "/konto/dodaj-aktywnosc", icon: PlusIcon },
  { key: "events", label: "Wydarzenia", href: "/eventy", icon: TicketIcon },
  { key: "schools", label: "Szkoły", href: "/szkoly", icon: SchoolIcon },
  { key: "instructors", label: "Instruktorzy", href: "/instruktorzy", icon: PeopleIcon },
  { key: "stats", label: "Statystyki", href: "/podsumowanie", icon: TrophyIcon },
  { key: "favorites", label: "Ulubione", href: "/#ulubione", icon: HeartIcon },
  { key: "learning", label: "Nauka", href: "/nauka", icon: PeopleIcon },
  { key: "music", label: "Muzyka", href: "/muzyka", icon: GridIcon },
  { key: "account", label: "Profil i ustawienia", href: "/konto", icon: PersonIcon },
] as const;

export type DashboardSection = (typeof items)[number]["key"];

export function DashboardSidebar({ streak, active = "start" }: { streak?: number; active?: DashboardSection }) {
  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-65px)] w-56 shrink-0 flex-col border-r border-line/80 bg-[#0d1019] px-3 py-5 lg:flex">
      <nav className="flex flex-col gap-1" aria-label="Nawigacja dashboardu">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                item.key === active ? "bg-accent/12 text-accent" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-line bg-zinc-950/60 p-3.5">
        <p className="text-lg" aria-hidden="true">🔥</p>
        <p className="mt-1 text-sm font-semibold text-zinc-100">
          {streak === undefined ? "Twój taneczny panel" : streak > 0 ? `${streak} ${streak === 1 ? "tydzień" : "tygodni"} z rzędu!` : "Zacznij swoją passę"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {streak === undefined ? "Plan, ulubione i statystyki masz zawsze pod ręką." : streak > 0 ? "Świetna robota. Nie przerywaj passy!" : "Potwierdź pierwsze zajęcia i obserwuj postępy."}
        </p>
        <Link href="/podsumowanie" className="mt-3 inline-flex text-xs font-semibold text-accent hover:text-accent-peach">
          Zobacz statystyki →
        </Link>
      </div>
    </aside>
  );
}

export function DashboardBottomNav({ active = "start" }: { active?: DashboardSection }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line bg-zinc-950/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Nawigacja mobilna">
      {[
        { key: "start", label: "Start", href: "/", icon: GridIcon },
        { key: "plan", label: "Plan", href: "/#moj-plan", icon: CalendarIcon },
        { key: "log", label: "Dodaj", href: "/konto/dodaj-aktywnosc", icon: PlusIcon },
        { key: "stats", label: "Statystyki", href: "/podsumowanie", icon: TrophyIcon },
        { key: "account", label: "Profil", href: "/konto", icon: PersonIcon },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${item.key === active ? "text-accent" : "text-zinc-500"}`}>
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
