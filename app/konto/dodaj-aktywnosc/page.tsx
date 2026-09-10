import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardBottomNav, DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ManualActivityForm } from "@/components/ManualActivityForm";

export const dynamic = "force-dynamic";

export default async function AddActivityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader name={user.name} avatarEmoji={user.avatarEmoji} avatarUrl={user.avatarUrl} />

      <div className="flex min-h-[calc(100vh-65px)]">
        <DashboardSidebar streak={0} active="log" />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
          <nav className="text-xs text-muted">
            <Link href="/podsumowanie" className="hover:text-accent">Podsumowanie</Link>
            <span className="mx-1.5" aria-hidden="true">/</span>
            <span className="text-zinc-300">Dodaj aktywność</span>
          </nav>

          <header>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-zinc-50">Dodaj aktywność do dziennika</h1>
            <p className="mt-1 text-sm text-muted">
              Zajęcia, praktyka, impreza albo warsztat — także spoza katalogu i z przeszłości. Wpis liczy się do Twoich
              statystyk i passy.
            </p>
          </header>

          <section className="rounded-2xl border border-line bg-zinc-900/45 p-5 sm:p-6">
            <ManualActivityForm />
          </section>
        </main>
      </div>
      <DashboardBottomNav active="log" />
    </div>
  );
}
