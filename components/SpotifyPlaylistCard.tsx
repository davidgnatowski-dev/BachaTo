export interface SpotifyPlaylist {
  id: string;
  title: string;
  description: string;
  source: string;
  thumbnail: string;
}

export function SpotifyPlaylistCard({ playlist }: { playlist: SpotifyPlaylist }) {
  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-zinc-900/70 p-4 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
      <div>
        <h3 className="font-heading text-base font-semibold text-zinc-50">{playlist.title}</h3>
        <p className="mt-1 text-sm text-muted">{playlist.description}</p>
        <p className="mt-2 text-xs text-zinc-400">{playlist.source}</p>
      </div>

      <iframe
        title={`Spotify — ${playlist.title}`}
        src={`https://open.spotify.com/embed/playlist/${playlist.id}?utm_source=generator&theme=0`}
        width="100%"
        height="352"
        loading="lazy"
        referrerPolicy="origin-when-cross-origin"
        className="rounded-xl border-0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <p className="self-center text-xs text-muted">Odtwarzaj przyciskiem ▶ w odtwarzaczu powyżej.</p>
        <a href={`https://open.spotify.com/playlist/${playlist.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Otwórz w Spotify: ${playlist.title} (nowa karta)`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-line px-4 py-3 text-center text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet">
          Otwórz w Spotify <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </div>
    </article>
  );
}
