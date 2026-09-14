import Image from "next/image";
import Link from "next/link";
import { ChevronDownIcon, PersonIcon, PinIcon, SearchIcon } from "@/components/icons";
import { NotificationBell } from "@/components/NotificationBell";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";

export function DashboardHeader({ name, avatarEmoji, avatarUrl }: { name: string; avatarEmoji: string | null; avatarUrl: string | null }) {
  return (
    <header className="flex min-h-16 items-center gap-3 border-b border-line/80 bg-[#0b0e16]/95 px-4 py-3 backdrop-blur sm:px-6 xl:px-8">
      <Link href="/" className="shrink-0" aria-label="BachaTo — strona główna">
        <Image src="/brand/logo-v4.png" alt="BachaTo" width={1254} height={1254} priority className="h-14 w-auto" />
      </Link>

      <form action="/szukaj" className="mx-auto hidden w-full max-w-3xl items-center gap-2 lg:flex">
        <SearchAutocomplete rounded="rounded-xl" />
        <div className="flex items-center gap-2 rounded-xl border border-line bg-zinc-950/70 px-3.5 py-2.5 text-sm text-zinc-300">
          <PinIcon className="h-4 w-4 text-accent" />
          Warszawa
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href="/szukaj"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-zinc-300 hover:border-accent/50 hover:text-accent lg:hidden"
          aria-label="Szukaj"
        >
          <SearchIcon className="h-4 w-4" />
        </Link>
        <NotificationBell />
        <details className="group relative">
          <summary aria-label="Otwórz menu użytkownika" className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-line bg-zinc-900/70 p-1 pr-2 text-sm text-zinc-200 hover:border-zinc-500 [&::-webkit-details-marker]:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet/15 text-sm text-violet">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- imported public social profile image
                <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : avatarEmoji || <PersonIcon className="h-4 w-4" />}
            </span>
            <span className="hidden max-w-28 truncate font-medium sm:block">{name}</span>
            <ChevronDownIcon className="hidden h-3.5 w-3.5 text-muted transition-transform group-open:rotate-180 sm:block" />
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-zinc-950 p-2 shadow-2xl">
            <Link href="/" className="block rounded-lg px-3 py-2 text-sm font-semibold text-accent hover:bg-zinc-900">Mój panel</Link>
            <Link href="/#moj-plan" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Mój plan</Link>
            <Link href="/grafik" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Znajdź zajęcia</Link>
            <Link href="/#ulubione" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Ulubione</Link>
            <Link href="/podsumowanie" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">
              Statystyki
            </Link>
            <Link href="/nauka" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Nauka</Link>
            <Link href="/muzyka" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Muzyka</Link>
            <div className="my-1 border-t border-line" />
            <Link href="/konto" className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50">Profil i ustawienia</Link>
          </div>
        </details>
      </div>
    </header>
  );
}
