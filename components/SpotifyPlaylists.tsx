import { SpotifyPlaylistCard, type SpotifyPlaylist } from "@/components/SpotifyPlaylistCard";

const playlists = [
  { id: "6t0D6d4c6P5Lpbix4WkXwT", title: "Playlista dla początkujących", description: "Muzyka do pierwszych kroków i ćwiczenia rytmu.", source: "Bachata dla początkujących · david.gnatowski", thumbnail: "https://mosaic.scdn.co/300/ab67616d00001e024bc0d6ed1344e6766f5ce6d0ab67616d00001e024bd9f4980c15c7970f50847fab67616d00001e028b67c68e7876e20342d79f92ab67616d00001e0291750ed467a5ecc14beaa03f" },
  { id: "2C1BsWsuAiuO35wA8rDqA3", title: "Open", description: "Bachata do swobodnego tańca, niezależnie od poziomu.", source: "Bachata 2026 · Ritmo", thumbnail: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da846cf79f997328f0c90d16a842" },
  { id: "3E2TUjqhv1CYMKv8ehKvS2", title: "BachaZouk", description: "Bachata i zouk do ćwiczenia płynności oraz prowadzenia.", source: "Spotify", thumbnail: "https://mosaic.scdn.co/300/ab67616d00001e0220de42d7224faf496e9805f1ab67616d00001e022e5d1b11c255503e96c96dfaab67616d00001e02bfd7b591d9e3297d80fa67e8ab67616d00001e02f2d644b51f2a1045733aad21" },
  { id: "5eZhvw359xusYO4dUhUiJ1", title: "Bachata Favorites", description: "Ulubione utwory bachata do treningu i tańca na socialu.", source: "Spotify", thumbnail: "https://mosaic.scdn.co/300/ab67616d00001e020da0cdca7314631d8fae6841ab67616d00001e022794a1fb8646d37ed7098c21ab67616d00001e028d497ed4d7834cf8be5f3bb8ab67616d00001e02ee36a7da02c7aa4b90b48422" },
] satisfies SpotifyPlaylist[];

export function SpotifyPlaylists() {
  return (
    <section aria-labelledby="spotify-heading" className="rounded-2xl border border-line bg-zinc-900/35 p-4 sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Playlisty Spotify</p>
        <h2 id="spotify-heading" className="mt-1 font-heading text-xl font-semibold text-zinc-50">Twój rytm na start</h2>
        <p className="mt-1 text-sm text-muted">Włącz muzykę i ćwicz bez opuszczania BachaTo.</p>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {playlists.map((playlist) => (
          <SpotifyPlaylistCard key={playlist.id} playlist={playlist} />
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Aby zapisać playlistę w swojej bibliotece, otwórz ją w Spotify.
      </p>
    </section>
  );
}
