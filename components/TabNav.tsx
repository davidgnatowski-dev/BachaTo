import Link from "next/link";
import {
  GridIcon,
  CalendarIcon,
  PersonIcon,
  PeopleIcon,
  SchoolIcon,
} from "@/components/icons";

// One events hub now ("/eventy" with category tabs), so the old per-category
// tabs (Praktyka taneczna / Festiwale / Konkursy) and the Warsaw-only "Miasta"
// tab are gone — they live as filters inside the hub.
const TABS = [
  { href: "/", label: "Wszystkie", key: "wszystkie", icon: GridIcon },
  { href: "/eventy", label: "Wydarzenia", key: "eventy", icon: CalendarIcon },
  { href: "/grafik", label: "Zajęcia", key: "zajecia", icon: PersonIcon },
  { href: "/szkoly", label: "Szkoły", key: "szkoly", icon: SchoolIcon },
  { href: "/instruktorzy", label: "Społeczność", key: "spolecznosc", icon: PeopleIcon },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

export function TabNav({ active }: { active?: TabKey }) {
  return (
    <nav className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:gap-5 sm:px-0 sm:pb-0">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <Link key={tab.key} href={tab.href} className="group flex shrink-0 flex-col items-center gap-1.5">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                isActive
                  ? "border-accent text-accent"
                  : "border-line text-violet group-hover:border-violet/60 group-hover:text-violet"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className={`text-xs font-medium ${isActive ? "text-accent" : "text-zinc-400"}`}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
