"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardBottomNav, DashboardSidebar, type DashboardSection } from "@/components/dashboard/DashboardSidebar";
import { DashboardShellProvider } from "@/components/dashboard/DashboardShellContext";
import { SESSION_UPDATED_EVENT } from "@/lib/sessionEvents";

interface ShellUser {
  name: string;
  avatarEmoji: string | null;
  avatarUrl: string | null;
}

const EXCLUDED = ["/logowanie", "/rejestracja", "/resetuj-haslo"];

function activeSection(pathname: string): DashboardSection {
  if (pathname.startsWith("/grafik")) return "add";
  if (pathname.startsWith("/eventy") || pathname.startsWith("/festiwale") || pathname.startsWith("/imprezy") || pathname.startsWith("/konkursy")) return "events";
  if (pathname.startsWith("/szkoly")) return "schools";
  if (pathname.startsWith("/instruktorzy")) return "instructors";
  if (pathname.startsWith("/nauka")) return "learning";
  if (pathname.startsWith("/muzyka")) return "music";
  if (pathname.startsWith("/podsumowanie")) return "stats";
  if (pathname.startsWith("/konto")) return "account";
  return "start";
}

export function AuthenticatedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<ShellUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => fetch("/api/session")
      .then((response) => response.json())
      .then((session: ShellUser | null) => { if (!cancelled) setUser(session); })
      .catch(() => { if (!cancelled) setUser(null); });
    refresh();
    window.addEventListener(SESSION_UPDATED_EVENT, refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_UPDATED_EVENT, refresh);
    };
  }, [pathname]);

  const ownsShell = pathname === "/" || pathname.startsWith("/konto");
  const excluded = EXCLUDED.some((path) => pathname.startsWith(path));
  if (!user || ownsShell || excluded) return children;

  const active = activeSection(pathname);
  return (
    <DashboardShellProvider value>
      <div className="min-h-screen bg-background">
        <DashboardHeader name={user.name} avatarEmoji={user.avatarEmoji} avatarUrl={user.avatarUrl} />
        <div className="flex min-h-[calc(100vh-65px)]">
          <DashboardSidebar active={active} />
          <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
        </div>
        <DashboardBottomNav active={active} />
      </div>
    </DashboardShellProvider>
  );
}
