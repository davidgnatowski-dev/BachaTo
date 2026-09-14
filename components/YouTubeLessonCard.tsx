"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export function YouTubeLessonCard({ videoId, title, lessonNumber, instructor }: { videoId: string; title: string; lessonNumber: number; instructor: string }) {
  const [playing, setPlaying] = useState(false);
  const [pageOrigin, setPageOrigin] = useState("");
  const playerRef = useRef<HTMLIFrameElement>(null);

  function openFullscreen() {
    void playerRef.current?.requestFullscreen();
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-zinc-900/70 shadow-[0_12px_30px_rgba(0,0,0,.18)]">
      <div className="relative aspect-video overflow-hidden bg-zinc-950">
        {playing ? (
          <>
            <iframe
              ref={playerRef}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(pageOrigin)}&widget_referrer=${encodeURIComponent(pageOrigin)}`}
              title={`${title} — lekcja ${lessonNumber}`}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="origin-when-cross-origin"
              allowFullScreen
            />
            <button type="button" onClick={openFullscreen} className="absolute right-3 top-3 z-10 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition-colors hover:bg-accent" aria-label={`Odtwórz ${title} na pełnym ekranie`}>
              <span aria-hidden="true">⛶</span> Pełny ekran
            </button>
          </>
        ) : (
          <button type="button" onClick={() => { setPageOrigin(window.location.origin); setPlaying(true); }} className="group absolute inset-0 h-full w-full cursor-pointer text-left" aria-label={`Odtwórz: ${title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail generated from the video id */}
            <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={`Miniatura: ${title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] group-hover:opacity-80" loading="lazy" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-xl text-white shadow-xl transition-transform group-hover:scale-110" aria-hidden="true">▶</span>
          </button>
        )}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet">Lekcja {lessonNumber}</p>
        <h3 className="mt-1 font-heading text-base font-semibold text-zinc-50">{title}</h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-xs">
          <p className="text-muted">Instruktor: <Link href={`/instruktorzy/${encodeURIComponent(instructor)}`} className="font-semibold text-violet hover:text-accent">{instructor}</Link></p>
          <Link href={`/grafik?instructor=${encodeURIComponent(instructor)}`} className="rounded-full bg-accent px-3 py-2 font-semibold text-white hover:bg-accent-dark">Informacje o zajęciach →</Link>
        </div>
      </div>
    </article>
  );
}
