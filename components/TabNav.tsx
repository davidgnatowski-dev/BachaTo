import Link from "next/link";
import {
  GridIcon,
  CalendarIcon,
  PersonIcon,
  StarIcon,
  HeartIcon,
  TicketIcon,
  TrophyIcon,
  SchoolIcon,
  PinIcon,
} from "@/components/icons";

const TABS = [
  { href: "/", label: "Wszystkie", key: "wszystkie", icon: GridIcon },
  { href: "/eventy", label: "Eventy", key: "eventy", icon: CalendarIcon },
  { href: "/grafik", label: "Zajęcia", key: "zajecia", icon: PersonIcon },
  { href: "/grafik", label: "Warsztaty", key: "warsztaty", icon: StarIcon },
  { href: "/imprezy", label: "Sociale", key: "imprezy", icon: HeartIcon },
  { href: "/eventy", label: "Festiwale", key: "festiwale", icon: TicketIcon },
  { href: "/konkursy", label: "Konkursy", key: "konkursy", icon: TrophyIcon },
  { href: "/szkoly", label: "Szkoły", key: "szkoly", icon: SchoolIcon },
  { href: "/eventy", label: "Miasta", key: "miasta", icon: PinIcon },
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
