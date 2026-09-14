"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SearchIcon, CalendarIcon, ChevronDownIcon, PersonIcon, MenuIcon } from "@/components/icons";
import { SESSION_UPDATED_EVENT } from "@/lib/sessionEvents";
import { useDashboardShell } from "@/components/dashboard/DashboardShellContext";
import { NotificationBell } from "@/components/NotificationBell";

const NAV_LINKS = [
  { href: "/eventy", label: "Wydarzenia" },
  { href: "/grafik", label: "Grafik zajęć" },
  { href: "/szkoly", label: "Szkoły" },
  { href: "/instruktorzy", label: "Społeczność" },
  { href: "/nauka", label: "Nauka" },
  { href: "/muzyka", label: "Muzyka" },
] as const;

interface SessionUser {
  name: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
}

export function Header() {
  const insideDashboardShell = useDashboardShell();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionUser | null | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close the mobile menu on navigation — adjusting state during render
  // (rather than in an effect) avoids an extra render pass. See
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    let cancelled = false;
    function refresh() {
      fetch("/api/session")
        .then((res) => res.json())
        .then((data: SessionUser | null) => {
          if (!cancelled) setSession(data);
        })
        .catch(() => {
          if (!cancelled) setSession(null);
        });
    }
    refresh();
    window.addEventListener(SESSION_UPDATED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_UPDATED_EVENT, refresh);
    };
  }, [pathname]);

  if (insideDashboardShell) return null;

  return (
    <header className="relative flex items-center justify-between gap-4 py-1">
      <Link href="/" className="shrink-0">
        <Image src="/brand/logo-v4.png" alt="BachaTo" width={1254} height={1254} priority className="h-16 w-auto" />
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
        {session && (
          <Link
            href="/#moj-plan"
            className="hidden items-center gap-2 rounded-full border border-accent/45 bg-accent/[0.07] px-3.5 py-2 text-xs font-semibold text-accent hover:border-accent hover:bg-accent/10 md:inline-flex"
          >
            <CalendarIcon className="h-4 w-4" />
            Mój panel
          </Link>
        )}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={mobileOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-zinc-300 hover:text-zinc-50 lg:hidden"
        >
          {mobileOpen ? <span className="text-sm leading-none">✕</span> : <MenuIcon className="h-4 w-4" />}
        </button>
        <Link
          href="/szukaj"
          aria-label="Szukaj"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-zinc-300 hover:text-zinc-50"
        >
          <SearchIcon className="h-4 w-4" />
        </Link>
        <NotificationBell enabled={Boolean(session)} />
        {session ? (
          <details className="group relative">
            <summary
              aria-label="Otwórz menu użytkownika"
              title={session.name}
              className="flex cursor-pointer list-none items-center gap-1 rounded-full border border-line p-1 pr-1.5 text-zinc-100 hover:border-accent [&::-webkit-details-marker]:hidden"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet/15">
                {session.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- imported public social profile image
                  <img src={session.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : session.avatarEmoji ? <span className="text-base leading-none">{session.avatarEmoji}</span> : <PersonIcon className="h-4 w-4" />}
              </span>
              <ChevronDownIcon className="h-3.5 w-3.5 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-zinc-950 p-2 shadow-2xl">
              <p className="truncate px-3 py-2 text-xs font-semibold text-zinc-100">{session.name}</p>
              <div className="mb-1 border-t border-line" />
              <UserMenuLinks />
            </div>
          </details>
        ) : (
          <Link
            href="/logowanie"
            aria-label="Zaloguj się"
            title="Zaloguj się"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-zinc-100"
          >
            <PersonIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      {mobileOpen && (
        <nav className="absolute left-0 right-0 top-full z-40 mt-2 flex flex-col gap-1 rounded-xl border border-line bg-zinc-950 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] lg:hidden">
          {session && (
            <Link href="/#moj-plan" className="mb-1 flex items-center gap-2 rounded-lg bg-accent/15 px-3 py-2.5 text-sm font-semibold text-accent">
              <CalendarIcon className="h-4 w-4" />
              Mój panel i plan
            </Link>
          )}
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.label}
                href={l.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-accent/15 text-accent" : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

function UserMenuLinks() {
  return (
    <>
      <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-zinc-900">Mój panel</Link>
      <Link href="/#moj-plan" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Mój plan</Link>
      <Link href="/grafik" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Znajdź zajęcia</Link>
      <Link href="/#ulubione" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Ulubione</Link>
      <Link href="/podsumowanie" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Statystyki</Link>
      <div className="my-1 border-t border-line" />
      <Link href="/konto" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Profil i ustawienia</Link>
    </>
  );
}
