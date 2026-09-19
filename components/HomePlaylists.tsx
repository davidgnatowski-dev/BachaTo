import Link from "next/link";

const PLAYLISTS = [
  { id: "6t0D6d4c6P5Lpbix4WkXwT", title: "Pierwsze kroki", description: "Spokojniejsze utwory do rytmu i podstaw." },
  { id: "5eZhvw359xusYO4dUhUiJ1", title: "Bachata Favorites", description: "Wyselekcjonowana muzyka do treningu i socialu." },
] as const;

export function HomePlaylists() {
  return (
    <section className="overflow-hidden rounded-3xl border border-violet/25 bg-[radial-gradient(circle_at_top_right,rgba(156,77,255,.16),transparent_42%),#10131c] p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet">Słuchaj i ćwicz</p><h2 className="mt-1 font-heading text-2xl font-bold text-white">Wyselekcjonowana muzyka do bachaty</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Włącz playlistę przed zajęciami, podczas treningu w domu albo wtedy, gdy po prostu chcesz poczuć rytm.</p></div>
        <Link href="/muzyka" className="text-sm font-semibold text-violet hover:text-white">Wszystkie playlisty →</Link>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {PLAYLISTS.map((playlist) => <article key={playlist.id} className="rounded-2xl border border-line bg-black/25 p-3"><div className="mb-3 px-1"><h3 className="font-heading font-semibold text-zinc-100">{playlist.title}</h3><p className="mt-1 text-xs text-muted">{playlist.description}</p></div><iframe title={`Spotify — ${playlist.title}`} src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`} width="100%" height="152" loading="lazy" referrerPolicy="origin-when-cross-origin" className="rounded-xl border-0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" /></article>)}
      </div>
    </section>
  );
}
