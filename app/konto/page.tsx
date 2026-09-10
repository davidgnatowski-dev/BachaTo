import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getUserFavorites, getUserNotificationPreferences, getUserPreferences } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";
import { PreferencesForm } from "@/components/PreferencesForm";
import { NotificationSettingsForm } from "@/components/NotificationSettingsForm";
import { PasswordForm } from "@/components/PasswordForm";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardBottomNav, DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CalendarIcon, ChevronDownIcon, HeartIcon, PersonIcon, PlusIcon, TrophyIcon } from "@/components/icons";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");

  const favorites = getUserFavorites(user.id);
  const surveyPreferences = getUserPreferences(user.id);
  const notificationPreferences = getUserNotificationPreferences(user.id);
  const editablePreferences = {
    ...user.preferences,
    levels: user.preferences.levels.length > 0 ? user.preferences.levels : surveyPreferences.levels,
    formats: user.preferences.formats.length > 0 ? user.preferences.formats : surveyPreferences.formats as typeof user.preferences.formats,
    days: user.preferences.days.length > 0 ? user.preferences.days : surveyPreferences.days,
    timeFrom: user.preferences.timeFrom ?? surveyPreferences.timeFrom,
  };
  const plannedCount = favorites.filter((item) => item.kind === "planned").length;
  const likedCount = favorites.filter((item) => item.kind === "liked").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader name={user.name} avatarEmoji={user.avatarEmoji} avatarUrl={user.avatarUrl} />

      <div className="flex min-h-[calc(100vh-65px)]">
        <DashboardSidebar streak={0} active="account" />
        <main className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 lg:py-8 lg:pb-8">
        <section className="overflow-hidden rounded-2xl border border-line bg-zinc-900/45">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
          {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- imported public social profile image
                <img src={user.avatarUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl border border-violet/25 object-cover" />
          ) : user.avatarEmoji ? (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet/25 bg-violet/10 text-3xl">
              {user.avatarEmoji}
            </span>
          ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-zinc-800 text-muted">
                  <PersonIcon className="h-7 w-7" />
            </span>
          )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Twoje konto</p>
                <h1 className="mt-1 truncate font-heading text-2xl font-semibold text-zinc-50">{user.name}</h1>
                <p className="truncate text-sm text-muted">{user.email}</p>
            {(user.instagramUrl || user.facebookUrl) && (
              <div className="mt-1 flex gap-3 text-xs">
                {user.instagramUrl && (
                  <a href={user.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-peach">
                    Instagram ↗
                  </a>
                )}
                {user.facebookUrl && (
                  <a href={user.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-peach">
                    Facebook ↗
                  </a>
                )}
              </div>
            )}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link href="/#moj-plan" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
                Wróć do panelu
              </Link>
              <form action={logout}>
                <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-zinc-100">
                  Wyloguj się
                </button>
              </form>
            </div>
          </div>

          <nav className="grid border-t border-line sm:grid-cols-2 xl:grid-cols-4" aria-label="Skróty konta">
            <Link href="/#moj-plan" className="group flex items-center gap-3 border-b border-line px-5 py-4 hover:bg-zinc-900/70 sm:border-r xl:border-b-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><CalendarIcon className="h-4 w-4" /></span>
              <span><span className="block text-sm font-semibold text-zinc-100 group-hover:text-accent">Mój plan</span><span className="block text-xs text-muted">{plannedCount} zapisanych</span></span>
            </Link>
            <Link href="/grafik" className="group flex items-center gap-3 border-b border-line px-5 py-4 hover:bg-zinc-900/70 xl:border-b-0 xl:border-r">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><PlusIcon className="h-4 w-4" /></span>
              <span><span className="block text-sm font-semibold text-zinc-100 group-hover:text-accent">Znajdź zajęcia</span><span className="block text-xs text-muted">Dodaj je do swojego planu</span></span>
            </Link>
            <Link href="/#ulubione" className="group flex items-center gap-3 border-b border-line px-5 py-4 hover:bg-zinc-900/70 sm:border-b-0 sm:border-r">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet/10 text-violet"><HeartIcon className="h-4 w-4" filled /></span>
              <span><span className="block text-sm font-semibold text-zinc-100 group-hover:text-violet">Ulubione</span><span className="block text-xs text-muted">{likedCount} polubionych</span></span>
            </Link>
            <Link href="/podsumowanie" className="group flex items-center gap-3 px-5 py-4 hover:bg-zinc-900/70">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300"><TrophyIcon className="h-4 w-4" /></span>
              <span><span className="block text-sm font-semibold text-zinc-100 group-hover:text-accent">Postępy</span><span className="block text-xs text-muted">Zobacz statystyki</span></span>
            </Link>
          </nav>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section className="rounded-2xl border border-line bg-zinc-900/45 p-5 sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Profil publiczny</p>
              <h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Twoje informacje</h2>
              <p className="mt-1 text-sm text-muted">Uzupełnij tylko to, co chcesz pokazywać innym tancerzom.</p>
            </div>
            <ProfileForm
              name={user.name}
              avatarEmoji={user.avatarEmoji}
              avatarUrl={user.avatarUrl}
              bio={user.bio}
              instagramUrl={user.instagramUrl}
              facebookUrl={user.facebookUrl}
            />
          </section>

          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-line bg-zinc-900/45 p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300"><PersonIcon className="h-4 w-4" /></span>
                <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet">Bezpieczeństwo</p><h2 className="mt-1 font-heading text-lg font-semibold text-zinc-50">Hasło do konta</h2></div>
              </div>
              <details className="group mt-4 border-t border-line pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-300 hover:text-zinc-50 [&::-webkit-details-marker]:hidden">
                  Zmień hasło
                  <ChevronDownIcon className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-4"><PasswordForm /></div>
              </details>
            </section>

            <section className="overflow-hidden rounded-2xl border border-accent/25 bg-accent/[0.06] p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent"><PlusIcon className="h-4 w-4" /></span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Twój plan</p>
              <h2 className="mt-1 font-heading text-lg font-semibold text-zinc-50">Dodaj kolejne zajęcia</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Otwórz grafik, wybierz zajęcia i kliknij „Dodaj do planu”. Eksport do kalendarza telefonu znajdziesz w szczegółach zajęć.</p>
              <Link href="/grafik" className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"><PlusIcon className="h-4 w-4" />Przejdź do grafiku</Link>
            </section>
          </div>
        </div>

        <section id="preferencje" className="scroll-mt-24 rounded-2xl border border-line bg-zinc-900/45 p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Dopasowanie zajęć</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Twoje preferencje</h2>
            <p className="mt-1 text-sm text-muted">Te ustawienia sterują propozycjami w panelu. Będą też zgodne z ankietą startową.</p>
          </div>
          <PreferencesForm preferences={editablePreferences} city={user.city} district={user.district} maxDistanceKm={user.maxDistanceKm} publicProfile={user.publicProfile} />
        </section>
        <section id="powiadomienia" className="scroll-mt-24 rounded-2xl border border-line bg-zinc-900/45 p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Przypomnienia</p>
            <h2 className="mt-1 font-heading text-xl font-semibold text-zinc-50">Powiadomienia</h2>
            <p className="mt-1 text-sm text-muted">Wybierz, o czym BachaTo ma Ci przypominać.</p>
          </div>
          <NotificationSettingsForm preferences={notificationPreferences} />
        </section>
        </main>
        <DashboardBottomNav active="account" />
      </div>
    </div>
  );
}
