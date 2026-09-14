import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { SpotifyPlaylists } from "@/components/SpotifyPlaylists";

export const metadata: Metadata = {
  title: "Muzyka do bachaty — BachaTo",
  description: "Playlisty Spotify do nauki, ćwiczeń i tańczenia bachaty.",
};

export default function MusicPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <Header />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet">Słuchaj i ćwicz</p>
        <h1 className="mt-1 font-heading text-2xl font-semibold text-zinc-50">Muzyka</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Włącz playlistę przed zajęciami albo podczas samodzielnego treningu. Możesz też otworzyć ją w Spotify i zapisać w swojej bibliotece.
        </p>
      </header>
      <SpotifyPlaylists />
    </div>
  );
}
