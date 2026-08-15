"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SearchIcon, BellIcon, PersonIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/eventy", label: "Wydarzenia" },
  { href: "/grafik", label: "Grafik zajęć" },
  { href: "/eventy", label: "Festiwale" },
  { href: "/konkursy", label: "Konkursy" },
  { href: "/instruktorzy", label: "Społeczność" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-4 py-1">
      <Link href="/" className="shrink-0">
        <Image src="/brand/logo-v4.png" alt="BachaTo" width={1254} height={1254} priority className="h-14 w-auto" />
      </Link>

      <nav className="hidden items-center gap-6 lg:flex">
        {NAV_LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.label}
              href={l.href}
              className={`text-sm font-medium transition-colors ${active ? "text-accent" : "text-zinc-300 hover:text-zinc-50"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/#szukaj"
          aria-label="Szukaj"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-zinc-300 hover:text-zinc-50"
        >
          <SearchIcon className="h-4 w-4" />
        </Link>
        <span
          title="Powiadomienia będą dostępne, gdy w aplikacji pojawią się konta"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
        >
          <BellIcon className="h-4 w-4" />
        </span>
        <span
          title="Konta użytkowników jeszcze nie ma — to miejsce jest na razie tylko wizualne"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
        >
          <PersonIcon className="h-4 w-4" />
        </span>
      </div>
    </header>
  );
}
